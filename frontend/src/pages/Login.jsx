import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import './Login.css';
import logo from '../assets/logo.png'; 

const Login = () => {
    const navigate = useNavigate(); 
    
    const [view, setView] = useState('login'); 
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Ensure the URL matches the backend EXACTLY (added the trailing slash)
            const response = await axios.post('http://localhost:8000/api/login/', {
                username: username,
                password: password
            });
            
            // Fix: Check for the access_token sent by your FastAPI backend
            if (response.data.access_token) {
                // Store the secure JWT token so Dashboard and other pages can use it
                localStorage.setItem('token', response.data.access_token);
                // Store user details returned by the backend
                localStorage.setItem('role', response.data.role);
                localStorage.setItem('user_id', response.data.user_id);
                // Store the inputted username for the "Welcome!" message in Dashboard
                localStorage.setItem('username', username); 
                
                // --- THE FIX: Conditional Routing based on Role ---
                if (response.data.role === 'Barangay Official') {
                    navigate('/official/dashboard');
                } else if (response.data.role === 'Super Admin') {
                    navigate('/dashboard');
                } else {
                    // Fallback, perhaps for Residents later
                    navigate('/'); 
                }
            }
        } catch (error) {
            // Uses the specific error detail from FastAPI if available, otherwise defaults to standard message
            const errorMsg = error.response?.data?.detail || "Invalid username or password.";
            alert(errorMsg);
        }
    };

    return (
        <div className="login-page">
            <div className="login-content">
                <div className="logo-container">
                    <img src={logo} alt="Barangay Logo" className="main-logo" />
                    <p className="logo-text">BARANGAY 133</p>
                </div>

                <div className="auth-card">
                    {view === 'login' ? (
                        <>
                            <h2>User Authentication</h2>
                            <form onSubmit={handleLogin}>
                                <input 
                                    type="text" 
                                    placeholder="Username" 
                                    className="auth-input"
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                                <input 
                                    type="password" 
                                    placeholder="Password" 
                                    className="auth-input"
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button type="submit" className="login-button">LOGIN</button>
                            </form>
                            <p className="toggle-link" onClick={() => setView('forgot')}>
                                Forgot Password?
                            </p>
                        </>
                    ) : (
                        <div className="forgot-view">
                            <p className="instruction-text">
                                To reset your password, please contact the barangay office. 
                                The admin will assist you in updating your account.
                            </p>
                            <button 
                                className="login-button" 
                                onClick={() => setView('login')}
                            >
                                Back to Login
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <footer className="login-footer">
                <div className="footer-left">
                    <span></span>
                    <span></span>
                </div>
                <div className="footer-right">
                    
                </div>
            </footer>
        </div>
    );
};

export default Login;