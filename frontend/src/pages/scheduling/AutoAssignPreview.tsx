import React from 'react';

const AutoAssignPreview: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manual Matching (Basic Plan)</h1>
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
        <p className="text-yellow-800">You are on the Basic plan. Our system is finding the best mentor for you.</p>
        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-100">
          <p className="font-semibold text-gray-400 italic">Matching in progress...</p>
        </div>
      </div>
    </div>
  );
};

export default AutoAssignPreview;
