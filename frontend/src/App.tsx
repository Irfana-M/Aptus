import React from 'react';
import { BrowserRouter as Router,Routes,Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.tsx';
import RegistrationPage from './pages/auth/Registration.tsx';
import OtpVerificationPage from './pages/auth/OtpVrification.tsx';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/register" element={<RegistrationPage/>} />
        <Route path="/otp" element={<OtpVerificationPage/>} />
      </Routes>
    </Router>
  );
};

export default App;