import React from 'react';
import { X, GraduationCap, Briefcase, User, Clock } from 'lucide-react';

interface MentorDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    mentor: {
        _id?: string;
        fullName: string;
        profileImageUrl?: string;
        bio?: string;
        academicQualifications?: Array<{
            degree: string;
            institution: string;
            year: string | number;
        }>;
        experiences?: Array<{
            role: string;
            company: string;
            duration: string;
        }>;
        subjectProficiency?: Array<string | { subject: string; level: string; _id: string }>;
        availability?: Array<{
            day: string;
            slots: Array<{ startTime: string; endTime: string; isBooked?: boolean }>;
        }>;
    } | null;
    onRequestMentor?: () => void;
    requestStatus?: 'none' | 'pending' | 'assigned' | 'rejected';
    isLoadingRequest?: boolean;
}

const MentorDetailModal: React.FC<MentorDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    mentor, 
    onRequestMentor,
    requestStatus = 'none',
    isLoadingRequest = false
}) => {
    if (!isOpen || !mentor) return null;

    const getRequestButtonContent = () => {
        if (requestStatus === 'assigned') {
            return { text: 'MENTOR ASSIGNED', disabled: true, className: 'bg-green-100 text-green-700 cursor-not-allowed' };
        }
        if (requestStatus === 'pending') {
            return { text: 'REQUEST PENDING', disabled: true, className: 'bg-yellow-100 text-yellow-700 cursor-not-allowed' };
        }
        if (requestStatus === 'rejected') {
             // Allow re-requesting if rejected? Or show rejected state.
             // If we want to allow retry:
             return { text: 'REQUEST REJECTED - TRY AGAIN', disabled: false, className: 'bg-red-100 text-red-700 hover:bg-red-200' };
        }
        return { 
            text: isLoadingRequest ? 'REQUESTING...' : 'REQUEST MENTOR', 
            disabled: isLoadingRequest, 
            className: 'bg-indigo-600 text-white hover:bg-indigo-700' 
        };
    };

    const buttonConfig = getRequestButtonContent();

    // Calculate total available slots
    const totalSlots = mentor.availability?.reduce((acc, day) => {
        const availableSlots = day.slots?.filter(s => !s.isBooked).length || 0;
        return acc + availableSlots;
    }, 0) || 0;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-start">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center overflow-hidden border-4 border-indigo-50 shadow-inner">
                            {mentor.profileImageUrl ? (
                                <img src={mentor.profileImageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User size={40} className="text-indigo-200" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">{mentor.fullName}</h2>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {mentor.subjectProficiency?.map((subject, idx) => {
                                    // Handle both string and object formats
                                    const subjectName = typeof subject === 'string' 
                                        ? subject 
                                        : subject?.subject || 'Unknown';
                                    
                                    return (
                                        <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                                            {subjectName}
                                        </span>
                                    );
                                })}
                            </div>
                            {/* Availability Summary */}
                            {totalSlots > 0 && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                                    <Clock size={14} />
                                    <span>{totalSlots} slots available</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Bio */}
                    <section>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">About Mentor</h3>
                        <p className="text-slate-600 leading-relaxed italic">
                            {mentor.bio || "No bio information provided by the mentor."}
                        </p>
                    </section>

                    {/* Qualifications */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <GraduationCap size={20} className="text-indigo-600" />
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Education</h3>
                        </div>
                        <div className="space-y-4">
                            {mentor.academicQualifications?.length ? mentor.academicQualifications.map((q, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="font-bold text-slate-800">{q.degree}</p>
                                    <p className="text-sm text-slate-500">{q.institution} • {q.year}</p>
                                </div>
                            )) : (
                                <p className="text-slate-400 text-sm italic">No education details listed.</p>
                            )}
                        </div>
                    </section>

                    {/* Experience */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Briefcase size={20} className="text-indigo-600" />
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Experience</h3>
                        </div>
                        <div className="space-y-4">
                            {mentor.experiences?.length ? mentor.experiences.map((exp, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="font-bold text-slate-800">{exp.role}</p>
                                    <p className="text-sm text-slate-500">{exp.company} • {exp.duration}</p>
                                </div>
                            )) : (
                                <p className="text-slate-400 text-sm italic">No specific experience details listed.</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between gap-4">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 bg-white border border-slate-200 rounded-2xl font-black text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        CLOSE
                    </button>
                    {onRequestMentor && (
                        <button 
                            onClick={onRequestMentor}
                            disabled={buttonConfig.disabled}
                            className={`px-8 py-3 rounded-2xl font-black transition-colors shadow-sm ${buttonConfig.className}`}
                        >
                            {buttonConfig.text}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MentorDetailModal;
