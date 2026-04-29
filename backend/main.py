from fastapi import FastAPI, Depends, HTTPException, status, Response, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import bcrypt
import jwt
from datetime import datetime, timedelta
import typing
from fastapi.responses import StreamingResponse
from fpdf import FPDF
import io
import models
import schemas
import shutil
import os

UPLOAD_DIR = "static/profile_pics"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

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
app.mount("/static", StaticFiles(directory="static"), name="static")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
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
    def __init__(self, allowed_roles: typing.List[str]):
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

@app.get("/api/users/", response_model=typing.List[schemas.UserResponse], tags=["FR1: User Management"])
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
async def create_resident(
    username: str = Form(...),
    password: str = Form(...),
    first_name: str = Form(...),
    middle_name: str = Form(None),
    last_name: str = Form(...),
    birthday: str = Form(...), # Frontend sends this as a string "YYYY-MM-DD"
    gender: str = Form(...),
    civil_status: str = Form(...),
    address: str = Form(...),
    contact: str = Form(...),
    email: str = Form(None),
    file: UploadFile = File(None), # The profile image
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_super_admin)
):
    # 1. Check if user exists
    if db.query(models.User).filter(models.User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # 2. Create the System Account first
    hashed_password = get_password_hash(password)
    new_user = models.User(username=username, password=hashed_password, roles="Resident")
    db.add(new_user)
    db.flush() # This generates the user_id without finishing the transaction

    # 3. Handle the Image File
    filename = None
    if file:
        # Create a unique name: e.g., "user_10_profile.jpg"
        extension = os.path.splitext(file.filename)[1]
        filename = f"user_{new_user.user_id}_profile{extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    # 4. Create the Resident Profile
    new_resident = models.Resident(
        user_id=new_user.user_id,
        first_name=first_name,
        middle_name=middle_name,
        last_name=last_name,
        birthday=birthday,
        gender=gender,
        civil_status=civil_status,
        address=address,
        contact=contact,
        email=email,
        profile_image=filename # Store just the filename string in DB
    )
    
    db.add(new_resident)
    db.commit() # Save both User and Resident at once
    db.refresh(new_resident)
    return new_resident

@app.get("/api/residents/", response_model=typing.List[schemas.ResidentResponse], tags=["FR2: Resident Management"])
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

@app.get("/api/announcements/", response_model=typing.List[schemas.AnnouncementResponse], tags=["FR9: Announcements"])
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

@app.post("/api/feedback/", response_model=schemas.FeedbackResponse, tags=["FR10: Feedback"])
def submit_feedback(
    feedback: schemas.FeedbackCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_resident) 
):
    """
    FR10: Allows Residents to submit feedback or complaints. 
    (Automatically attaches their user_id to the submission).
    """
    new_feedback = models.Feedback(
        subject=feedback.subject,
        content=feedback.content,
        created_by=current_user.user_id,
        timestamp=datetime.now()
    )
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    return new_feedback

@app.get("/api/feedback/", tags=["FR5: Feedback Management"])
def get_all_feedback(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_official)
):
    """
    FR5: Allows Barangay Officials and Super Admin to view all resident feedback.
    Joins with the Resident table to display names.
    """
    results = db.query(
        models.Feedback, 
        models.Resident.first_name, 
        models.Resident.last_name
    ).join(
        models.Resident, models.Feedback.created_by == models.Resident.user_id
    ).order_by(
        models.Feedback.timestamp.desc()
    ).all()
    
    return [
        {
            "feedback_id": f.Feedback.feedback_id,
            "name": f"{f.first_name} {f.last_name}",
            "activity": "Feedback Submitted",
            "description": f.Feedback.subject,
            "content": f.Feedback.content,
            "date": f.Feedback.timestamp.strftime("%m-%d-%Y")
        } for f in results
    ]
@app.delete("/api/feedback/{feedback_id}", tags=["FR5: Feedback Management"])
def delete_feedback(
    feedback_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_official) # Strictly blocks Residents
):
    """
    FR5: Allows Barangay Officials to resolve and delete a feedback ticket.
    """
    feedback_item = db.query(models.Feedback).filter(models.Feedback.feedback_id == feedback_id).first()
    
    if not feedback_item:
        raise HTTPException(status_code=404, detail="Feedback not found")
        
    db.delete(feedback_item)
    db.commit()
    return {"message": "Feedback successfully deleted"}

# -----------------------------------------------------------------
# ADMIN & OFFICIAL PROFILE MANAGEMENT MODULE
# -----------------------------------------------------------------

