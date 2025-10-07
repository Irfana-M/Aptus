import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Register from './pages/auth/Registration';
import VerifyOtp from './pages/auth/VerifyOtp';
import Login from './pages/auth/Login';
import AdminLoginPage from './pages/admin/Login';
import Dashboard from './pages/admin/adminDashboard';


const App: React.FC = () => {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/login" element={<Login />} /> 
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        

      </Routes>
    </Router>
  );
};

export default App;
