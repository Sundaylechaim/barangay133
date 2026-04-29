import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AnnouncementManagement = () => {
    // Main States
    const [view, setView] = useState('list'); // 'list', 'add', 'edit'
    const [announcements, setAnnouncements] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBy, setFilterBy] = useState('Title');
    
    // Form & Modal States (Added file: null here)
    const [formData, setFormData] = useState({ id: null, title: '', content: '', file: null });
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', message: '', targetId: null });

    // Fetch on load
    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:8000/api/announcements/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnnouncements(res.data);
        } catch (err) {
            console.error("Error fetching announcements:", err);
        }
    };

    // --- MODAL CONTROLS ---
    const triggerModal = (type, targetId = null, customTitle = '') => {
        let message = '';
        const titleToUse = customTitle || formData.title;

        if (type === 'delete') {
            message = `Are you sure you want to delete the “${titleToUse}” announcement?`;
        } else if (type === 'submit') {
            message = `Are you sure you want to submit this Announcement?`;
        } else if (type === 'save') {
            message = `Are you sure you want to SAVE the “${titleToUse}” announcement?`;
        }

        setModalConfig({ isOpen: true, type, message, targetId });
    };

    const closeModal = () => setModalConfig({ isOpen: false, type: '', message: '', targetId: null });

    // --- CRUD ACTIONS ---
    const confirmAction = async () => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            if (modalConfig.type === 'delete') {
                await axios.delete(`http://localhost:8000/api/announcements/${modalConfig.targetId}`, config);
            } 
            else if (modalConfig.type === 'submit') {
                const payload = {
                    title: formData.title,
                    content: formData.content,
                    date_posted: new Date().toISOString().split('T')[0]
                };
                await axios.post('http://localhost:8000/api/announcements/', payload, config);
            } 
            else if (modalConfig.type === 'save') {
                const payload = {
                    title: formData.title,
                    content: formData.content
                };
                await axios.put(`http://localhost:8000/api/announcements/${formData.id}`, payload, config);
            }

            // Success cleanup
            closeModal();
            setView('list');
            fetchAnnouncements();
            setFormData({ id: null, title: '', content: '', file: null });

        } catch (err) {
            alert("An error occurred. Please try again.");
            closeModal();
        }
    };

    // --- FILTERING ---
    const filteredAnnouncements = announcements.filter(ann => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        if (filterBy === 'Title') return ann.title.toLowerCase().includes(term);
        if (filterBy === 'Date') return ann.date_posted.includes(term);
        return true; 
    });

    // --- RENDERERS ---
    if (view === 'add' || view === 'edit') {
        return (
            <div className="ann-form-container">
                <div className="ann-form-card">
                    <h2 className="ann-form-header">Announcement Management</h2>
                    
                    <div className="ann-input-group">
                        <label>Title:</label>
                        <input 
                            type="text" 
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                    </div>

                    <div className="ann-input-group">
                        <label>Body:</label>
                        <textarea 
                            value={formData.content}
                            onChange={(e) => setFormData({...formData, content: e.target.value})}
                        ></textarea>
                    </div>

                    <div className="ann-input-group upload-group">
                        <label>Upload:</label>
                        {/* THIS IS THE UPDATED FILE INPUT */}
                        <input 
                            type="file" 
                            className="file-upload-input"
                            onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                        />
                        <div className="form-actions">
                            <button className="cancel-btn" onClick={() => setView('list')}>Cancel</button>
                            <button 
                                className="submit-btn" 
                                onClick={() => triggerModal(view === 'add' ? 'submit' : 'save')}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>

                {/* SHARED CONFIRMATION MODAL */}
                {modalConfig.isOpen && (
                    <div className="custom-modal-overlay">
                        <div className="custom-modal-box">
                            <h3>{modalConfig.message}</h3>
                            <div className="modal-buttons">
                                <button className="modal-btn" onClick={confirmAction}>YES</button>
                                <button className="modal-btn" onClick={closeModal}>NO</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="ann-list-container">
            {/* TOP BAR */}
            <div className="ann-controls">
                <div className="search-filter-box">
                    <div className="search-bar">
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-dropdown-box">
                        <span>Filter by</span>
                        <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
                            <option value="Title">Title</option>
                            <option value="Date">Date</option>
                        </select>
                    </div>
                </div>
                <button 
                    className="add-ann-btn" 
                    onClick={() => {
                        setFormData({ id: null, title: '', content: '', file: null });
                        setView('add');
                    }}
                >
                    ⊕ Add Announcement
                </button>
            </div>

            {/* TABLE */}
            <div className="ann-table-wrapper">
                <table className="ann-table">
                    <thead>
                        <tr>
                            <th style={{width: '5%'}}>#</th>
                            <th style={{width: '45%'}}>Title</th>
                            <th style={{width: '20%'}}>Date</th>
                            <th style={{width: '15%'}}>Status</th>
                            <th style={{width: '15%'}}>Edit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAnnouncements.map((ann, index) => (
                            <tr key={ann.announcement_id}>
                                <td className="bold-cell">{index + 1}</td>
                                <td className="bold-cell" style={{textAlign: 'left', paddingLeft: '10px'}}>{ann.title}</td>
                                <td className="bold-cell">{ann.date_posted}</td>
                                <td className="bold-cell">Publish 👁</td>
                                <td className="action-cell">
                                    <button 
                                        className="icon-btn"
                                        onClick={() => {
                                            setFormData({ id: ann.announcement_id, title: ann.title, content: ann.content, file: null });
                                            setView('edit');
                                        }}
                                    >✎</button>
                                    <button 
                                        className="icon-btn"
                                        onClick={() => triggerModal('delete', ann.announcement_id, ann.title)}
                                    >🗑</button>
                                </td>
                            </tr>
                        ))}
                        {/* Stippled empty rows to fill space if needed */}
                        {Array.from({ length: Math.max(0, 10 - filteredAnnouncements.length) }).map((_, i) => (
                            <tr key={`empty-${i}`}>
                                <td className="stippled-cell"></td>
                                <td className="stippled-cell"></td>
                                <td className="stippled-cell"></td>
                                <td className="stippled-cell"></td>
                                <td className="stippled-cell"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* DELETE MODAL (List View) */}
            {modalConfig.isOpen && modalConfig.type === 'delete' && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-box">
                        <h3>{modalConfig.message}</h3>
                        <div className="modal-buttons">
                            <button className="modal-btn" onClick={confirmAction}>YES</button>
                            <button className="modal-btn" onClick={closeModal}>NO</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementManagement;