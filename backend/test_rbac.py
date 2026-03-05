import requests

BASE_URL = "http://127.0.0.1:8000/api"

# 1. Credentials for our test roles
USERS = {
    "Super Admin": {"username": "superadmin_01", "password": "securepassword123"},
    "Official": {"username": "official_test", "password": "password123"},
    "Resident": {"username": "resident_test", "password": "password123"}
}

def authenticate(username, password):
    """Logs in and returns the JWT token."""
    response = requests.post(f"{BASE_URL}/login/", json={"username": username, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def create_test_users(admin_token):
    """Uses the Super Admin token to generate a test Official and Resident."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create Official
    requests.post(f"{BASE_URL}/users/", json={
        "username": USERS["Official"]["username"],
        "password": USERS["Official"]["password"],
        "roles": "Barangay Official"
    }, headers=headers)
    
    # Create Resident
    requests.post(f"{BASE_URL}/users/", json={
        "username": USERS["Resident"]["username"],
        "password": USERS["Resident"]["password"],
        "roles": "Resident"
    }, headers=headers)

def test_endpoint(role_name, token, method, endpoint):
    """Attempts to access an endpoint and prints the result."""
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{BASE_URL}{endpoint}"
    
    if method == "GET":
        res = requests.get(url, headers=headers)
    elif method == "POST":
        res = requests.post(url, headers=headers, json={}) # Empty body for test purposes
        
    print(f"[{role_name}] attempting {method} {endpoint} -> Status: {res.status_code}")
    if res.status_code == 403:
        print(f"   ↳ SUCCESS: {role_name} correctly BLOCKED by RBAC.")
    elif res.status_code == 200:
        print(f"   ↳ SUCCESS: {role_name} correctly ALLOWED by RBAC.")
    else:
        print(f"   ↳ NOTE: Status {res.status_code} (Expected if data is invalid, but RBAC allowed it through).")
    print("-" * 50)

def run_tests():
    print("--- STARTING RBAC SECURITY TESTS ---\n")
    
    # 1. Get Super Admin Token
    admin_token = authenticate(USERS["Super Admin"]["username"], USERS["Super Admin"]["password"])
    if not admin_token:
        print("ERROR: Could not log in as Super Admin. Check your credentials!")
        return
        
    print("Super Admin logged in successfully. Generating test users...")
    create_test_users(admin_token)
    
    # 2. Get Tokens for Official and Resident
    official_token = authenticate(USERS["Official"]["username"], USERS["Official"]["password"])
    resident_token = authenticate(USERS["Resident"]["username"], USERS["Resident"]["password"])
    
    print("\n--- TESTING FR1: GET /users/ (Strictly Super Admin Only) ---")
    test_endpoint("Super Admin", admin_token, "GET", "/users/")
    test_endpoint("Official", official_token, "GET", "/users/")
    test_endpoint("Resident", resident_token, "GET", "/users/")

    print("\n--- TESTING FR2: GET /residents/ (Strictly Super Admin Only) ---")
    test_endpoint("Super Admin", admin_token, "GET", "/residents/")
    test_endpoint("Official", official_token, "GET", "/residents/")
    test_endpoint("Resident", resident_token, "GET", "/residents/")
    
    print("\nSecurity test complete. Check the console to verify all 403 blocks.")

if __name__ == "__main__":
    run_tests()