@app.post("/api/admins/", response_model=schemas.AdminResponse, tags=["Admin Profiles"])
def create_admin_profile(
    admin: schemas.AdminCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_super_admin)
):
    """
    Creates a profile for the Super Admin with their personal information.
    """
    new_admin = models.Admin(
        user_id=current_user.user_id,
        first_name=admin.first_name,
        middle_name=admin.middle_name,
        last_name=admin.last_name,
        birthday=admin.birthday,
        gender=admin.gender,
        contact=admin.contact
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin

@app.get("/api/admins/", response_model=typing.List[schemas.AdminResponse], tags=["Admin Profiles"])
def get_admin_profiles(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_super_admin)
):
    """
    Allows Super Admin to view all admin profiles.
    """
    return db.query(models.Admin).all()

@app.put("/api/admins/{admin_id}", response_model=schemas.AdminResponse, tags=["Admin Profiles"])
def update_admin_profile(
    admin_id: int, 
    updated_data: schemas.AdminUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_super_admin)
):
    """
    Allows Super Admin to update their own profile information.
    """
    admin = db.query(models.Admin).filter(models.Admin.admin_id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin profile not found")
        
    for key, value in updated_data.model_dump(exclude_unset=True).items():
        setattr(admin, key, value)
        
    db.commit()
    db.refresh(admin)
    return admin

@app.post("/api/officials/", response_model=schemas.OfficialResponse, tags=["Official Profiles"])
def create_official_profile(
    official: schemas.OfficialCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_super_admin)
):
    """
    Creates a profile for Barangay Officials with their personal information.
    """
    new_official = models.Official(
        user_id=official.user_id,  # Links to existing user account
        first_name=official.first_name,
        middle_name=official.middle_name,
        last_name=official.last_name,
        birthday=official.birthday,
        gender=official.gender,
        contact=official.contact
    )
    db.add(new_official)
    db.commit()
    db.refresh(new_official)
    return new_official

@app.get("/api/officials/", response_model=typing.List[schemas.OfficialResponse], tags=["Official Profiles"])
def get_official_profiles(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_super_admin)
):
    """
    Allows Super Admin to view all official profiles.
    """
    return db.query(models.Official).all()

@app.put("/api/officials/{official_id}", response_model=schemas.OfficialResponse, tags=["Official Profiles"])
def update_official_profile(
    official_id: int, 
    updated_data: schemas.OfficialUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_super_admin)
):
    """
    Allows Super Admin to update official profile information.
    """
    official = db.query(models.Official).filter(models.Official.official_id == official_id).first()
    if not official:
        raise HTTPException(status_code=404, detail="Official profile not found")
        
    for key, value in updated_data.model_dump(exclude_unset=True).items():
        setattr(official, key, value)
        
    db.commit()
    db.refresh(official)
    return official

# -----------------------------------------------------------------
# SYSTEM SETTINGS MODULE
# -----------------------------------------------------------------

@app.post("/api/system-settings/", response_model=schemas.SystemSettingResponse, tags=["System Settings"])
def create_system_setting(
    setting: schemas.SystemSettingCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_super_admin)
):
    """
    Allows Super Admin to create new system configuration settings.
    """
    new_setting = models.SystemSetting(
        config_key=setting.config_key,
        config_value=setting.config_value
    )
    db.add(new_setting)
    db.commit()
    db.refresh(new_setting)
    return new_setting

@app.get("/api/system-settings/", response_model=typing.List[schemas.SystemSettingResponse], tags=["System Settings"])
def get_system_settings(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_super_admin)
):
    """
    Allows Super Admin to view all system configuration settings.
    """
    return db.query(models.SystemSetting).all()

@app.put("/api/system-settings/{system_id}", response_model=schemas.SystemSettingResponse, tags=["System Settings"])
def update_system_setting(
    system_id: int, 
    updated_data: schemas.SystemSettingUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_super_admin)
):
    """
    Allows Super Admin to update system configuration settings.
    """
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.system_id == system_id).first()
    if not setting:
        raise HTTPException(status_code=404, detail="System setting not found")
        
    for key, value in updated_data.model_dump(exclude_unset=True).items():
        setattr(setting, key, value)
        
    db.commit()
    db.refresh(setting)
    return setting

@app.delete("/api/system-settings/{system_id}", tags=["System Settings"])
def delete_system_setting(
    system_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_super_admin)
):
    """
    Allows Super Admin to delete system configuration settings.
    """
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.system_id == system_id).first()
    if not setting:
        raise HTTPException(status_code=404, detail="System setting not found")
        
    db.delete(setting)
    db.commit()
    return {"message": "System setting successfully deleted"}

