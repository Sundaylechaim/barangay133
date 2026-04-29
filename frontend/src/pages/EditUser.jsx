import React, { useState } from 'react';
import axios from 'axios';

const EditUser = ({ user, onBack }) => {
    // Initialized with the REAL database values sent from UserManagement
    const [formData, setFormData] = useState({
        username: user.username || '',
        role: user.roles || '', // Fixed from user.role to user.roles
        password: '',
        confirmPassword: ''
    });

    // New states for the eye toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSave = async () => {
        // Only validate passwords if they are trying to change it
        if (formData.password && formData.password !== formData.confirmPassword) {
            return alert("Passwords do not match!");
        }

        const confirmSave = window.confirm("Are you sure you want to save?");
        if (!confirmSave) return;

        try {
            const token = localStorage.getItem('token');
            
            // Build the payload
            const payload = {
                username: formData.username,
                roles: formData.role
            };
            
            // Only send the password to the backend if they typed a new one
            if (formData.password) {
                payload.password = formData.password;
            }

            // Fixed endpoint to match FastAPI: /api/users/{user_id}
            await axios.put(`http://localhost:8000/api/users/${user.user_id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert("User updated!");
            onBack();
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Error updating specific user.";
            alert(errorMsg);
        }
    };
    
    return (
        <div className="add-user-card">
            <h2 style={{color: 'black', textAlign: 'center', marginBottom: '10px'}}>Edit User</h2>
            
            <input 
                type="text" 
                value={formData.username}
                placeholder="Username"
                className="add-user-input"
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                style={{marginBottom: '10px'}}
            />

            <select 
                className="filter-dropdown"
                style={{marginLeft: '0', width: '100%', marginBottom: '15px'}}
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
                <option value="Super Admin">Super Admin</option>
                <option value="Barangay Official">Barangay Official</option>
                <option value="Resident">Resident</option>
            </select>

            {/* Wrapped Password Field */}
            <div className="password-wrapper" style={{ marginBottom: '10px' }}>
                <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="New Password (or leave blank)"
                    className="add-user-input"
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <span className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "👁️" : "🙈"}
                </span>
            </div>

            {/* Wrapped Confirm Password Field */}
            <div className="password-wrapper" style={{ marginBottom: '10px' }}>
                <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Confirm New Password"
                    className="add-user-input"
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
                <span className="eye-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? "👁️" : "🙈"}
                </span>
            </div>

            <button className="save-btn" onClick={handleSave} style={{marginTop: '15px'}}>Save</button>
            <button className="cancel-text" onClick={onBack} style={{marginTop: '10px'}}>Cancel</button>
        </div>
    );
};

export default EditUser;