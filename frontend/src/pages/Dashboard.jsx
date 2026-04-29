import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import UserManagement from './UserManagement'; 
import AddUser from './AddUser'; 
import EditUser from './EditUser';
import ResidentRecords from './ResidentRecords'; 
import AddResident from './AddResident';
import EditResident from './EditResident';
import Feedback from './Feedback';  
import './Dashboard.css';
import logo from '../assets/logo.png'; 

const Dashboard = () => {
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [stats, setStats] = useState({ users: 0, residents: 0, feedback: 0 });
    const [adminName, setAdminName] = useState("");
    const [userSubView, setUserSubView] = useState('table'); 
    const [editingUser, setEditingUser] = useState(null);
    
    const location = useLocation();
    const navigate = useNavigate();

    // Reset the subview to 'table' whenever the sidebar link changes
    useEffect(() => {
        setUserSubView('table');
    }, [location.pathname]);

    useEffect(() => {
        // Grab the saved name and token from login
        const savedName = localStorage.getItem('username') || "Juan Dela Cruz";
        const token = localStorage.getItem('token');
        setAdminName(savedName);

        // If no token exists, kick them back to login
        if (!token) {
            navigate('/');
            return;
        }

        // Fetch stats by counting the length of data from existing backend endpoints
        const fetchStats = async () => {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            try {
                // Promise.all fetches everything at the same time for speed
                // We use .catch on each so if a user lacks a specific role (like Resident checking Feedback), it doesn't break the whole dashboard
                const [usersRes, residentsRes, feedbackRes] = await Promise.all([
                    axios.get('http://localhost:8000/api/users/', config).catch(() => ({ data: [] })),
                    axios.get('http://localhost:8000/api/residents/', config).catch(() => ({ data: [] })),
                    axios.get('http://localhost:8000/api/feedback/', config).catch(() => ({ data: [] }))
                ]);

                setStats({
                    users: usersRes.data.length,
                    residents: residentsRes.data.length,
                    feedback: feedbackRes.data.length
                });
            } catch (err) {
                console.error("Failed to fetch dashboard statistics", err);
            }
        };

        fetchStats();
    }, [navigate]);

    const handleLogout = () => {
        // Completely clear the session
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user_id');
        navigate('/');
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
                        <NavLink to="/feedback" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                            Feedback
                        </NavLink>
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
                        ) : location.pathname === '/feedback' ? (
                        <Feedback /> 

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