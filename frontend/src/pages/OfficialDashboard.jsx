import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './OfficialDashboard.css';
import AnnouncementManagement from './AnnouncementManagement'; 
import ResidentsActivity from './ResidentsActivity';
import Reports from './Reports';
import OfficialFeedback from './OfficialFeedback';
import logo from '../assets/logo.png';

const OfficialDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [officialName, setOfficialName] = useState("Juan Dela Cruz");
    const [announcements, setAnnouncements] = useState([]);
    
    // NEW: State to hold the most recent feedback
    const [latestFeedback, setLatestFeedback] = useState(null);
    const [sidebarVisible, setSidebarVisible] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedName = localStorage.getItem('username');
        const role = localStorage.getItem('role');

        if (!token || role !== 'Barangay Official') {
            navigate('/');
            return;
        }

        if (savedName) setOfficialName(savedName);

        // Fetch announcements
        const fetchAnnouncements = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/announcements/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const sorted = res.data.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));
                setAnnouncements(sorted);
            } catch (err) {
                console.error("Failed to fetch announcements", err);
            }
        };

        // NEW: Fetch the latest feedback
        const fetchLatestFeedback = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/feedback/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // The backend already sorts by newest first, so we just grab the first item
                if (res.data && res.data.length > 0) {
                    setLatestFeedback(res.data[0]);
                }
            } catch (err) {
                console.error("Failed to fetch feedback", err);
            }
        };

        fetchAnnouncements();
        fetchLatestFeedback(); // Call the new fetch function
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <div className="official-page-wrapper">
            {/* TOP HEADER */}
            <header className="official-top-header">
                <div className="header-user-info">
                    <div className="user-avatar">👤</div>
                    <span className="welcome-text">Welcome! {officialName}</span>
                </div>
                <div className="header-actions">
                    <span className="notif-bell">🔔</span>
                    <span className="hamburger-menu" onClick={() => setSidebarVisible(!sidebarVisible)}>☰</span>
                </div>
            </header>

            <div className="official-main-layout">
                {/* SIDEBAR */}
                {sidebarVisible && (
                    <aside className="official-sidebar">
                        <div className="sidebar-brand">
                            <img src={logo} alt="Barangay 133" className="sidebar-logo-img" />
                            <div className="barangay-text">BARANGAY 133</div>
                        </div>
                        <nav className="official-nav">
                            <NavLink to="/official/dashboard" className="off-nav-link">Dashboard</NavLink>
                            <NavLink to="/official/announcements" className="off-nav-link">Announcement Management</NavLink>
                            <NavLink to="/official/residents" className="off-nav-link">Residents Activity</NavLink>
                            <NavLink to="/official/reports" className="off-nav-link">Reports</NavLink>
                            <NavLink to="/official/feedback" className="off-nav-link">Feedback/ Inquiries</NavLink>
                        </nav>
                        <div className="sidebar-bottom">
                            <button className="off-logout-btn" onClick={handleLogout}>Logout</button>
                        </div>
                    </aside>
                )}

                {/* MAIN CONTENT AREA */}
                <main className="official-content-area">
                    {location.pathname === '/official/dashboard' && (
                        <div className="dashboard-grid">
                            
                            {/* LEFT COLUMN */}
                            <div className="grid-column left-col">
                                {announcements.length > 0 ? (
                                    <div className="dash-card large-card">
                                        <h3>{announcements[0].title}</h3>
                                        <p className="card-date">{announcements[0].date_posted}</p>
                                        <p className="card-excerpt">{announcements[0].content.substring(0, 80)}...</p>
                                        <button className="read-more-btn">Read More</button>
                                    </div>
                                ) : (
                                    <div className="dash-card large-card empty-card">
                                        <h3>No Announcements</h3>
                                        <p>There are currently no major updates.</p>
                                    </div>
                                )}

                                <div className="dash-card large-card">
                                    <h3>Upcoming Garbage Collection</h3>
                                    <p className="card-date">Waiting for AI schedule...</p>
                                </div>
                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="grid-column right-col">
                                {announcements.slice(1, 3).map((ann, index) => (
                                    <div className="dash-card small-card" key={index}>
                                        <h4>{ann.title}</h4>
                                        <p className="card-date">{ann.date_posted}</p>
                                    </div>
                                ))}
                                
                                {announcements.length < 3 && (
                                    <div className="dash-card small-card empty-card"><h4>No event scheduled</h4></div>
                                )}
                                {announcements.length < 2 && (
                                    <div className="dash-card small-card empty-card"><h4>No event scheduled</h4></div>
                                )}

                                {/* UPDATED: Dynamic Feedback Box */}
                                <div className="dash-card feedback-box" style={{ flexDirection: 'column', gap: '10px' }}>
                                    <h4 style={{ margin: 0, textAlign: 'left', borderBottom: '1px solid #ddd', paddingBottom: '8px', fontSize: '18px' }}>
                                        Latest Feedback
                                    </h4>
                                    {latestFeedback ? (
                                        <div style={{ textAlign: 'left' }}>
                                            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '14px', color: '#000' }}>
                                                {latestFeedback.name} <span style={{ color: '#888', fontWeight: 'normal', fontSize: '12px' }}>({latestFeedback.date})</span>
                                            </p>
                                            <p style={{ margin: 0, color: '#555', fontSize: '14px', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                "{latestFeedback.content}"
                                            </p>
                                        </div>
                                    ) : (
                                        <p style={{color: '#888', textAlign: 'left', margin: 0, fontSize: '14px'}}>No recent feedback.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {location.pathname === '/official/announcements' && <AnnouncementManagement />}
                    {location.pathname === '/official/residents' && <ResidentsActivity />}
                    {location.pathname === '/official/reports' && <Reports />}
                    {location.pathname === '/official/feedback' && <OfficialFeedback />}
                    
                </main>
            </div>

            {/* FOOTER */}
            <footer className="official-footer"></footer>
        </div>
    );
};

export default OfficialDashboard;