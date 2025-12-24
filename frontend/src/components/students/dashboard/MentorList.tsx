import React from 'react';

interface Mentor {
  id: number;
  name: string;
  subject: string;
  color: string;
}

const MentorList: React.FC = () => {
  // Mock data for now, replace with props or Redux selector later
  const mentors: Mentor[] = [
    { id: 1, name: 'Shyam Nithin', subject: 'Physics', color: 'bg-green-200' },
    { id: 2, name: 'Nivin Kumar', subject: 'Chemistry', color: 'bg-pink-200' },
    { id: 3, name: 'Nivetha Dinesh', subject: 'Mathematics', color: 'bg-blue-200' },
    { id: 4, name: 'Rudhra shankar', subject: 'English', color: 'bg-yellow-200' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 h-full">
      <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Mentors</h2>
          <button className="text-sm text-teal-600 hover:text-teal-700">See all</button>
      </div>
      <div className="space-y-3">
        {mentors.map(mentor => (
          <div key={mentor.id} className={`${mentor.color} rounded-lg p-4 flex items-center gap-3 transition-transform hover:scale-[1.02]`}>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.name}`} alt={mentor.name} className="w-10 h-10 rounded-full bg-white shadow-sm" />
            <div>
              <p className="font-semibold text-gray-900 leading-tight">{mentor.name}</p>
              <p className="text-xs text-gray-700">{mentor.subject}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MentorList;
