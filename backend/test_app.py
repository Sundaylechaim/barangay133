#!/usr/bin/env python3
"""
Test script to verify the FastAPI app works as ASGI
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from main import app
    print("✓ FastAPI app imported successfully")
    print(f"✓ App title: {app.title}")
    print(f"✓ App routes: {len(app.routes)} routes found")
    
    # Test that the app is callable (ASGI requirement)
    if callable(app):
        print("✓ App is ASGI compatible")
    else:
        print("✗ App is not callable")
        
except ImportError as e:
    print(f"✗ Import error: {e}")
except Exception as e:
    print(f"✗ Unexpected error: {e}")