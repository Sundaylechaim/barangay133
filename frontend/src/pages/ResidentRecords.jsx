import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ResidentRecord = ({ onAddClick, onEditClick }) => {
    const [residents, setResidents] = useState([]);
    const [viewPart, setViewPart] = useState(1); // 1 for Identity, 2 for Contact/Action

    useEffect(() => {
        axios.get('http://localhost:8000/api/residents')
            .then(res => setResidents(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="management-container">
            <div className="admin-controls">
                <div className="search-wrapper">
                    <input type="text" placeholder="🔍 Search users..." className="search-input" />
                </div>
                <button className="add-user-btn" onClick={onAddClick}>⊕ Add New Resident</button>
            </div>

            <div className="table-wrapper">
                <table className="admin-table">
                    <thead>
                        {viewPart === 1 ? (
                            <tr>
                                <th>#</th>
                                <th>First Name</th>
                                <th>Middle Name</th>
                                <th>Last Name</th>
                                <th>Gender</th>
                                <th>Address</th>
                            </tr>
                        ) : (
                            <tr>
                                <th>#</th>
                                <th>Mobile Number</th>
                                <th>Birthday</th>
                                <th>Email</th>
                                <th>Civil Status</th>
                                <th>Action</th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {residents.map((res, index) => (
                            <tr key={res.id}>
                                <td>{index + 1}</td>
                                {viewPart === 1 ? (
                                    <>
                                        <td>{res.first_name}</td>
                                        <td>{res.middle_name || 'N/A'}</td>
                                        <td>{res.last_name}</td>
                                        <td>{res.gender}</td>
                                        <td>{res.address}</td>
                                    </>
                                ) : (
                                    <>
                                        <td>{res.mobile_number}</td>
                                        <td>{res.birthday}</td>
                                        <td>{res.email}</td>
                                        <td>{res.civil_status}</td>
                                        <td className="action-cell">
                                            <button onClick={() => onEditClick(res)}>✎</button>
                                            <button>🗑</button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                    {viewPart === 2 && (
                        <button className="back-btn" onClick={() => setViewPart(1)}>Back</button>
                    )}
                    {viewPart === 1 && (
                        <button className="next-btn" style={{marginLeft: 'auto'}} onClick={() => setViewPart(2)}>Next</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResidentRecord;