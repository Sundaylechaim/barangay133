import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Feedback from './pages/Feedback.jsx';
import OfficialDashboard from './pages/OfficialDashboard.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/user-management" element={<Dashboard />} />
        <Route path="/residents-record" element={<Dashboard />} />
        <Route path="/feedback" element={<Dashboard/>} />

        <Route path="/official/dashboard" element={<OfficialDashboard />} />
        <Route path="/official/announcements" element={<OfficialDashboard />} />
        <Route path="/official/residents" element={<OfficialDashboard />} />
        <Route path="/official/reports" element={<OfficialDashboard />} />
        <Route path="/official/feedback" element={<OfficialDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;