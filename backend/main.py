from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import List

import models
import schemas

# --- DATABASE CONNECTION ---
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:@localhost:3306/barangay133_db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- APP INITIALIZATION ---
app = FastAPI(title="Barangay 133 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SECURITY CONTEXT (NFR5: bcrypt direct & JWT) ---
SECRET_KEY = "barangay133_super_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login/")

def get_password_hash(password: str):
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# --- ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE ---
class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: models.User = Depends(get_current_user)):
        if user.roles not in self.allowed_roles:
            raise HTTPException(status_code=403, detail="Operation not permitted for your role")
        return user

# The 3 Strict Roles Defined from the Document
require_super_admin = RoleChecker(["Super Admin"])
require_official = RoleChecker(["Super Admin", "Barangay Official"])
require_resident = RoleChecker(["Super Admin", "Barangay Official", "Resident"])

# -----------------------------------------------------------------
# ROOT ENDPOINT
# -----------------------------------------------------------------
@app.get("/")
def read_root():
    return {"status": "online", "message": "Backend is running and connected to MySQL!"}

# -----------------------------------------------------------------
# AUTHENTICATION ENDPOINT
# -----------------------------------------------------------------
@app.post("/api/login/", response_model=schemas.Token, tags=["Authentication"])
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
        
    access_token = create_access_token(data={"sub": db_user.username, "role": db_user.roles})
    return {"access_token": access_token, "token_type": "bearer", "role": db_user.roles, "user_id": db_user.user_id}

# -----------------------------------------------------------------
# FR1: SUPER ADMIN USER MANAGEMENT (Full CRUD)
# -----------------------------------------------------------------
@app.post("/api/users/", response_model=schemas.UserResponse, tags=["FR1: User Management"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Creates initial Super Admin without token, or regular users."""
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(username=user.username, password=hashed_password, roles=user.roles)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/api/users/", response_model=List[schemas.UserResponse], tags=["FR1: User Management"])
def get_users(db: Session = Depends(get_db), current_user: models.User = Depends(require_super_admin)):
    return db.query(models.User).all()

@app.put("/api/users/{user_id}", response_model=schemas.UserResponse, tags=["FR1: User Management"])
def update_user(user_id: int, updated_data: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(require_super_admin)):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if updated_data.username:
        user.username = updated_data.username
    if updated_data.password:
        user.password = get_password_hash(updated_data.password)
    if updated_data.roles:
        user.roles = updated_data.roles
        
    db.commit()
    db.refresh(user)
    return user

@app.delete("/api/users/{user_id}", tags=["FR1: User Management"])
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_super_admin)):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user)
    db.commit()
    return {"message": "User successfully deleted"}

# -----------------------------------------------------------------
# FR2: RESIDENT RECORDS MANAGEMENT (Full CRUD)
# -----------------------------------------------------------------
@app.post("/api/residents/", response_model=schemas.ResidentResponse, tags=["FR2: Resident Management"])
def create_resident(resident: schemas.ResidentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_super_admin)):
    if db.query(models.User).filter(models.User.username == resident.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(resident.password)
    new_user = models.User(username=resident.username, password=hashed_password, roles="Resident")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    new_resident = models.Resident(
        user_id=new_user.user_id,
        first_name=resident.first_name,
        middle_name=resident.middle_name,
        last_name=resident.last_name,
        birthday=resident.birthday,
        gender=resident.gender,
        address=resident.address,
        contact=resident.contact
    )
    db.add(new_resident)
    db.commit()
    db.refresh(new_resident)
    return new_resident

@app.get("/api/residents/", response_model=List[schemas.ResidentResponse], tags=["FR2: Resident Management"])
def get_residents(db: Session = Depends(get_db), current_user: models.User = Depends(require_super_admin)):
    return db.query(models.Resident).all()

@app.put("/api/residents/{resident_id}", response_model=schemas.ResidentResponse, tags=["FR2: Resident Management"])
def update_resident(resident_id: int, updated_data: schemas.ResidentUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(require_super_admin)):
    resident = db.query(models.Resident).filter(models.Resident.resident_id == resident_id).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found")
        
    for key, value in updated_data.model_dump(exclude_unset=True).items():
        setattr(resident, key, value)
        
    db.commit()
    db.refresh(resident)
    return resident

@app.delete("/api/residents/{resident_id}", tags=["FR2: Resident Management"])
def delete_resident(resident_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_super_admin)):
    resident = db.query(models.Resident).filter(models.Resident.resident_id == resident_id).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found")
    
    user_to_delete = db.query(models.User).filter(models.User.user_id == resident.user_id).first()
    if user_to_delete:
        db.delete(user_to_delete)
        db.commit()
        
    return {"message": "Resident and associated system account successfully deleted"}
# -----------------------------------------------------------------
# FR4 & FR9: ANNOUNCEMENT MANAGEMENT MODULE
# -----------------------------------------------------------------

@app.post("/api/announcements/", response_model=schemas.AnnouncementResponse, tags=["FR4: Announcements"])
def create_announcement(
    announcement: schemas.AnnouncementCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_official) # Blocks Residents
):
    """BR3: Allows Barangay Officials and Super Admin to create announcements."""
    new_announcement = models.Announcement(
        title=announcement.title,
        content=announcement.content,
        date_posted=announcement.date_posted,
        created_by=current_user.user_id  # Automatically secured via JWT Token
    )
    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)
    return new_announcement

@app.get("/api/announcements/", response_model=List[schemas.AnnouncementResponse], tags=["FR9: Announcements"])
def get_announcements(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_resident) # Allows All 3 Roles
):
    """BR4: Allows all users to view announcements. Displays newest first."""
    # Orders by date_posted descending, then by ID descending to strictly follow BR4
    return db.query(models.Announcement).order_by(
        models.Announcement.date_posted.desc(), 
        models.Announcement.announcement_id.desc()
    ).all()

@app.put("/api/announcements/{announcement_id}", response_model=schemas.AnnouncementResponse, tags=["FR4: Announcements"])
def update_announcement(
    announcement_id: int, 
    updated_data: schemas.AnnouncementUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_official) # Blocks Residents
):
    """BR3: Allows Barangay Officials to edit an existing announcement."""
    announcement = db.query(models.Announcement).filter(models.Announcement.announcement_id == announcement_id).first()
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    for key, value in updated_data.model_dump(exclude_unset=True).items():
        setattr(announcement, key, value)
        
    db.commit()
    db.refresh(announcement)
    return announcement

@app.delete("/api/announcements/{announcement_id}", tags=["FR4: Announcements"])
def delete_announcement(
    announcement_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_official) # Blocks Residents
):
    """BR3: Allows Barangay Officials to delete an announcement."""
    announcement = db.query(models.Announcement).filter(models.Announcement.announcement_id == announcement_id).first()
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    db.delete(announcement)
    db.commit()
    return {"message": "Announcement successfully deleted"}