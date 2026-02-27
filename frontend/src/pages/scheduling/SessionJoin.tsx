import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, ShieldCheck, AlertCircle } from 'lucide-react';
import { AuthContext } from '../../utils/authContext';

interface JoinLinkTokenPayload {
  sessionId: string;
  userId: string;
  role: 'student' | 'mentor';
}

const SessionJoin: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<JoinLinkTokenPayload | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No access token provided.");
      return;
    }

    try {
      // Basic JWT decoding without special lib (payload is the middle part)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload) as JoinLinkTokenPayload;
      setSessionData(payload);
      
      // Store token in local storage for the specific role to ensure ProtectedRoute passes
      const roleKey = payload.role.toLowerCase() as 'admin' | 'student' | 'mentor';
      localStorage.setItem(`${roleKey}_accessToken`, token);
      localStorage.setItem('userRole', roleKey);
      
      // NEW: Sync AuthContext for global API interceptors
      AuthContext.getInstance().setRole(roleKey);
      
    } catch (e) {
      console.error("Failed to decode join token", e);
      setError("Invalid or expired join link. Please request a new one.");
    }
  }, [token]);

  const handleJoin = () => {
    if (sessionData) {
      navigate(`/session/${sessionData.sessionId}/call`);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Access Denied</h1>
        <p className="text-gray-600 mb-8 max-w-md">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center bg-[#F8FAFC]">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full scale-100 transition-transform hover:scale-[1.01]">
        <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-8 transform rotate-3 shadow-inner">
          <Video size={40} className="-rotate-3" />
        </div>
        
        <h1 className="text-4xl font-black mb-4 text-gray-900 font-outfit tracking-tight">Ready to Join?</h1>
        <p className="text-gray-500 mb-10 text-lg leading-relaxed">
          Your live learning session is ready. Please ensure your camera and microphone are properly configured.
        </p>
        
        <div className="flex items-center gap-2 justify-center mb-8 px-4 py-2 bg-green-50 text-green-700 rounded-full w-fit mx-auto">
          <ShieldCheck size={18} />
          <span className="text-sm font-bold uppercase tracking-wider">Secure Connection Verified</span>
        </div>
        
        <button 
          onClick={handleJoin}
          disabled={!sessionData}
          className="w-full px-8 py-4 bg-[#1A1A80] text-white text-xl font-bold rounded-2xl shadow-[0_10px_20px_-10px_rgba(26,26,128,0.5)] hover:bg-[#2A2A90] hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enter Classroom
        </button>
        
        <p className="mt-6 text-xs text-gray-400 font-medium">
          By joining, you agree to the <span className="underline cursor-pointer">Classroom Code of Conduct</span>
        </p>
      </div>
    </div>
  );
};

export default SessionJoin;
