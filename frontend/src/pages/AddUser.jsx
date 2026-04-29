import React, { useState } from 'react';
import axios from 'axios';

const AddUser = ({ onBack }) => {
    const [userData, setUserData] = useState({
        username: '', role: '', password: '', confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // NEW: Trigger the custom modal
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleSaveClick = () => {
        if (userData.password !== userData.confirmPassword) {
            return alert("Passwords do not match!");
        }
        setShowConfirmation(true); // Open custom modal
    };

    const confirmSave = async () => {
        setShowConfirmation(false); // Close modal
        try {
            const token = localStorage.getItem('token');
            const payload = {
                username: userData.username,
                password: userData.password,
                roles: userData.role 
            };

            await axios.post('http://localhost:8000/api/users/', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("User successfully added!"); 
            onBack(); 
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to save to database.";
            alert(errorMsg);
        }
    };

    return (
        <>
            {/* --- CUSTOM MODAL --- */}
            {showConfirmation && (
                <div className="modal-backdrop">
                    <div className="confirmation-modal">
                        <h2>Are you sure you want to ADD<br/>this User?</h2>
                        <div className="modal-buttons">
                            <button className="modal-btn-yes" onClick={confirmSave}>YES</button>
                            <button className="modal-btn-no" onClick={() => setShowConfirmation(false)}>NO</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="add-user-screen">
                <div className="add-user-card">
                    <input type="text" placeholder="Username" onChange={(e) => setUserData({...userData, username: e.target.value})} />
                    <select onChange={(e) => setUserData({...userData, role: e.target.value})}>
                        <option value="">Select Role</option>
                        <option value="Super Admin">Super Admin</option>
                        <option value="Barangay Official">Barangay Official</option>
                        <option value="Resident">Resident</option>
                    </select>

                    <div className="password-wrapper">
                        <input type={showPassword ? "text" : "password"} placeholder="Password" onChange={(e) => setUserData({...userData, password: e.target.value})} />
                        <span className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "👁️" : "🙈"}</span>
                    </div>

                    <div className="password-wrapper">
                        <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" onChange={(e) => setUserData({...userData, confirmPassword: e.target.value})} />
                        <span className="eye-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? "👁️" : "🙈"}</span>
                    </div>

                    <button className="save-btn" onClick={handleSaveClick}>Add User</button>
                    <button className="cancel-text" onClick={onBack}>Cancel</button>
                </div>
            </div>
        </>
    );
};

export default AddUser;