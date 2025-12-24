import React from 'react';

const AnnouncementCard: React.FC = () => {
  // Mocking no announcements
  const hasAnnouncement = false;

  if (!hasAnnouncement) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-bold mb-4">Announcement</h2>
      <div className="bg-blue-100 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-gray-700 font-medium">Hello, your live session is about to start!</p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap w-full sm:w-auto">
          Join
        </button>
      </div>
    </div>
  );
};

export default AnnouncementCard;
