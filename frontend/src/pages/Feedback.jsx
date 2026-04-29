import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Feedback = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    
    // State to track which feedback is being deleted and trigger the modal
    const [feedbackToDelete, setFeedbackToDelete] = useState(null);

    const fetchFeedback = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get('http://localhost:8000/api/feedback/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeedbacks(res.data);
        } catch (err) { 
            console.error(err); 
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, []);

    // Triggered when the trash icon is clicked
    const handleDeleteClick = (feedbackItem) => {
        setFeedbackToDelete(feedbackItem);
    };

    // Triggered when "YES" is clicked in the modal
    const confirmDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            // Using .id or .feedback_id depending on your backend setup
            const id = feedbackToDelete.id || feedbackToDelete.feedback_id; 
            
            await axios.delete(`http://localhost:8000/api/feedback/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setFeedbackToDelete(null); // Close the modal
            fetchFeedback();           // Refresh the table data
        } catch (err) {
            console.error(err);
            alert("Failed to delete feedback.");
        }
    };

    // Create exactly 13 rows to match your Figma design
    const rows = [...feedbacks];
    while (rows.length < 13) { rows.push(null); }

    return (
        <div className="feedback-main-wrapper">
            
            {/* --- UNIVERSAL CONFIRMATION MODAL --- */}
            {feedbackToDelete && (
                <div className="modal-backdrop">
                    <div className="confirmation-modal">
                        <h2>Are you sure you want to DELETE<br/>this Feedback?</h2>
                        <div className="modal-buttons">
                            <button className="modal-btn-yes" onClick={confirmDelete}>YES</button>
                            <button className="modal-btn-no" onClick={() => setFeedbackToDelete(null)}>NO</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="feedback-table-box">
                <table className="figma-styled-table">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}></th> 
                            <th>Name</th>
                            <th>Activity</th>
                            <th>Description</th>
                            <th>Date</th>
                            <th style={{ width: '120px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((f, i) => (
                            <tr key={i}>
                                <td className="bold-cell">{i + 1}</td>
                                <td className="bold-cell">{f ? f.name : ""}</td>
                                
                                {/* Conditionally apply the stippled texture if row is empty */}
                                <td className={f ? "small-text" : "stippled-cell"}>
                                    {f ? "Feedback Submitted" : ""}
                                </td>
                                <td className={f ? "small-text" : "stippled-cell"}>
                                    {f ? f.description : ""}
                                </td>
                                <td className={f ? "small-text" : "stippled-cell"}>
                                    {f ? f.date : ""}
                                </td>
                                <td className={f ? "" : "stippled-cell"}>
                                    {f && (
                                        <div className="action-btns">
                                            <button className="view-btn">View</button>
                                            <button className="delete-icon" onClick={() => handleDeleteClick(f)}>🗑️</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Feedback;