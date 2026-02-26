import React, { useState } from 'react';
import axios from 'axios';

const EditUser = ({ user, onBack }) => {
    // We initialize the form with the REAL database values
    const [formData, setFormData] = useState({
        username: user.username,
        role: user.role,
        password: ''
    });

    const handleSave = async () => {
        const confirmSave = window.confirm("Are you sure you want to save?");
        if (!confirmSave) return;

        try {
            // We send the data to the specific ID of that user
            await axios.put(`http://localhost:8000/api/users/update/${user.id}`, formData);
            alert("User updated!");
            onBack();
        } catch (err) {
            alert("Error updating specific user.");
        }
    };
    
    return (
        <div className="add-user-card">
            <h2 style={{color: 'black', textAlign: 'center', marginBottom: '10px'}}>Edit User</h2>
            
            {/* Matches your white input style */}
            <input 
                type="text" 
                value={formData.username}
                placeholder="Username"
                className="add-user-input"
                onChange={(e) => setFormData({...formData, username: e.target.value})}
            />

            <select 
                className="filter-dropdown"
                style={{marginLeft: '0', width: '100%'}}
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
                <option value="Admin">Admin</option>
                <option value="Barangay Official">Barangay Official</option>
                <option value="Residents">Residents</option>
            </select>

            <input 
                type="password" 
                placeholder="New Password (or keep same)"
                className="add-user-input"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
            />

            <input 
                type="password" 
                placeholder="Confirm Password"
                className="add-user-input"
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            />

            <button className="save-btn" onClick={handleSave}>Save</button>
            <button className="cancel-text" onClick={onBack} style={{marginTop: '10px'}}>Cancel</button>
        </div>
    );
};

export default EditUser;