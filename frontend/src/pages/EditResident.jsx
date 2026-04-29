import React, { useState } from 'react';
import axios from 'axios';

const EditResident = ({ user, onBack }) => {
    const [formData, setFormData] = useState({
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        last_name: user.last_name || '',
        contact: user.contact || '', 
        address: user.address || '',
        birthday: user.birthday || '',
        gender: user.gender || '',
        password: '', confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // NEW: Trigger the custom modal
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleSaveClick = () => {
        if (formData.password || formData.confirmPassword) {
            if (formData.password !== formData.confirmPassword) {
                return alert("Passwords do not match!");
            }
        }
        setShowConfirmation(true); // Open custom modal
    };

    const confirmSave = async () => {
        setShowConfirmation(false); // Close modal
        try {
            const token = localStorage.getItem('token');
            const payload = { ...formData };
            if (!payload.password) delete payload.password;
            delete payload.confirmPassword; 

            await axios.put(`http://localhost:8000/api/residents/${user.resident_id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert("Resident updated successfully!");
            onBack();
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Error updating resident data.";
            alert(errorMsg);
        }
    };

    return (
        <>
            {/* --- CUSTOM MODAL --- */}
            {showConfirmation && (
                <div className="modal-backdrop">
                    <div className="confirmation-modal">
                        <h2>Are you sure you want to SAVE<br/>these changes?</h2>
                        <div className="modal-buttons">
                            <button className="modal-btn-yes" onClick={confirmSave}>YES</button>
                            <button className="modal-btn-no" onClick={() => setShowConfirmation(false)}>NO</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="add-user-card" style={{ width: '600px' }}>
                <h2 style={{color: 'black', textAlign: 'center', marginBottom: '20px'}}>Edit Resident</h2>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input type="text" value={formData.first_name} placeholder="First Name" className="add-user-input" onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
                    <input type="text" value={formData.middle_name} placeholder="Middle Name" className="add-user-input" onChange={(e) => setFormData({...formData, middle_name: e.target.value})} />
                    <input type="text" value={formData.last_name} placeholder="Last Name" className="add-user-input" onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
                </div>
                
                <input type="text" value={formData.contact} placeholder="Contact Number" className="add-user-input" onChange={(e) => setFormData({...formData, contact: e.target.value})} style={{marginBottom: '10px'}} />
                <input type="text" value={formData.address} placeholder="Address" className="add-user-input" onChange={(e) => setFormData({...formData, address: e.target.value})} style={{marginBottom: '10px'}} />
                
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{color: 'black', fontWeight: 'bold', display: 'block', marginTop: '10px'}}>Birthday</label>
                        <input type="date" value={formData.birthday} className="add-user-input" style={{width: '100%', marginBottom: '10px'}} onChange={(e) => setFormData({...formData, birthday: e.target.value})} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{color: 'black', fontWeight: 'bold', display: 'block', marginTop: '10px'}}>Gender</label>
                        <select className="filter-dropdown" style={{width: '100%', marginLeft: '0', marginBottom: '10px'}} value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                </div>

                <label style={{color: 'black', fontWeight: 'bold', display: 'block', marginTop: '10px'}}>Reset Password (Leave blank to keep current)</label>
                <div className="password-wrapper" style={{ marginBottom: '10px' }}>
                    <input type={showPassword ? "text" : "password"} placeholder="New Password" className="add-user-input" onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ width: '100%' }} />
                    <span className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "👁️" : "🙈"}</span>
                </div>

                <div className="password-wrapper" style={{ marginBottom: '20px' }}>
                    <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm New Password" className="add-user-input" onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} style={{ width: '100%' }} />
                    <span className="eye-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? "👁️" : "🙈"}</span>
                </div>

                <button className="save-btn" onClick={handleSaveClick}>Save Changes</button>
                <button className="cancel-text" onClick={onBack} style={{marginTop: '15px'}}>Cancel</button>
            </div>
        </>
    );
};

export default EditResident;