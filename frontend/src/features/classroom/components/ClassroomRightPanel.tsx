import React, { useState } from 'react';
import { ChevronDown, Mic, MicOff, Video as VideoIcon, VideoOff, ArrowRight } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  role: 'mentor' | 'student';
  avatar?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

interface ClassroomRightPanelProps {
  currentUser: {
    name: string;
    role: string;
    avatar?: string;
  };
  participants: Participant[];
  onFeedback: () => void;
}

export const ClassroomRightPanel: React.FC<ClassroomRightPanelProps> = ({
  currentUser,
  participants,
  onFeedback,
}) => {
  const [activeTab, setActiveTab] = useState<'participants' | 'chat'>('participants');

  const mentors = participants.filter(p => p.role === 'mentor');
  const students = participants.filter(p => p.role === 'student');

  return (
    <div className="flex flex-col h-full">
      {/* User Profile */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#3CB4B4]/10 flex items-center justify-center overflow-hidden border border-[#3CB4B4]/20">
             {currentUser.avatar ? (
                 <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
             ) : (
                 <span className="text-[#3CB4B4] font-bold">{currentUser.name.charAt(0)}</span>
             )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1">
              {currentUser.name} <ChevronDown size={14} className="text-gray-400" />
            </h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{currentUser.role}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-4">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('participants')}
            className={`flex-1 pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'participants' ? 'text-gray-800' : 'text-gray-400'
            }`}
          >
            Participants
            {activeTab === 'participants' && (
              <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gray-800 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'chat' ? 'text-gray-800' : 'text-gray-400'
            }`}
          >
            Chat
            {activeTab === 'chat' && (
              <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gray-800 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
        {activeTab === 'participants' ? (
          <div className="space-y-6 pb-6">
            {/* Mentors Section */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                Mentors ({mentors.length})
              </h4>
              <div className="space-y-4">
                {mentors.map(mentor => (
                  <ParticipantItem key={mentor.id} participant={mentor} />
                ))}
              </div>
            </div>

            {/* Students Section */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                Students ({students.length})
              </h4>
              <div className="space-y-4">
                {students.map(student => (
                  <ParticipantItem key={student.id} participant={student} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full items-center justify-center text-gray-400">
            <p className="text-xs italic">Chat feature coming soon...</p>
          </div>
        )}
      </div>

      {/* Feedback Button */}
      <div className="p-6 border-t border-gray-50">
        <button 
          onClick={onFeedback}
          className="w-full bg-[#1A1A80] hover:bg-[#121260] text-white py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all group shadow-lg shadow-[#1A1A80]/20"
        >
          Feedback
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

const ParticipantItem: React.FC<{ participant: Participant }> = ({ participant }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden relative">
          {participant.avatar ? (
              <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover" />
          ) : (
              <span className="text-xs font-bold text-gray-500">{participant.name.charAt(0)}</span>
          )}
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-white rounded-full" />
      </div>
      <span className="text-xs font-medium text-gray-700">{participant.name}</span>
    </div>
    <div className="flex items-center gap-3 text-gray-400 opacity-60 group-hover:opacity-100 transition-opacity">
      {participant.isMuted ? <MicOff size={14} className="text-red-400" /> : <Mic size={14} />}
      {participant.isVideoOff ? <VideoOff size={14} className="text-red-400" /> : <VideoIcon size={14} />}
    </div>
  </div>
);
