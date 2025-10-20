import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, User, Bell, Settings, BarChart3, Calendar, DollarSign, 
  MessageSquare, Users, Headphones, LogOut, Home, Edit, Video, Mail, Phone, 
  MapPin, Briefcase, Award, BookOpen 
} from 'lucide-react';

interface MentorProfile {
  personalDetails: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
  };
  bio: string;
  academicQualifications: {
    degree: string;
    university: string;
    graduationYear: string;
  };
  experience: {
    institutionName: string;
    title: string;
    startDate: string;
  };
  subjectPreferences: {
    subjects: string[];
    levels: string[];
  };
  certifications: {
    name: string;
    organization: string;
  }[];
  media: {
    profileImage: string;
    introVideo?: string;
  };
}

const MentorProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [status, setStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  // Simulate fetching data
  useEffect(() => {
    const fetchProfile = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // simulate API
      const mockData: MentorProfile = {
        personalDetails: {
          fullName: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@mentora.com',
          phone: '+1 (555) 123-4567',
          location: 'San Francisco, CA'
        },
        bio: 'Passionate educator with over 10 years of experience in mathematics and computer science.',
        academicQualifications: {
          degree: 'Ph.D. in Mathematics',
          university: 'Stanford University',
          graduationYear: '2012'
        },
        experience: {
          institutionName: 'MIT - Massachusetts Institute of Technology',
          title: 'Senior Lecturer',
          startDate: '2015-09-01'
        },
        subjectPreferences: {
          subjects: ['Mathematics', 'Computer Science', 'Statistics'],
          levels: ['High School', 'Undergraduate', 'Graduate']
        },
        certifications: [
          { name: 'Certified Mathematics Teacher', organization: 'National Board for Professional Teaching Standards' },
          { name: 'Advanced Teaching Certificate', organization: 'International Teaching Association' }
        ],
        media: {
          profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
          introVideo: 'intro-video.mp4'
        }
      };
      setProfile(mockData);
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'students', icon: Users, label: 'Students' },
    { id: 'meetings', icon: Calendar, label: 'Meetings' },
    { id: 'schedule', icon: Calendar, label: 'Schedule' },
    { id: 'courses', icon: BookOpen, label: 'Courses' },
    { id: 'finance', icon: DollarSign, label: 'Finance' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'feedback', icon: Headphones, label: 'Feedback & Support' },
    { id: 'analytics', icon: BarChart3, label: 'Reports & Analytics' }
  ];

  const handleAccept = () => {
    setStatus('accepted');
    alert('Mentor profile has been accepted!');
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setStatus('rejected');
    setShowRejectModal(false);
    setRejectionReason('');
    alert('Mentor profile has been rejected');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading profile...</p>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-red-600">Failed to load profile</p>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-indigo-600 to-indigo-800 text-white transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center space-x-3 border-b border-indigo-700">
            <GraduationCap className="w-8 h-8" />
            <span className="text-xl font-bold">Mentora</span>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenuItem(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeMenuItem === item.id ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-indigo-700">
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Mentor Profile</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-gray-600 p-2 hover:bg-gray-100 rounded-full" />
              <Settings className="w-5 h-5 text-gray-600 p-2 hover:bg-gray-100 rounded-full" />
              <MessageSquare className="w-5 h-5 text-gray-600 p-2 hover:bg-gray-100 rounded-full" />
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                {profile.personalDetails.fullName.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Status badge */}
            {status !== 'pending' && (
              <div className={`mb-4 p-3 rounded-lg text-white font-medium text-center ${status === 'accepted' ? 'bg-green-600' : 'bg-red-600'}`}>
                {status === 'accepted' ? 'Profile Accepted' : 'Profile Rejected'}
              </div>
            )}

            {/* Edit button */}
            <div className="flex justify-end mb-6">
              <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column - profile image */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                  <div className="text-center">
                    <img src={profile.media.profileImage} alt={profile.personalDetails.fullName} className="w-48 h-48 rounded-full mx-auto object-cover mb-4 border-4 border-indigo-100" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{profile.personalDetails.fullName}</h2>
                    <p className="text-sm text-gray-600 mb-4">{profile.experience.title}</p>

                    {profile.media.introVideo && (
                      <button className="w-full px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center space-x-2 mb-4">
                        <Video className="w-4 h-4" />
                        <span className="text-sm">Watch Intro Video</span>
                      </button>
                    )}

                    <div className="space-y-3 text-left">
                      <div className="flex items-start space-x-3 text-sm"><Mail className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" /><span className="text-gray-600 break-all">{profile.personalDetails.email}</span></div>
                      <div className="flex items-start space-x-3 text-sm"><Phone className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" /><span className="text-gray-600">{profile.personalDetails.phone}</span></div>
                      <div className="flex items-start space-x-3 text-sm"><MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" /><span className="text-gray-600">{profile.personalDetails.location}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Bio */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center"><User className="w-5 h-5 mr-2 text-indigo-600" />About Me</h3>
                  <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
                </div>

                {/* Academic Qualifications */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><GraduationCap className="w-5 h-5 mr-2 text-indigo-600" />Academic Qualifications</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-xs font-medium text-gray-500 uppercase">Degree</label><p className="text-gray-900 mt-1">{profile.academicQualifications.degree}</p></div>
                    <div><label className="text-xs font-medium text-gray-500 uppercase">University</label><p className="text-gray-900 mt-1">{profile.academicQualifications.university}</p></div>
                    <div><label className="text-xs font-medium text-gray-500 uppercase">Graduation Year</label><p className="text-gray-900 mt-1">{profile.academicQualifications.graduationYear}</p></div>
                  </div>
                </div>

                {/* Experience */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Briefcase className="w-5 h-5 mr-2 text-indigo-600" />Experience</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-xs font-medium text-gray-500 uppercase">Institution</label><p className="text-gray-900 mt-1">{profile.experience.institutionName}</p></div>
                    <div><label className="text-xs font-medium text-gray-500 uppercase">Title</label><p className="text-gray-900 mt-1">{profile.experience.title}</p></div>
                    <div><label className="text-xs font-medium text-gray-500 uppercase">Start Date</label><p className="text-gray-900 mt-1">{new Date(profile.experience.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p></div>
                  </div>
                </div>

                {/* Subjects */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><BookOpen className="w-5 h-5 mr-2 text-indigo-600" />Subject Preferences</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase block mb-2">Subjects</label>
                      <div className="flex flex-wrap gap-2">{profile.subjectPreferences.subjects.map((s, i) => <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">{s}</span>)}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase block mb-2">Levels</label>
                      <div className="flex flex-wrap gap-2">{profile.subjectPreferences.levels.map((l, i) => <span key={i} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">{l}</span>)}</div>
                    </div>
                  </div>
                </div>

                {/* Certifications */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Award className="w-5 h-5 mr-2 text-indigo-600" />Certifications</h3>
                  <div className="space-y-4">
                    {profile.certifications.map((cert, idx) => (
                      <div key={idx} className="border-l-4 border-indigo-500 pl-4 py-2">
                        <p className="font-medium text-gray-900">{cert.name}</p>
                        <p className="text-sm text-gray-600 mt-1">{cert.organization}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                {status === 'pending' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={handleAccept} className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">Accept</button>
                    <button onClick={() => setShowRejectModal(true)} className="flex-1 px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium">Reject</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Rejection modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Mentor Profile</h3>
              <p className="text-gray-600 mb-4">Please provide a reason for rejecting this mentor profile.</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                placeholder="Reason for rejection"
              />
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                <button onClick={handleReject} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Reject</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MentorProfilePage;
