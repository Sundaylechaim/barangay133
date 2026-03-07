from sqlalchemy import Column, Integer, String, Date, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = 'tbl_Users'
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    roles = Column(String)


class Resident(Base):
    __tablename__ = 'tbl_Residents'
    resident_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('tbl_Users.user_id', ondelete="CASCADE"))
    first_name = Column(String)
    middle_name = Column(String)
    last_name = Column(String)
    birthday = Column(Date)
    gender = Column(String)
    address = Column(Text)
    contact = Column(String)

class DetectionLog(Base):
    __tablename__ = 'tbl_DetectionLog'
    log_id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime)
    confidence_score = Column(Float)
    image_path = Column(String)
    notification_status = Column(String)

class Notification(Base):
    __tablename__ = 'tbl_Notifications'
    notification_id = Column(Integer, primary_key=True, index=True)
    log_id = Column(Integer, ForeignKey('tbl_DetectionLog.log_id', ondelete="CASCADE"))
    status = Column(String)
    sent_at = Column(DateTime)

class Announcement(Base):
    __tablename__ = 'tbl_Announcement'
    announcement_id = Column(Integer, primary_key=True, index=True)
    created_by = Column(Integer, ForeignKey('tbl_Users.user_id', ondelete="CASCADE"))
    title = Column(String)
    content = Column(Text)
    date_posted = Column(Date)

class Feedback(Base):
    __tablename__ = 'tbl_Feedback'
    feedback_id = Column(Integer, primary_key=True, index=True)
    created_by = Column(Integer, ForeignKey('tbl_Users.user_id', ondelete="CASCADE"))
    subject = Column(String)
    content = Column(Text)
    timestamp = Column(DateTime)

class Admin(Base):
    __tablename__ = 'tbl_Admin'
    admin_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('tbl_Users.user_id', ondelete="CASCADE"))
    first_name = Column(String)
    middle_name = Column(String)
    last_name = Column(String)
    gender = Column(String)
    birthday = Column(Date)
    contact = Column(String)

class Official(Base):
    __tablename__ = 'tbl_Official'
    official_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('tbl_Users.user_id', ondelete="CASCADE"))
    first_name = Column(String)
    middle_name = Column(String)
    last_name = Column(String)
    gender = Column(String)
    birthday = Column(Date)
    contact = Column(String)

class SystemSetting(Base):
    __tablename__ = 'tbl_SystemSettings'
    system_id = Column(Integer, primary_key=True, index=True)
    updated_by = Column(Integer, ForeignKey('tbl_Users.user_id', ondelete="CASCADE"))
    config_key = Column(String)
    config_value = Column(String)

class AuditLog(Base):
    __tablename__ = 'tbl_AuditLogs'
    log_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('tbl_Users.user_id', ondelete="CASCADE"))
    action_type = Column(String)
    timestamp = Column(DateTime)

class Report(Base):
    __tablename__ = 'tbl_Reports'
    report_id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    file_format = Column(String)
    report_type = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)
