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

# --- DETECTION LOG SCHEMAS ---
class DetectionLogBase(BaseModel):
    confidence_score: float
    image_path: str
    notification_status: str

class DetectionLogCreate(DetectionLogBase):
    pass

class DetectionLogResponse(DetectionLogBase):
    log_id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)
    
class NotificationBase(BaseModel):
    log_id: int
    status: str

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    notification_id: int
    log_id: int
    sent_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- ADMIN & OFFICIAL PROFILE SCHEMAS ---
class AdminBase(BaseModel):
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    gender: str
    birthday: date
    contact: str

class AdminCreate(AdminBase):
    pass

class AdminUpdate(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    contact: Optional[str] = None

class AdminResponse(AdminBase):
    admin_id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)

class OfficialBase(BaseModel):
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    gender: str
    birthday: date
    contact: str

class OfficialCreate(OfficialBase):
    pass

class OfficialUpdate(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    contact: Optional[str] = None

class OfficialResponse(OfficialBase):
    official_id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)

# --- SYSTEM SETTINGS SCHEMAS ---
class SystemSettingBase(BaseModel):
    config_key: str
    config_value: str

class SystemSettingCreate(SystemSettingBase):
    pass

class SystemSettingUpdate(BaseModel):
    config_key: Optional[str] = None
    config_value: Optional[str] = None

class SystemSettingResponse(SystemSettingBase):
    system_id: int
    model_config = ConfigDict(from_attributes=True)

# --- AUDIT LOGS SCHEMAS ---
class AuditLogBase(BaseModel):
    user_id: int
    action_type: str

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogResponse(AuditLogBase):
    log_id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

# --- REPORTS SCHEMAS ---
class ReportBase(BaseModel):
    title: str
    file_format: str
    report_type: str
    start_date: date
    end_date: date

class ReportCreate(ReportBase):
    pass

class ReportUpdate(BaseModel):
    title: Optional[str] = None
    file_format: Optional[str] = None
    report_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class ReportResponse(ReportBase):
    report_id: int
    model_config = ConfigDict(from_attributes=True)
