import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Edit } from 'lucide-react';

interface MentorSidebarProfileProps {
  profile: {
    fullName: string;
    email: string;
    profileImageUrl?: string;
    bio?: string;
  } | null;
}

export const MentorSidebarProfile: React.FC<MentorSidebarProfileProps> = ({ profile }) => {
  const navigate = useNavigate();

  if (!profile) return null;

  return (
    <div className="px-4 py-2 mb-4">
      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            {profile.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt={profile.fullName}
                className="w-12 h-12 rounded-full border-2 border-cyan-200 object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-cyan-800 flex items-center justify-center border-2 border-cyan-200 text-white">
                <User size={24} />
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-teal-700 rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm truncate" title={profile.fullName}>
              {profile.fullName}
            </h3>
            <p className="text-cyan-200/80 text-xs truncate" title={profile.email}>
              {profile.email}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => navigate('/mentor/profile-setup')}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-all duration-200 group"
        >
          <Edit size={14} className="group-hover:scale-110 transition-transform" />
          Edit Profile
        </button>
      </div>
    </div>
  );
};
