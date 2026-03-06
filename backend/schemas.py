from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional

# --- USER SCHEMAS (FR1) ---
class UserCreate(BaseModel):
    username: str
    password: str
    roles: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    roles: Optional[str] = None

class UserResponse(BaseModel):
    user_id: int
    username: str
    roles: str
    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    username: str
    password: str

# --- TOKEN SCHEMAS ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int

# --- RESIDENT SCHEMAS (FR2) ---
class ResidentBase(BaseModel):
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    birthday: date
    gender: str
    address: str
    contact: str

class ResidentCreate(ResidentBase):
    username: str
    password: str

class ResidentUpdate(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    birthday: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    contact: Optional[str] = None

class ResidentResponse(ResidentBase):
    resident_id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)

# --- ANNOUNCEMENT SCHEMAS (FR4 & FR9) ---
class AnnouncementBase(BaseModel):
    title: str
    content: str
    date_posted: date

class AnnouncementCreate(AnnouncementBase):
    pass 

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    date_posted: Optional[date] = None

class AnnouncementResponse(AnnouncementBase):
    announcement_id: int
    created_by: int
    model_config = ConfigDict(from_attributes=True)

# --- FEEDBACK SCHEMAS (FR5 & FR10) ---
class FeedbackBase(BaseModel):
    subject: str
    content: str

class FeedbackCreate(FeedbackBase):
    pass 

class FeedbackResponse(FeedbackBase):
    feedback_id: int
    created_by: int
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)