import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom'; 
import axios from 'axios';
import UserManagement from './UserManagement'; 
import AddUser from './AddUser'; 
import EditUser from './EditUser';
import ResidentRecords from './ResidentRecords'; // Added this import
import AddResident from './AddResident';
import EditResident from './EditResident';
import './Dashboard.css';
import logo from '../assets/logo.png'; 

const Dashboard = () => {
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [stats, setStats] = useState({ users: 0, residents: 0, feedback: 0 });
    const [adminName, setAdminName] = useState("");
    const [userSubView, setUserSubView] = useState('table'); 
    const [editingUser, setEditingUser] = useState(null);
    const location = useLocation();

    // Reset the subview to 'table' whenever the sidebar link changes
    useEffect(() => {
        setUserSubView('table');
    }, [location.pathname]);

    useEffect(() => {
        const savedName = localStorage.getItem('adminName');
        setAdminName(savedName || "Juan Dela Cruz");

        axios.get('http://localhost:8000/api/dashboard-stats')
            .then(res => setStats({
                users: res.data.num_users,
                residents: res.data.num_residents,
                feedback: res.data.pending_feedback
            }))
            .catch(err => console.error("Database error"));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('adminName');
        window.location.href = '/';
    };

    return (
        <div className="dashboard-page">
            {sidebarVisible && (
                <aside className="dashboard-sidebar">
                    <div className="sidebar-logo">
                        <img src={logo} alt="Barangay Logo" className="main-logo" />
                        <div className="barangay-text">BARANGAY 133</div>
                    </div>
                    
                    <nav className="nav-menu">
                        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                            Dashboard
                        </NavLink>
                        <NavLink to="/user-management" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                            User Management
                        </NavLink>
                        <NavLink to="/residents-record" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                            Residents Record
                        </NavLink>
                        <div className="nav-link">Feedback</div>
                        <div className="nav-link">System Settings</div>
                    </nav>

                    <div className="logout-section">
                        <button className="logout-btn" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                    <div className="sidebar-footer-white"></div>
                </aside>
            )}

            <main className="dashboard-main">
                <header className="admin-header">
                    <div className="welcome-text">👤 Welcome! {adminName}</div>
                    <div className="header-actions">
                        <span className="notif-icon">🔔</span>
                        <span className="menu-trigger" onClick={() => setSidebarVisible(!sidebarVisible)}>☰</span>
                    </div>
                </header>

                <section className="stats-section">
                    {/* --- 1. USER MANAGEMENT --- */}
                    {location.pathname === '/user-management' ? (
                        userSubView === 'table' ? (
                            <UserManagement 
                                onAddClick={() => setUserSubView('add')} 
                                onEditClick={(user) => {
                                    setEditingUser(user);
                                    setUserSubView('edit');
                                }} 
                            />
                        ) : userSubView === 'add' ? (
                            <AddUser onBack={() => setUserSubView('table')} />
                        ) : (
                            <EditUser user={editingUser} onBack={() => setUserSubView('table')} />
                        )
                    ) : 
                    
                    /* --- 2. RESIDENTS RECORD --- */
                    location.pathname === '/residents-record' ? (
                        userSubView === 'table' ? (
                            <ResidentRecords 
                                onAddClick={() => setUserSubView('add')} 
                                onEditClick={(res) => {
                                    setEditingUser(res);
                                    setUserSubView('edit');
                                }} 
                            />
                        ) : userSubView === 'add' ? (
                            <AddResident onBack={() => setUserSubView('table')} />
                        ) : (
                            <EditResident user={editingUser} onBack={() => setUserSubView('table')} />
                        )
                    ) : (
                        
                        /* --- 3. DEFAULT DASHBOARD --- */
                        <div className="stats-grid">
                            <div className="stat-card">
                                <p>Number Of Users</p>
                                <h1>{stats.users}</h1>
                            </div>
                            <div className="stat-card">
                                <p>Number Of Residents</p>
                                <h1>{stats.residents}</h1>
                            </div>
                            <div className="stat-card">
                                <p>Pending Feedback</p>
                                <h1>{stats.feedback}</h1>
                            </div>
                        </div>
                    )}
                </section>

                <footer className="dash-footer">
                    <span></span>
                    <span></span>
                </footer>
            </main>
        </div>
    );
};

export default Dashboard;