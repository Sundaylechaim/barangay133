# Barangay 133 API Testing Guide

## Quick Start

1. **Start the FastAPI server:**
   ```bash
   cd backend
   venv\Scripts\activate
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Open API Documentation:**
   Visit `http://localhost:8000/docs` in your browser to see the interactive Swagger UI

## Testing Methods

### Method 1: Interactive API Documentation (Recommended)
- Open `http://localhost:8000/docs` in your browser
- All endpoints are documented with examples
- You can test each endpoint directly from the browser
- Authentication is handled automatically in the UI

### Method 2: Automated Test Script
```bash
cd backend
python test_endpoints.py
```

This script will test all endpoints automatically and show the results.

### Method 3: Manual Testing with curl

#### 1. Create Super Admin (No Auth Required)
```bash
curl -X POST "http://localhost:8000/api/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "roles": "Super Admin"
  }'
```

#### 2. Login
```bash
curl -X POST "http://localhost:8000/api/login/" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Copy the access token from the response.

#### 3. Get All Users (Requires Auth)
```bash
curl -X GET "http://localhost:8000/api/users/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 4. Create Resident
```bash
curl -X POST "http://localhost:8000/api/residents/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
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
  }'
```

## Available Endpoints

### Authentication
- `POST /api/login/` - User login
- `GET /` - Health check

### User Management (Super Admin Only)
- `POST /api/users/` - Create user
- `GET /api/users/` - Get all users
- `PUT /api/users/{user_id}` - Update user
- `DELETE /api/users/{user_id}` - Delete user

### Resident Management (Super Admin Only)
- `POST /api/residents/` - Create resident
- `GET /api/residents/` - Get all residents
- `PUT /api/residents/{resident_id}` - Update resident
- `DELETE /api/residents/{resident_id}` - Delete resident

## Testing Checklist

- [ ] Server starts successfully
- [ ] Root endpoint returns status
- [ ] Super Admin user can be created
- [ ] Login works with valid credentials
- [ ] Authentication is required for protected endpoints
- [ ] User CRUD operations work
- [ ] Resident CRUD operations work
- [ ] Invalid credentials are rejected
- [ ] All endpoints return proper HTTP status codes

## Troubleshooting

### Common Issues:
1. **Port 8000 already in use**: Change port in uvicorn command
2. **Database connection error**: Ensure MySQL is running and credentials are correct
3. **Import errors**: Ensure virtual environment is activated and requirements installed

### Reset Database:
If you need to start fresh, you may need to drop and recreate your database tables.