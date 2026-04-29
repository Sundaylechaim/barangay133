import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = ({ onAddClick, onEditClick }) => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState(""); 

    const fetchUsers = () => {
        const token = localStorage.getItem('token');
        axios.get('http://localhost:8000/api/users/', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setUsers(res.data))
        .catch(err => console.error("Error fetching users:", err));
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Do you want to delete this user?"); 
        if (confirmDelete) {
            try {
                const token = localStorage.getItem('token');
                // Fixed endpoint to match FastAPI /api/users/{user_id}
                await axios.delete(`http://localhost:8000/api/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("User successfully deleted."); 
                fetchUsers(); 
            } catch (err) {
                alert("Error deleting user. Please check database connection.");
            }
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
        // Fixed: checking user.roles (from backend) instead of user.role
        const matchesRole = roleFilter === "" || user.roles === roleFilter; 
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
                        <option value="Super Admin">Super Admin</option>
                        <option value="Barangay Official">Barangay Official</option>
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
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr><td colSpan="4" style={{textAlign: 'center', color: 'black'}}>No users found.</td></tr>
                        ) : (
                            filteredUsers.map((user, index) => (
                                // Fixed: using user.user_id instead of user.id
                                <tr key={user.user_id}>
                                    <td>{index + 1}</td>
                                    <td style={{color: 'black'}}>{user.username}</td>
                                    <td style={{color: 'black'}}>{user.roles}</td>
                                    <td className="action-cell">
                                        <button onClick={() => onEditClick(user)}>✎</button>
                                        <button onClick={() => handleDelete(user.user_id)}>🗑</button>
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