# -----------------------------------------------------------------
# AUDIT LOGS MODULE
# -----------------------------------------------------------------

@app.get("/api/audit-logs/", response_model=typing.List[schemas.AuditLogResponse], tags=["Audit Logs"])
def get_audit_logs(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_super_admin)
):
    """
    Allows Super Admin to view all audit logs for system monitoring and compliance.
    """
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()

@app.post("/api/audit-logs/", response_model=schemas.AuditLogResponse, tags=["Audit Logs"])
def create_audit_log(
    audit_log: schemas.AuditLogCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_super_admin)
):
    """
    Allows Super Admin to manually create audit log entries.
    """
    new_audit_log = models.AuditLog(
        user_id=audit_log.user_id,
        action_type=audit_log.action_type,
        timestamp=datetime.now()
    )
    db.add(new_audit_log)
    db.commit()
    db.refresh(new_audit_log)
    return new_audit_log

# -----------------------------------------------------------------
# REPORTS MODULE
# -----------------------------------------------------------------

@app.post("/api/reports/", response_model=schemas.ReportResponse, tags=["Reports"])
def create_report(
    report: schemas.ReportCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_official)
):
    """
    FR: Generates report data based on Type (Announcement/Feedback).
    Includes logic for 'Main Idea' and Resident Name association.
    """
    
    # This string will hold the summarized text that goes into the report file
    generated_content = ""
    
    if report.report_type == "Announcement":
        # Fetch announcements within the date range
        items = db.query(models.Announcement).filter(
            models.Announcement.date_posted >= report.start_date,
            models.Announcement.date_posted <= report.end_date
        ).all()
        
        # Summarize: Title + a slice of the content
        generated_content = "\n".join([
            f"[{a.date_posted}] {a.title}: {a.content[:150]}..." 
            for a in items
        ]) if items else "No announcements found."

    elif report.report_type == "Feedback":
        # Join with Resident table to get the full names
        items = db.query(
            models.Feedback, models.Resident.first_name, models.Resident.last_name
        ).join(
            models.Resident, models.Feedback.created_by == models.Resident.user_id
        ).filter(
            models.Feedback.timestamp >= report.start_date,
            models.Feedback.timestamp <= report.end_date
        ).all()
        
        # Summarize: Resident Name + their actual feedback
        generated_content = "\n".join([
            f"Resident: {f.first_name} {f.last_name} | Subject: {f.Feedback.subject} | Message: {f.Feedback.content}" 
            for f in items
        ]) if items else "No feedback entries found."

    # SAVE THE RECORD TO THE DATABASE
    new_report = models.Report(
        title=report.title,
        file_format=report.file_format, # This handles your PDF/DOCX radio buttons
        report_type=report.report_type,
        start_date=report.start_date,
        end_date=report.end_date
        # Note: If you have a 'content' column in your Report model, 
        # you should add: content=generated_content
    )
    
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

@app.get("/api/reports/", response_model=typing.List[schemas.ReportResponse], tags=["Reports"])
def get_reports(db: Session = Depends(get_db), current_user: models.User = Depends(require_official)):
    return db.query(models.Report).order_by(models.Report.start_date.desc()).all()

