CREATE DATABASE IF NOT EXISTS barangay133_db;
USE barangay133_db;

-- 1. Authentication Table
CREATE TABLE tbl_Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    roles VARCHAR(50) NOT NULL
);

-- 2. System Administrators
CREATE TABLE tbl_Admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    first_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    gender VARCHAR(50),
    birthday DATE,
    contact VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES tbl_Users(user_id) ON DELETE CASCADE
);

-- 3. Community Officials
CREATE TABLE tbl_Official (
    official_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    first_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    gender VARCHAR(50),
    birthday DATE,
    contact VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES tbl_Users(user_id) ON DELETE CASCADE
);

-- 4. Community Residents
CREATE TABLE tbl_Residents (
    resident_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    first_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    birthday DATE,
    gender VARCHAR(50),
    address TEXT,
    contact VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES tbl_Users(user_id) ON DELETE CASCADE
);

-- 5. AI Detection Events
CREATE TABLE tbl_DetectionLog (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME,
    confidence_score FLOAT,
    image_path VARCHAR(255),
    notification_status VARCHAR(50)
);

-- 6. Alerts Generated from Detection
CREATE TABLE tbl_Notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    log_id INT,
    status VARCHAR(50),
    sent_at DATETIME,
    FOREIGN KEY (log_id) REFERENCES tbl_DetectionLog(log_id) ON DELETE CASCADE
);

-- 7. Official Broadcast Messages
CREATE TABLE tbl_Announcement (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    created_by INT,
    title VARCHAR(255),
    content TEXT,
    date_posted DATE,
    FOREIGN KEY (created_by) REFERENCES tbl_Users(user_id) ON DELETE CASCADE
);

-- 8. Complaints and Suggestions
CREATE TABLE tbl_Feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    created_by INT,
    subject VARCHAR(255),
    content TEXT,
    timestamp DATETIME,
    FOREIGN KEY (created_by) REFERENCES tbl_Users(user_id) ON DELETE CASCADE
);

-- 9. Generated System Summaries
CREATE TABLE tbl_Reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    file_format VARCHAR(50),
    report_type VARCHAR(100),
    start_date DATE,
    end_date DATE
);

-- 10. Global Configuration Variables
CREATE TABLE tbl_SystemSettings (
    system_id INT AUTO_INCREMENT PRIMARY KEY,
    updated_by INT,
    config_key VARCHAR(100),
    config_value VARCHAR(255),
    FOREIGN KEY (updated_by) REFERENCES tbl_Users(user_id) ON DELETE CASCADE
);

-- 11. Record of User Activities
CREATE TABLE tbl_AuditLogs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action_type VARCHAR(100),
    timestamp DATETIME,
    FOREIGN KEY (user_id) REFERENCES tbl_Users(user_id) ON DELETE CASCADE
);