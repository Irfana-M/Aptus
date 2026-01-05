import React from 'react';

const SessionJoin: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 00-2 2z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold mb-2">Ready to Join?</h1>
      <p className="text-gray-600 mb-8 max-w-md">Please ensure your camera and microphone are working before entering the classroom.</p>
      
      <button className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition-colors">
        Enter Classroom
      </button>
    </div>
  );
};

export default SessionJoin;
