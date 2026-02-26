import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = ({ onAddClick, onEditClick }) => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState(""); 

    const fetchUsers = () => {
        axios.get('http://localhost:8000/api/users')
            .then(res => setUsers(res.data))
            .catch(err => console.error("Error fetching users:", err));
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // --- DELETE LOGIC WITH CONFIRMATION ---
    const handleDelete = async (id) => {
        // Confirmation alert as requested
        const confirmDelete = window.confirm("Do you want to delete this user?"); 
        if (confirmDelete) {
            try {
                await axios.delete(`http://localhost:8000/api/users/delete/${id}`);
                alert("User successfully deleted."); 
                fetchUsers(); // Refresh table to show updated database state
            } catch (err) {
                alert("Error deleting user. Please check database connection.");
            }
        }
    };

    // --- COMBINED FILTER LOGIC ---
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
        // Matches your requirement: selecting one role hides the others
        const matchesRole = roleFilter === "" || user.role === roleFilter; 
        return matchesSearch && matchesRole;
    });

    return (
        <div className="management-container">
            <div className="admin-controls">
                <div className="search-filter-group" style={{ display: 'flex', gap: '10px' }}>
                    <div className="search-wrapper">
                        <input 
                            type="text" 
                            placeholder="🔍 Search users..." 
                            className="search-input" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="filter-dropdown"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">Filter by Role</option>
                        <option value="Admin">Admin</option>
                        <option value="Official">Official</option>
                        <option value="Resident">Resident</option>
                    </select>
                </div>
                
                <button className="add-user-btn" onClick={onAddClick}>
                    ⊕ Add New User
                </button>
            </div>

            <div className="table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr><td colSpan="5" style={{textAlign: 'center', color: 'black'}}>No users found.</td></tr>
                        ) : (
                            filteredUsers.map((user, index) => (
                                <tr key={user.id}>
                                    <td>{index + 1}</td>
                                    <td style={{color: 'black'}}>{user.username}</td>
                                    <td style={{color: 'black'}}>{user.role}</td>
                                    <td style={{color: 'black'}} className="status-active">{user.status}</td>
                                    <td className="action-cell">
                                        <button onClick={() => onEditClick(user)}>✎</button>
                                        <button onClick={() => handleDelete(user.id)}>🗑</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;