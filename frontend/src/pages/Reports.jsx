import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Reports = () => {
    const [view, setView] = useState('list');
    const [reports, setReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBy, setFilterBy] = useState('Type');
    
    const [formData, setFormData] = useState({ 
        startDate: '', 
        endDate: '', 
        reportType: '', 
        fileType: 'PDF' 
    });
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    // 1. ALL FUNCTIONS MUST BE INSIDE THE COMPONENT
    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:8000/api/reports/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReports(res.data);
        } catch (err) {
            console.error("Error fetching reports:", err);
        }
    };

    const handleDownload = async (reportId, title, fileFormat) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:8000/api/reports/download/${reportId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${title}.${fileFormat.toLowerCase()}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download error:", err);
        }
    };

    const handleGenerate = async () => {
        if (formData.reportType === "Garbage") {
            alert("Garbage Alerts reporting is currently under maintenance.");
            setShowModal(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const payload = {
                title: `${formData.reportType} Summary`,
                file_format: formData.fileType,
                report_type: formData.reportType,
                start_date: formData.startDate,
                end_date: formData.endDate
            };

            await axios.post('http://localhost:8000/api/reports/', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowModal(false);
            setView('list');
            fetchReports();
        } catch (err) {
            alert("Error generating report. Check if all fields are filled.");
        }
    };

    const filteredReports = reports.filter(rep => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        if (filterBy === 'Type') return rep.report_type.toLowerCase().includes(term);
        if (filterBy === 'Date') return rep.start_date.includes(term);
        return true;
    });

    if (view === 'add') {
        return (
            <div className="reports-form-container">
                <div className="reports-form-card">
                    <h2 className="reports-main-title">Summary Reports</h2>
                    <div className="rep-input-group">
                        <label>Start Date:</label>
                        <input type="date" onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                    </div>
                    <div className="rep-input-group">
                        <label>End Date:</label>
                        <input type="date" onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                    </div>
                    <div className="rep-input-group">
                        <label>Report Type:</label>
                        <select onChange={(e) => setFormData({...formData, reportType: e.target.value})}>
                            <option value="">-- Select --</option>
                            <option value="Announcement">Announcement (Titles & Summaries)</option>
                            <option value="Feedback">Feedbacks (User Names & Content)</option>
                            <option value="Garbage">Garbage Alerts (Coming Soon)</option>
                        </select>
                    </div>

                    <div className="rep-input-group">
                        <label>File Type:</label>
                        <div className="radio-group">
                            <label className="radio-label">
                                <input 
                                    type="radio" 
                                    name="fileType" 
                                    value="PDF" 
                                    checked={formData.fileType === 'PDF'} 
                                    onChange={(e) => setFormData({...formData, fileType: e.target.value})} 
                                /> PDF
                            </label>
                            <label className="radio-label">
                                <input 
                                    type="radio" 
                                    name="fileType" 
                                    value="DOCX" 
                                    checked={formData.fileType === 'DOCX'} 
                                    onChange={(e) => setFormData({...formData, fileType: e.target.value})} 
                                /> DOCX
                            </label>
                        </div>
                    </div>

                    <div className="form-actions-reports">
                        <button className="cancel-btn" onClick={() => setView('list')}>Cancel</button>
                        <button className="generate-btn" onClick={() => setShowModal(true)}>Generate Report</button>
                    </div>
                </div>

                {showModal && (
                    <div className="custom-modal-overlay">
                        <div className="custom-modal-box">
                            <h3>Are you sure you want to Generate this Report?</h3>
                            <p className="modal-sub-msg">Type: {formData.reportType} | Format: {formData.fileType}</p>
                            <div className="modal-buttons">
                                <button className="modal-btn" onClick={handleGenerate}>YES</button>
                                <button className="modal-btn" onClick={() => setShowModal(false)}>NO</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="reports-list-container">
            <h2 className="reports-main-title">Summary Reports</h2>
            <div className="ann-controls">
                <div className="search-filter-box">
                    <div className="search-bar">
                        <span className="search-icon">🔍</span>
                        <input type="text" placeholder="Search" onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="filter-dropdown-box">
                        <span>Filter by</span>
                        <select onChange={(e) => setFilterBy(e.target.value)}>
                            <option value="Type">Report Type</option>
                            <option value="Date">Date</option>
                        </select>
                    </div>
                </div>
                <button className="add-ann-btn" onClick={() => setView('add')}>⊕ Add Reports</button>
            </div>

            <div className="reports-display-area">
                {filteredReports.map((rep) => (
                    <div className="report-item-card" key={rep.report_id}>
                        <div className="report-info">
                            {/* INLINE STYLES FORCED BLACK */}
                            <h3 style={{ color: '#000', textDecoration: 'underline', margin: 0 }}>
                                {rep.title}
                            </h3>
                            <p style={{ color: '#000', fontWeight: 'bold', marginTop: '5px' }}>
                                {new Date(rep.start_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <button className="download-btn" onClick={() => handleDownload(rep.report_id, rep.title.replace(/\s+/g, '_'), rep.file_format)}>
                            Download {rep.file_format}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Reports;