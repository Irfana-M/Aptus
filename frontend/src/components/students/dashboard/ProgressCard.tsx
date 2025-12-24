import React from 'react';

const ProgressCard: React.FC = () => {
  const completionProgress: {
    id: string;
    subject: string;
    progress: number;
    chapter: string;
  }[] = []; // No data for now

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 h-full">
        <h2 className="text-lg font-bold mb-4">Completion progress</h2>
        <div className="space-y-5">
            {completionProgress.length > 0 ? (
                completionProgress.map(item => (
                <div key={item.id}>
                    <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900">{item.subject}</span>
                    <span className="text-gray-500 text-xs">{item.progress}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{item.chapter}</p>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: `${item.progress}%` }}></div>
                    </div>
                </div>
                ))
            ) : (
                 <p className="text-gray-500 text-sm">No progress to track.</p>
            )}
        </div>
    </div>
  );
};

export default ProgressCard;
