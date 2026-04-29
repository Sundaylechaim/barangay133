import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ResidentsActivity = () => {
    // Data is now an empty array, waiting for the database
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBy, setFilterBy] = useState('Name');

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const token = localStorage.getItem('token');
                // This connects to your FastAPI /api/activity-history/ endpoint
                const res = await axios.get('http://localhost:8000/api/activity-history/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setActivities(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching activities", err);
                setLoading(false);
            }
        };
        fetchActivities();
    }, []);

    // --- FILTERING ---
    const filteredActivities = activities.filter(act => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        // Adjusting keys to match your backend schemas (username/action_type)
        if (filterBy === 'Name') return act.username?.toLowerCase().includes(term);
        if (filterBy === 'Activity') return act.action_type?.toLowerCase().includes(term);
        if (filterBy === 'Date') return act.timestamp?.includes(term);
        return true; 
    });

    return (
        <div className="activity-list-container">

            
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
                            <option value="Name">Name</option>
                            <option value="Activity">Activity</option>
                            <option value="Date">Date</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="ann-table-wrapper">
                <table className="ann-table">
                    <thead>
                        <tr>
                            <th style={{width: '5%'}}>#</th>
                            <th style={{width: '25%'}}>Name</th>
                            <th style={{width: '20%'}}>Activity</th>
                            <th style={{width: '25%'}}>Description</th>
                            <th style={{width: '15%'}}>Date</th>
                            <th style={{width: '10%'}}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{textAlign: 'center', padding: '20px', color: '#000'}}>
                                    Loading activity history...
                                </td>
                            </tr>
                        ) : filteredActivities.length > 0 ? (
                            filteredActivities.map((act, index) => (
                                <tr key={act.id || index}>
                                    <td className="bold-cell">{index + 1}</td>
                                    <td className="bold-cell" style={{textAlign: 'left', paddingLeft: '10px'}}>{act.username}</td>
                                    <td className="table-small-text">{act.action_type}</td>
                                    <td className="table-small-text">{act.details || "System Log"}</td>
                                    <td className="bold-cell">{new Date(act.timestamp).toLocaleDateString()}</td>
                                    <td className="table-small-text">Success</td>
                                </tr>
                            ))
                        ) : (
                            /* Shows the stippled empty rows if no data is found */
                            Array.from({ length: 10 }).map((_, i) => (
                                <tr key={`empty-${i}`}>
                                    <td className="stippled-cell"></td>
                                    <td className="stippled-cell"></td>
                                    <td className="stippled-cell"></td>
                                    <td className="stippled-cell"></td>
                                    <td className="stippled-cell"></td>
                                    <td className="stippled-cell"></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ResidentsActivity;