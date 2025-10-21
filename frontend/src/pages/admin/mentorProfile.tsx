import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import { fetchMentorProfileAdmin, approveMentorAdmin, rejectMentorAdmin } from "../../features/admin/adminThunk";
import { selectMentorProfile, selectAdminLoading, selectAdminError } from "../../features/admin/adminSelectors";
import { clearMentorProfile } from "../../features/admin/adminSlice";
import type { AppDispatch } from "../../app/store";

import { GraduationCap, User, Mail, Phone, MapPin, Briefcase, Award, BookOpen, Home, Users, Calendar, DollarSign, MessageSquare, BarChart3, Headphones, LogOut, Image } from 'lucide-react';

const MentorProfilePage: React.FC = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector(selectMentorProfile);
  const loading = useSelector(selectAdminLoading);
  const error = useSelector(selectAdminError);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    console.log('🔄 MentorProfilePage mounted with mentorId:', mentorId);
    
    if (mentorId) {
      dispatch(fetchMentorProfileAdmin(mentorId));
    }

    return () => {
      dispatch(clearMentorProfile());
    };
  }, [mentorId, dispatch]);

  // Debug when profile data changes
  useEffect(() => {
    if (profile) {
      console.log('📊 Profile data received:', profile);
      console.log('🖼️ Profile picture URL:', profile.profilePicture);
      console.log('📁 Profile keys:', Object.keys(profile));
    }
  }, [profile]);

  const handleApprove = () => {
    if (profile?._id) dispatch(approveMentorAdmin(profile._id));
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return alert('Please provide a reason');
    if (profile?._id) dispatch(rejectMentorAdmin({ mentorId: profile._id, reason: rejectionReason }));
    setShowRejectModal(false);
    setRejectionReason('');
  };

  const handleImageError = () => {
    console.log('❌ Image failed to load:', profile?.profilePicture);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully:', profile?.profilePicture);
    setImageError(false);
  };

  // Get profile picture URL with fallback
  // const getProfilePicture = () => {
  //   if (!profile?.profilePicture) {
  //     console.log('📷 No profile picture found, using default');
  //     return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80';
  //   }
    
  //   // Check if it's a full URL or a relative path
  //   if (profile.profilePicture.startsWith('http')) {
  //     return profile.profilePicture;
  //   } else {
  //     // If it's a relative path, construct the full URL
  //     const fullUrl = `http://localhost:5000${profile.profilePicture.startsWith('/') ? '' : '/'}${profile.profilePicture}`;
  //     console.log('🔗 Constructed profile picture URL:', fullUrl);
  //     return fullUrl;
  //   }
  // };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading mentor profile...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center text-red-600">
        <p className="text-lg font-semibold">Error loading profile</p>
        <p>{error}</p>
      </div>
    </div>
  );
  
  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-600">No mentor profile found</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      <main className="flex-1 p-6">

        <h1 className="text-2xl font-bold mb-4">{profile.fullName}</h1>

        {/* Status badge */}
        {profile.approvalStatus !== 'pending' && (
          <div className={`mb-4 p-3 rounded-lg text-white text-center ${profile.approvalStatus === 'approved' ? 'bg-green-600' : 'bg-red-600'}`}>
            {profile.approvalStatus === 'approved' ? 'Profile Approved' : 'Profile Rejected'}
          </div>
        )}

        {/* Action buttons */}
        {profile.approvalStatus === 'pending' && (
          <div className="flex gap-3 mb-6">
            <button onClick={handleApprove} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Approve</button>
            <button onClick={() => setShowRejectModal(true)} className="px-6 py-2 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50">Reject</button>
          </div>
        )}

        {/* Profile info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow">
            {/* Profile picture with fallback */}
            <div className="relative">
              {imageError || !profile.profilePicture ? (
                <div className="w-48 h-48 rounded-full mx-auto mb-4 bg-gray-200 flex items-center justify-center">
                  <Image className="w-12 h-12 text-gray-400" />
                  <span className="sr-only">No profile picture</span>
                </div>
              ) : (
                <img 
  src={profile.profilePicture || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80'} 
  alt={profile.fullName} 
  className="w-48 h-48 rounded-full mx-auto mb-4 object-cover border-4 border-indigo-100"
  onError={handleImageError}
  onLoad={handleImageLoad}
/>

              )}
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-gray-600 flex items-center justify-center">
                <Mail className="w-4 h-4 mr-2" />
                {profile.email}
              </p>
              <p className="text-gray-600 flex items-center justify-center">
                <Phone className="w-4 h-4 mr-2" />
                {profile.phoneNumber}
              </p>
              {profile.location && (
                <p className="text-gray-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {profile.location}
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {profile.bio && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold flex items-center mb-3">
                  <User className="w-5 h-5 mr-2 text-indigo-600"/>About Me
                </h3>
                <p className="text-gray-600">{profile.bio}</p>
              </div>
            )}

            {/* Academic Qualifications */}
            {profile.academicQualifications && profile.academicQualifications.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold flex items-center mb-3">
                  <GraduationCap className="w-5 h-5 mr-2 text-indigo-600"/>Academic Qualifications
                </h3>
                <div className="space-y-3">
                  {profile.academicQualifications.map((qual, i) => (
                    <div key={i} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="font-medium text-gray-900">{qual.degree}</p>
                      <p className="text-sm text-gray-600">{qual.institutionName}</p>
                      <p className="text-sm text-gray-500">{qual.graduationYear}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {profile.experiences && profile.experiences.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold flex items-center mb-3">
                  <Briefcase className="w-5 h-5 mr-2 text-indigo-600"/>Work Experience
                </h3>
                <div className="space-y-3">
                  {profile.experiences.map((exp, i) => (
                    <div key={i} className="border-l-4 border-green-500 pl-4 py-2">
                      <p className="font-medium text-gray-900">{exp.jobTitle}</p>
                      <p className="text-sm text-gray-600">{exp.institution}</p>
                      <p className="text-sm text-gray-500">{exp.duration}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {profile.certification && profile.certification.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold flex items-center mb-3">
                  <Award className="w-5 h-5 mr-2 text-indigo-600"/>Certifications
                </h3>
                <div className="space-y-3">
                  {profile.certification.map((cert, i) => (
                    <div key={i} className="border-l-4 border-purple-500 pl-4 py-2">
                      <p className="font-medium text-gray-900">{cert.name}</p>
                      <p className="text-sm text-gray-600">{cert.issuingOrganization}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subject Proficiency */}
            {profile.subjectProficiency && profile.subjectProficiency.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold flex items-center mb-3">
                  <BookOpen className="w-5 h-5 mr-2 text-indigo-600"/>Subject Proficiency
                </h3>
                <div className="space-y-3">
                  {profile.subjectProficiency.map((subject, i) => (
                    <div key={i} className="border-l-4 border-orange-500 pl-4 py-2">
                      <p className="font-medium text-gray-900">{subject.subject}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        subject.level === 'expert' ? 'bg-green-100 text-green-800' :
                        subject.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {subject.level.charAt(0).toUpperCase() + subject.level.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reject modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Reject Mentor Application</h3>
              <textarea 
                value={rejectionReason} 
                onChange={e => setRejectionReason(e.target.value)} 
                rows={4} 
                className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500" 
                placeholder="Please provide a reason for rejection..."
              />
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowRejectModal(false)} 
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReject} 
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MentorProfilePage;
