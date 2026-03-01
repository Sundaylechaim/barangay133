#!/usr/bin/env python3
"""
Comprehensive test script for Barangay 133 API endpoints
Run this script to test all available endpoints
"""

import requests
import json
import time

# Base URL for the API
BASE_URL = "http://localhost:8000"

def print_header(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_test(test_name, status, response=None):
    status_symbol = "✓" if status == "PASS" else "✗"
    print(f"{status_symbol} {test_name}")
    if response and hasattr(response, 'status_code'):
        print(f"   Status Code: {response.status_code}")
        if response.status_code >= 400:
            print(f"   Error: {response.text}")
    print()

def test_endpoint(method, url, data=None, headers=None, expected_status=200):
    """Test a single endpoint"""
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=headers)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers)
        else:
            return False, None
        
        success = response.status_code == expected_status
        return success, response
    except Exception as e:
        print(f"   Exception: {e}")
        return False, None

def main():
    print_header("BARANGAY 133 API ENDPOINT TESTING")
    
    # Test 1: Root endpoint
    print_header("1. Testing Root Endpoint")
    success, response = test_endpoint("GET", f"{BASE_URL}/")
    print_test("Root endpoint (/)", "PASS" if success else "FAIL", response)
    
    # Test 2: Create initial Super Admin (without authentication)
    print_header("2. Testing User Creation (Super Admin)")
    super_admin_data = {
        "username": "admin",
        "password": "admin123",
        "roles": "Super Admin"
    }
    success, response = test_endpoint("POST", f"{BASE_URL}/api/users/", super_admin_data)
    print_test("Create Super Admin", "PASS" if success else "FAIL", response)
    
    if success:
        # Test 3: Login
        print_header("3. Testing Authentication")
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        success, response = test_endpoint("POST", f"{BASE_URL}/api/login/", login_data)
        print_test("Login", "PASS" if success else "FAIL", response)
        
        if success and response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get("access_token")
            headers = {"Authorization": f"Bearer {access_token}"}
            
            # Test 4: Get all users (requires Super Admin)
            print_header("4. Testing User Management (Authenticated)")
            success, response = test_endpoint("GET", f"{BASE_URL}/api/users/", headers=headers)
            print_test("Get all users", "PASS" if success else "FAIL", response)
            
            # Test 5: Create regular user
            print_header("5. Testing User Creation (Regular User)")
            regular_user_data = {
                "username": "testuser",
                "password": "test123",
                "roles": "Resident"
            }
            success, response = test_endpoint("POST", f"{BASE_URL}/api/users/", regular_user_data, headers)
            print_test("Create regular user", "PASS" if success else "FAIL", response)
            
            # Test 6: Update user
            print_header("6. Testing User Update")
            update_data = {
                "password": "newpassword123"
            }
            success, response = test_endpoint("PUT", f"{BASE_URL}/api/users/2", update_data, headers)
            print_test("Update user", "PASS" if success else "FAIL", response)
            
            # Test 7: Create resident
            print_header("7. Testing Resident Management")
            resident_data = {
                "username": "resident1",
                "password": "resident123",
                "roles": "Resident",
                "first_name": "Juan",
                "middle_name": "Dela",
                "last_name": "Cruz",
                "birthday": "1990-01-01",
                "gender": "Male",
                "address": "123 Main St, Barangay 133",
                "contact": "09123456789"
            }
            success, response = test_endpoint("POST", f"{BASE_URL}/api/residents/", resident_data, headers)
            print_test("Create resident", "PASS" if success else "FAIL", response)
            
            # Test 8: Get all residents
            success, response = test_endpoint("GET", f"{BASE_URL}/api/residents/", headers=headers)
            print_test("Get all residents", "PASS" if success else "FAIL", response)
            
            if success and response.status_code == 200:
                residents = response.json()
                if residents:
                    resident_id = residents[0].get('resident_id')
                    
                    # Test 9: Update resident
                    print_header("8. Testing Resident Update")
                    update_resident_data = {
                        "address": "456 Updated St, Barangay 133"
                    }
                    success, response = test_endpoint("PUT", f"{BASE_URL}/api/residents/{resident_id}", update_resident_data, headers)
                    print_test("Update resident", "PASS" if success else "FAIL", response)
            
            # Test 10: Test authentication required endpoints without token
            print_header("9. Testing Authentication Required Endpoints (No Token)")
            success, response = test_endpoint("GET", f"{BASE_URL}/api/users/")
            print_test("Get users without token", "PASS" if response.status_code == 401 else "FAIL", response)
            
            # Test 11: Test invalid credentials
            print_header("10. Testing Invalid Credentials")
            invalid_login = {
                "username": "wronguser",
                "password": "wrongpass"
            }
            success, response = test_endpoint("POST", f"{BASE_URL}/api/login/", invalid_login)
            print_test("Invalid login", "PASS" if response.status_code == 401 else "FAIL", response)
    
    print_header("TESTING COMPLETE")
    print("Open http://localhost:8000/docs in your browser to see the interactive API documentation")
    print("All endpoints are documented and can be tested directly from the Swagger UI")

if __name__ == "__main__":
    main()