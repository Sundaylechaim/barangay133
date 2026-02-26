import React, { useState } from 'react';
import axios from 'axios';

const EditResident = ({ user, onBack }) => {
    const [formData, setFormData] = useState({
        full_name: user.full_name || '',
        mobile: user.mobile_number || '',
        birthday: user.birthday || '',
        gender: user.gender || '',
        civil_status: user.civil_status || 'Single'
    });
    const [selectedImage, setSelectedImage] = useState(null);

    const handleSave = async () => {
        // Requirement: Confirmation alert before saving
        const confirmSave = window.confirm("Are you sure you want to save changes to this resident?");
        if (!confirmSave) return;

        const data = new FormData();
        data.append('full_name', formData.full_name);
        data.append('mobile', formData.mobile);
        data.append('birthday', formData.birthday);
        data.append('gender', formData.gender);
        data.append('civil_status', formData.civil_status);
        if (selectedImage) {
            data.append('image', selectedImage);
        }

        try {
            // Specifically targets the ID of the resident you clicked
            await axios.put(`http://localhost:8000/api/residents/update/${user.id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Resident updated successfully!");
            onBack();
        } catch (err) {
            alert("Error updating resident data.");
        }
    };

    return (
        <div className="add-user-card">
            <h2 style={{color: 'black', textAlign: 'center'}}>Edit Resident</h2>
            
            <input type="text" value={formData.full_name} className="add-user-input"
                onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
            
            <input type="text" value={formData.mobile} className="add-user-input"
                onChange={(e) => setFormData({...formData, mobile: e.target.value})} />
            
            <input type="date" value={formData.birthday} className="add-user-input"
                onChange={(e) => setFormData({...formData, birthday: e.target.value})} />

            <input type="text" value={formData.gender} className="add-user-input"
                onChange={(e) => setFormData({...formData, gender: e.target.value})} />

            <select className="filter-dropdown" style={{width: '100%', marginLeft: '0'}}
                value={formData.civil_status}
                onChange={(e) => setFormData({...formData, civil_status: e.target.value})}>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
            </select>

            <label style={{color: 'black', fontWeight: 'bold'}}>Update Image (Optional):</label>
            <input type="file" accept="image/*" onChange={(e) => setSelectedImage(e.target.files[0])} />

            <button className="save-btn" onClick={handleSave}>Save Changes</button>
            <button className="cancel-text" onClick={onBack}>Cancel</button>
        </div>
    );
};

export default EditResident;