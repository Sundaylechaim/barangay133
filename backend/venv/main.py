from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
from fastapi import File, UploadFile, Form
app = FastAPI()

# Enable CORS - Only needed once at the top
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="", 
        database="barangay133_db"
    )

# --- MODELS (The "Rules" for your data) ---

class LoginRequest(BaseModel):
    username: str
    password: str

class CreateUser(BaseModel):
    username: str
    role: str
    password: str
    confirmPassword: str # Added to match your form

# --- ENDPOINTS ---

@app.post("/api/login")
async def login(data: LoginRequest):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Specifically checks for admin/admin123
        query = "SELECT username, role FROM users WHERE username = %s AND password = %s"
        cursor.execute(query, (data.username, data.password))
        user = cursor.fetchone()
        
        if user:
            return {"status": "success", "username": user['username'], "role": user['role']}
        raise HTTPException(status_code=401, detail="Invalid credentials")
    finally:
        cursor.close()
        db.close()

@app.get("/api/users")
def get_all_users():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, username, role, status FROM users")
        return cursor.fetchall()
    finally:
        cursor.close()
        db.close()

@app.post("/api/users/add")
async def create_new_user(user: CreateUser):
    # Security check: do the passwords match?
    if user.password != user.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match!")

    db = get_db_connection()
    cursor = db.cursor()
    try:
        query = "INSERT INTO users (username, role, password, status) VALUES (%s, %s, %s, 'Active')"
        cursor.execute(query, (user.username, user.role, user.password))
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        db.close()

@app.get("/api/dashboard-stats")
async def get_dashboard_stats():
    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute("SELECT COUNT(*) FROM users")
        num_users = cursor.fetchone()[0]
        
        # Note: These tables must exist in phpMyAdmin or it will error!
        cursor.execute("SELECT COUNT(*) FROM residents")
        num_residents = cursor.fetchone()[0]
        
        return {
            "num_users": num_users,
            "num_residents": num_residents,
            "pending_feedback": 0 # Skipping feedback for now as requested
        }
    except:
        return {"num_users": 0, "num_residents": 0, "pending_feedback": 0}
    finally:
        cursor.close()
        db.close()

@app.delete("/api/users/delete/{user_id}")
async def delete_user(user_id: int):
    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        db.commit()
        return {"message": "Deleted"}
    finally:
        cursor.close()
        db.close()

@app.get("/api/residents")
def get_residents():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM residents")
        return cursor.fetchall()
    finally:
        cursor.close()
        db.close()

@app.put("/api/users/update/{user_id}")
async def update_user(user_id: int, data: CreateUser):
    db = get_db_connection()
    cursor = db.cursor()
    try:
        # This SQL targets ONLY the user with the matching ID
        query = "UPDATE users SET username=%s, role=%s, password=%s WHERE id=%s"
        cursor.execute(query, (data.username, data.role, data.password, user_id))
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        db.close()

@app.post("/api/residents/add")
async def add_resident(
    first_name: str = Form(...),
    middle_name: str = Form(None),
    last_name: str = Form(...),
    gender: str = Form(...),
    address: str = Form(...),
    mobile_number: str = Form(...),
    email: str = Form(...),
    birthday: str = Form(...),
    civil_status: str = Form(...),
    image: UploadFile = File(...)
):
    db = get_db_connection()
    cursor = db.cursor()
    try:
        # Read the image as binary data
        image_data = await image.read()

        # --- PASTE THE NEW QUERY HERE ---
        query = """INSERT INTO residents 
                   (first_name, middle_name, last_name, gender, address, 
                    mobile_number, email, birthday, civil_status, resident_image) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
        
        cursor.execute(query, (
            first_name, middle_name, last_name, gender, address, 
            mobile_number, email, birthday, civil_status, image_data
        ))
        # --------------------------------
        
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@app.put("/api/residents/update/{resident_id}")
async def update_resident(
    resident_id: int,
    full_name: str = Form(...),
    mobile: str = Form(...),
    birthday: str = Form(...),
    gender: str = Form(...),
    civil_status: str = Form(...),
    image: UploadFile = File(None) # Image is optional for updates
):
    db = get_db_connection()
    cursor = db.cursor()
    try:
        if image:
            image_data = await image.read()
            query = """UPDATE residents SET full_name=%s, mobile_number=%s, birthday=%s, 
                       gender=%s, civil_status=%s, resident_image=%s WHERE id=%s"""
            cursor.execute(query, (full_name, mobile, birthday, gender, civil_status, image_data, resident_id))
        else:
            query = """UPDATE residents SET full_name=%s, mobile_number=%s, birthday=%s, 
                       gender=%s, civil_status=%s WHERE id=%s"""
            cursor.execute(query, (full_name, mobile, birthday, gender, civil_status, resident_id))
        
        db.commit()
        return {"status": "success"}
    finally:
        db.close()
        