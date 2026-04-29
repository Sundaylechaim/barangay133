import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OfficialFeedback = () => {
    const [feedbacks, setFeedbacks] = useState([]);

    useEffect(() => {
        const fetchFeedback = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get('http://localhost:8000/api/feedback/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFeedbacks(res.data);
            } catch (err) { 
                console.error("Error fetching feedback:", err); 
            }
        };

        fetchFeedback();
    }, []);

    // Create exactly 13 rows to maintain the strict Figma design height
    const rows = [...feedbacks];
    while (rows.length < 13) { rows.push(null); }

    return (
        <div className="feedback-main-wrapper">
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
                                            {/* ONLY the View button is rendered. The trash can is completely gone. */}
                                            <button className="view-btn">View</button>
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

export default OfficialFeedback;