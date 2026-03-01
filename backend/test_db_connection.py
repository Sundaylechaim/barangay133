#!/usr/bin/env python3
"""
Test script to verify database connection
"""

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

def test_database_connection():
    """Test if the database connection works"""
    SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:@localhost:3306/barangay133_db"
    
    print("Testing database connection...")
    print(f"Connection URL: {SQLALCHEMY_DATABASE_URL}")
    
    try:
        # Create engine
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        
        # Test the connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✓ Database connection successful!")
            print("✓ MySQL server is running and accessible")
            return True
            
    except SQLAlchemyError as e:
        print(f"✗ Database connection failed: {e}")
        print("\nPossible issues:")
        print("1. MySQL server is not running")
        print("2. Database 'barangay133_db' doesn't exist")
        print("3. MySQL credentials are incorrect")
        print("4. MySQL port (3306) is not accessible")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    test_database_connection()