import React, { useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

const AddResident = ({ onBack }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '', middle_name: '', last_name: '',
        gender: '', address: '', mobile_number: '',
        email: '', birthday: '', civil_status: ''
    });

    const handleAdd = async () => {
        const data = new FormData();
        // Pack all text fields
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        
        // Pack the image file
        if (selectedImage) {
            data.append('image', selectedImage);
        } else {
            return alert("Please upload a resident image.");
        }

        try {
            await axios.post('http://localhost:8000/api/residents/add', data);
            alert("Resident successfully added!");
            onBack(); 
        } catch (err) {
            console.error("Error Details:", err.response?.data);
            alert("Submission failed. Check console.");
        }
    };

    return (
        <div className="add-resident-form-container">
            <div className="form-grid" style={{ display: 'flex', gap: '40px' }}>
                <div className="form-left" style={{ flex: 1.5 }}>
                    <input type="text" placeholder="First Name" className="resident-input" onChange={e => setFormData({...formData, first_name: e.target.value})} />
                    <input type="text" placeholder="Middle Name" className="resident-input" onChange={e => setFormData({...formData, middle_name: e.target.value})} />
                    <input type="text" placeholder="Last Name" className="resident-input" onChange={e => setFormData({...formData, last_name: e.target.value})} />
                    
                    <div className="gender-selection" style={{margin: '15px 0'}}>
                        Gender &nbsp;
                        <label>Female <input type="radio" name="gender" value="Female" onChange={e => setFormData({...formData, gender: e.target.value})} /></label> &nbsp;
                        <label>Male <input type="radio" name="gender" value="Male" onChange={e => setFormData({...formData, gender: e.target.value})} /></label>
                    </div>

                    <input type="text" placeholder="Address" className="resident-input" onChange={e => setFormData({...formData, address: e.target.value})} />
                    <input type="text" placeholder="Mobile Number" className="resident-input" onChange={e => setFormData({...formData, mobile_number: e.target.value})} />
                    <input type="email" placeholder="Email" className="resident-input" onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>

                <div className="form-right" style={{ flex: 1 }}>
                    <label>Birthday</label>
                    <input type="date" className="resident-input" onChange={e => setFormData({...formData, birthday: e.target.value})} />
                    
                    <div className="image-upload-box" style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px', textAlign: 'center', backgroundColor: 'white' }}>
                        <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Upload Image</span>
                            <span>🖼️ 🔽</span>
                        </label>
                        <input id="file-upload" type="file" accept="image/*" style={{ display: 'none' }} 
                            onChange={(e) => setSelectedImage(e.target.files[0])} />
                    </div>
                    {selectedImage && <p style={{fontSize: '10px', color: 'green'}}>✔ {selectedImage.name}</p>}

                    <select className="resident-input" style={{marginTop: '40px'}} onChange={e => setFormData({...formData, civil_status: e.target.value})}>
                        <option value="">Civil Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                    </select>
                </div>
            </div>
            <button className="add-resident-btn" onClick={handleAdd} style={{ width: '100%', marginTop: '30px', backgroundColor: '#5a5a5a', color: 'white', padding: '15px', borderRadius: '8px' }}>
                Add Resident
            </button>
        </div>
    );
};

export default AddResident;