@app.get("/api/reports/download/{report_id}", tags=["Reports"])
def download_report(report_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_official)):
    report = db.query(models.Report).filter(models.Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # --- 1. RE-FETCH THE DATA FOR THE PDF ---
    report_content = []
    
    if report.report_type == "Announcement":
        items = db.query(models.Announcement).filter(
            models.Announcement.date_posted >= report.start_date,
            models.Announcement.date_posted <= report.end_date
        ).all()
        for a in items:
            report_content.append(f"[{a.date_posted}] {a.title}\nSummary: {a.content[:150]}...\n")
            
    elif report.report_type == "Feedback":
        items = db.query(
            models.Feedback, models.Resident.first_name, models.Resident.last_name
        ).join(
            models.Resident, models.Feedback.created_by == models.Resident.user_id
        ).filter(
            models.Feedback.timestamp >= report.start_date,
            models.Feedback.timestamp <= report.end_date
        ).all()
        for f in items:
            report_content.append(f"Resident: {f.first_name} {f.last_name}\nSubject: {f.Feedback.subject}\nMessage: {f.Feedback.content}\n")

    # --- 2. GENERATE ACTUAL PDF ---
    pdf = FPDF()
    pdf.add_page()
    
    # Header Styling
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, txt="BARANGAY 133 - OFFICIAL SUMMARY REPORT", ln=True, align='C')
    pdf.ln(10)
    
    # Info Section
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, txt=f"Report: {report.title}", ln=True)
    pdf.set_font("Arial", '', 11)
    pdf.cell(0, 10, txt=f"Type: {report.report_type}", ln=True)
    pdf.cell(0, 10, txt=f"Period: {report.start_date} to {report.end_date}", ln=True)
    pdf.ln(5)
    pdf.cell(0, 0, border="T", ln=True) # Horizontal Line
    pdf.ln(5)

    # Content Section
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, txt="GENERATED DATA:", ln=True)
    pdf.ln(2)
    
    pdf.set_font("Arial", '', 10)
    if not report_content:
        pdf.multi_cell(0, 10, txt="No data found for the selected period.")
    else:
        for entry in report_content:
            # Multi_cell handles long text wrapping automatically
            pdf.multi_cell(0, 7, txt=entry)
            pdf.ln(2)

    # --- 3. SEND AS PROPER PDF ---
    # pdf.output(dest='S') returns a string, we encode it to bytes
    pdf_bytes = pdf.output(dest='S').encode('latin-1')
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={report.title.replace(' ', '_')}.pdf"
        }
    )

@app.delete("/api/reports/{report_id}", tags=["Reports"])
def delete_report(report_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_official)):
    report = db.query(models.Report).filter(models.Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    db.delete(report)
    db.commit()
    return {"message": "Report successfully deleted"}
# -----------------------------------------------------------------
# GARBAGE TRUCK MONITORING & NOTIFICATION MODULE
# -----------------------------------------------------------------

@app.post("/api/detections/", response_model=schemas.DetectionLogResponse, tags=["Hardware Integration"])
def create_detection_log(
    log: schemas.DetectionLogCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_official) # Pi authenticates as an Official
):
    """
    Records an AI object detection event from the Raspberry Pi camera.
    """
    new_log = models.DetectionLog(
        timestamp=datetime.now(),
        confidence_score=log.confidence_score,
        image_path=log.image_path,
        notification_status=log.notification_status
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@app.get("/api/detections/", response_model=typing.List[schemas.DetectionLogResponse], tags=["Hardware Integration"])
def get_detection_logs(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_official) # Blocks Residents
):
    """
    Allows Barangay Officials to monitor the garbage truck's route and AI logs.
    """
    return db.query(models.DetectionLog).order_by(models.DetectionLog.timestamp.desc()).all()


@app.post("/api/notifications/", response_model=schemas.NotificationResponse, tags=["Notifications"])
def create_notification(
    notification: schemas.NotificationCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_official) # Blocks Residents
):
    """
    Generates a notification for the community based on a specific detection log.
    """
    # Verify the detection log actually exists
    log_entry = db.query(models.DetectionLog).filter(models.DetectionLog.log_id == notification.log_id).first()
    if not log_entry:
        raise HTTPException(status_code=404, detail="Detection log not found")

    new_notification = models.Notification(
        log_id=notification.log_id,
        status=notification.status,
        sent_at=datetime.now()
    )
    db.add(new_notification)
    
    # Automatically update the log's status to reflect a notification was sent
    log_entry.notification_status = "Sent"
    
    db.commit()
    db.refresh(new_notification)
    return new_notification

@app.get("/api/notifications/", response_model=typing.List[schemas.NotificationResponse], tags=["Notifications"])
def get_notifications(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_resident) # Allows All 3 Roles
):
    """
    Allows Residents to fetch the latest garbage truck alerts on their mobile app.
    """
    return db.query(models.Notification).order_by(models.Notification.sent_at.desc()).all()

@app.get("/api/activity-history/", tags=["Activity History"])
def get_all_activity_history(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_official) # Changed to require_official
):
    """
    Allows Barangay Officials to view ALL resident activity.
    Joins with the User table to get the usernames for the 'Name' column.
    """
    # We join AuditLog with User to get the actual username string
    results = db.query(
        models.AuditLog, 
        models.User.username
    ).join(
        models.User, models.AuditLog.user_id == models.User.user_id
    ).order_by(
        models.AuditLog.timestamp.desc()
    ).all()
    
    # Format the data to match what your React table expects
    return [
        {
            "id": log.AuditLog.log_id,
            "username": log.username,
            "action_type": log.AuditLog.action_type,
            "details": "User performed a system action", # You can customize this
            "timestamp": log.AuditLog.timestamp,
            "status": "Success"
        } for log in results
    ]