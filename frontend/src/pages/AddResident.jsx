import React, { useState, useRef } from 'react';
import axios from 'axios';

const AddResident = ({ onBack }) => {
    const fileInputRef = useRef(null); 
    const [formData, setFormData] = useState({
        username: '', password: '', confirmPassword: '', 
        first_name: '', middle_name: '', last_name: '',
        gender: '', address: '', contact: '', birthday: '',
        civil_status: '', email: ''
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null); // NEW: State to hold the image preview

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // NEW: Handle the file selection and generate a preview URL
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file)); // Creates a temporary viewable link
        }
    };

    const handleFormSubmit = () => {
        if (formData.password !== formData.confirmPassword) {
            return alert("Passwords do not match!");
        }
        setShowConfirmation(true);
    };

    const handleConfirmedSave = async () => {
        setShowConfirmation(false);
        
        // 1. Pack the text data
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key !== 'confirmPassword') {
                data.append(key, formData[key]);
            }
        });
        
        // 2. Attach the image file for the database!
        if (selectedFile) {
            data.append('file', selectedFile);
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8000/api/residents/', data, {
                headers: { 
                    Authorization: `Bearer ${token}` 
                    // Axios automatically handles the Content-Type boundary for files!
                }
            });
            alert("Resident successfully added!");
            onBack(); 
        } catch (err) {
            console.error("Validation Errors:", err.response?.data); 
            
            // 3. Translates FastAPI's array of errors into readable text (Fixes [object Object])
            const errorDetails = err.response?.data?.detail;
            if (Array.isArray(errorDetails)) {
                const messages = errorDetails.map(error => `- ${error.loc[error.loc.length - 1]}: ${error.msg}`);
                alert("Submission Failed due to missing fields:\n" + messages.join("\n"));
            } else {
                alert(errorDetails || "Submission failed.");
            }
        }
    };

    return (
        <div className="form-overlay-container">
            {showConfirmation && (
                <div className="modal-backdrop">
                    <div className="confirmation-modal">
                        <h2>Are you sure you want to ADD<br/>this Resident?</h2>
                        <div className="modal-buttons">
                            <button className="modal-btn-yes" onClick={handleConfirmedSave}>YES</button>
                            <button className="modal-btn-no" onClick={() => setShowConfirmation(false)}>NO</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="main-form-card">
                <div className="flex-columns">
                    {/* LEFT COLUMN */}
                    <div className="column-left">
                        <input type="text" placeholder="First Name" className="styled-input" onChange={e => setFormData({...formData, first_name: e.target.value})} />
                        <input type="text" placeholder="Middle Name" className="styled-input" onChange={e => setFormData({...formData, middle_name: e.target.value})} />
                        <input type="text" placeholder="Last Name" className="styled-input" onChange={e => setFormData({...formData, last_name: e.target.value})} />
                        
                        <div className="gender-row">
                            <span className="label-text">Gender</span>
                            <label><input type="radio" name="gender" value="Female" onChange={e => setFormData({...formData, gender: e.target.value})} /> Female</label>
                            <label><input type="radio" name="gender" value="Male" onChange={e => setFormData({...formData, gender: e.target.value})} /> Male</label>
                        </div>

                        <input type="text" placeholder="Address" className="styled-input" onChange={e => setFormData({...formData, address: e.target.value})} />
                        <input type="text" placeholder="Mobile Number" className="styled-input" onChange={e => setFormData({...formData, contact: e.target.value})} />
                        <input type="email" placeholder="Email" className="styled-input" onChange={e => setFormData({...formData, email: e.target.value})} />
                        <input type="text" placeholder="Username" className="styled-input" onChange={e => setFormData({...formData, username: e.target.value})} />
                        
                        <div className="password-wrapper">
                            <input type={showPassword ? "text" : "password"} placeholder="Password" className="styled-input" onChange={e => setFormData({...formData, password: e.target.value})} />
                            <span className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "👁️" : "🙈"}</span>
                        </div>
                        
                        <div className="password-wrapper">
                            <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" className="styled-input" onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                            <span className="eye-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? "👁️" : "🙈"}</span>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="column-right">
                        <div className="input-group">
                            <label className="label-text-small">Birthday</label>
                            <input type="date" className="styled-input-small" onChange={e => setFormData({...formData, birthday: e.target.value})} />
                        </div>

                        {/* --- NEW: Image Upload Box with Live Preview --- */}
                        <div 
                            className="image-upload-box" 
                            onClick={() => fileInputRef.current.click()}
                            style={previewUrl ? { padding: '5px', display: 'block' } : {}}
                        >
                            {previewUrl ? (
                                <img 
                                    src={previewUrl} 
                                    alt="Profile Preview" 
                                    style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }} 
                                />
                            ) : (
                                <>
                                    <span className="image-icon">🖼️</span>
                                    <span className="upload-text">Select Image</span>
                                </>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                accept="image/*" 
                                style={{ display: 'none' }} 
                                onChange={handleFileChange} 
                            />
                        </div>

                        <select className="styled-dropdown" onChange={e => setFormData({...formData, civil_status: e.target.value})}>
                            <option value="">Civil Status</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Widowed">Widowed</option>
                        </select>
                    </div>
                </div>

                <button className="big-add-btn" onClick={handleFormSubmit}>Add Resident</button>
            </div>
        </div>
    );
};

export default AddResident;