#!/usr/bin/env python3
"""
Server startup script for Barangay 133 API
This script ensures the server runs from the correct directory
"""

import os
import sys
import uvicorn

# Change to the backend directory if we're not already there
script_dir = os.path.dirname(os.path.abspath(__file__))
if not os.path.exists(os.path.join(script_dir, 'main.py')):
    # We're running from parent directory, change to backend
    os.chdir('backend')
else:
    # We're already in backend directory
    pass

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
