import React, { useState } from 'react';
import axios from 'axios';

const AddUser = ({ onBack }) => {
    const [userData, setUserData] = useState({
        username: '',
        role: '',
        password: '',
        confirmPassword: ''
    });

const handleSave = async () => {
    const confirmAdd = window.confirm("Do you really want to add this user?"); // Requirement
    if (!confirmAdd) return;

    try {
        await axios.post('http://localhost:8000/api/users/add', userData);
        alert("User successfully added!"); // Success Alert
        onBack(); // Redirect to table
    } catch (err) {
        alert("Failed to save to database.");
    }
};

    return (
        <div className="add-user-screen">
            <div className="add-user-card">
                <input 
                    type="text" placeholder="Username" 
                    onChange={(e) => setUserData({...userData, username: e.target.value})}
                />
                <select onChange={(e) => setUserData({...userData, role: e.target.value})}>
                    <option value="">Select Role</option>
                    <option value="Admin">Admin</option>
                    <option value="Official">Official</option>
                    <option value="Resident">Resident</option>
                </select>
                <input 
                    type="password" placeholder="Password" 
                    onChange={(e) => setUserData({...userData, password: e.target.value})}
                />
                <input 
                    type="password" placeholder="Confirm Password" 
                    onChange={(e) => setUserData({...userData, confirmPassword: e.target.value})}
                />
                <button className="save-btn" onClick={handleSave}>Add User</button>
                <button className="cancel-text" onClick={onBack}>Cancel</button>
            </div>
        </div>
    );
};

export default AddUser;