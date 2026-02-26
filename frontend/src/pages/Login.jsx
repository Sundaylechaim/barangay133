import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Ensure this is 'dom'
import './Login.css';
import logo from '../assets/logo.png'; 

const Login = () => {
    // 1. You MUST add this line to fix the ReferenceError
    const navigate = useNavigate(); 
    
    const [view, setView] = useState('login'); 
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8000/api/login', {
                username: username,
                password: password
            });
            
            if (response.data.status === "success") {
                // Store the name for the Dashboard's "Welcome!" message
                localStorage.setItem('adminName', response.data.username); 
                // 2. This will now work without error!
                navigate('/dashboard'); 
            }
        } catch (error) {
            alert("Invalid username or password.");
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
                                />
                                <input 
                                    type="password" 
                                    placeholder="Password" 
                                    className="auth-input"
                                    onChange={(e) => setPassword(e.target.value)}
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
}; // This closing brace MUST be here

export default Login;