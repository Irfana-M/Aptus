import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from '../../components/mentor/Sidebar';
import Topbar from '../../components/mentor/Topbar';
import { Table, type TableColumn } from '../../components/mentor/Table';
import { fetchMentorTrialClasses, fetchMentorProfile } from "../../features/mentor/mentorThunk";
import type { AppDispatch, RootState } from "../../app/store";
import type { TrialClass } from '../../types/studentTypes'; // Assuming TrialClass is defined here

// Helper for date formatting
const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return dateString;
    }
};

const CompletedTrialClasses: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { trialClasses, loading, profile } = useSelector((state: RootState) => state.mentor);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchMentorTrialClasses());
      if (!profile) {
        dispatch(fetchMentorProfile());
    }
  }, [dispatch, profile]);

  // Get basic user info from auth state as backup
  const { user } = useSelector((state: RootState) => state.auth);

  const mentorName = profile?.fullName || user?.fullName || "Mentor";
  const mentorRole = profile?.subjectProficiency?.[0]?.subject 
    ? `${profile.subjectProficiency[0].subject} Mentor` 
    : "Mentor";
  const profileImage = profile?.profileImageUrl || (user?.profilePicture?.startsWith('http') ? user.profilePicture : undefined) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentorName}`;

  // Filter for completed classes
  const completedClasses = (trialClasses || []).filter(cls => cls.status === 'completed');

  const columns: TableColumn<TrialClass>[] = [
    { header: 'Student Name', accessor: (item) => <span className="font-medium">{item.student?.fullName || 'Unknown'}</span> },
    { header: 'Subject', accessor: (item) => item.subject.subjectName },
    { header: 'Grade', accessor: (item) => String(item.subject.grade || '') },
    { header: 'Date', accessor: (item) => formatDate(item.preferredDate) },
    { header: 'Time', accessor: (item) => item.preferredTime },
    { 
        header: 'Status', 
        accessor: () => (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Completed
            </span>
        ) 
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
            onMenuClick={() => setSidebarOpen(true)} 
            mentorName={mentorName} 
            mentorRole={mentorRole}
            profileImage={profileImage}
        />
        
        <div className="flex-1 overflow-y-auto p-6">
          <h1 className="text-2xl font-bold mb-6">Completed Trial Classes</h1>
          
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                </div>
            </div>
          ) : completedClasses.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <Table data={completedClasses} columns={columns} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CompletedTrialClasses;
