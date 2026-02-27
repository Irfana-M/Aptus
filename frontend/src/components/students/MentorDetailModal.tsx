import React from 'react';
import { X, GraduationCap, Briefcase, User, Clock, Star } from 'lucide-react';

interface MentorDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    mentor: {
        _id?: string;
        fullName: string;
        profileImageUrl?: string;
        bio?: string;
        rating?: number;
        totalRatings?: number;
        academicQualifications?: Array<{
            degree: string;
            institution?: string;
            institutionName?: string;
            year?: string | number;
            graduationYear?: string | number;
        }>;
        experiences?: Array<{
            role: string;
            jobTitle?: string;
            company: string;
            institution?: string;
            duration: string;
        }>;
        subjectProficiency?: Array<string | { subject: string; level: string; _id: string }>;
        availability?: Array<{
            day: string;
            slots: Array<{ startTime: string; endTime: string; isBooked?: boolean }>;
        }>;
        reviews?: Array<{
            studentName: string;
            rating: number;
            comment: string;
            date: string;
        }>;
    } | null;
    onRequestMentor?: () => void;
    requestStatus?: 'none' | 'pending' | 'assigned' | 'rejected';
    isLoadingRequest?: boolean;
    isReviewMode?: boolean;
    isSelected?: boolean;
}

const MentorDetailModal: React.FC<MentorDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    mentor, 
    onRequestMentor,
    requestStatus = 'none',
    isLoadingRequest = false,
    isReviewMode = false,
    isSelected = false
}) => {
    if (!isOpen || !mentor) return null;

    const getRequestButtonContent = () => {
        if (requestStatus === 'assigned') {
            return { text: 'MENTOR ASSIGNED', disabled: true, className: 'bg-green-100 text-green-700 cursor-not-allowed' };
        }
        if (requestStatus === 'pending') {
            return { text: 'REQUEST PENDING', disabled: true, className: 'bg-yellow-100 text-yellow-700 cursor-not-allowed' };
        }

        if (isReviewMode) {
            return { 
                text: isSelected ? 'REMOVE SELECTION' : 'SELECT THIS MENTOR', 
                disabled: false, 
                className: isSelected ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-700' 
            };
        }

        if (requestStatus === 'rejected') {
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
                <div className="p-10 border-b border-slate-100 flex justify-between items-start bg-gradient-to-br from-white to-slate-50/50">
                    <div className="flex items-center gap-8">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                            <div className="relative w-24 h-24 rounded-[2.2rem] bg-white flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                                {mentor.profileImageUrl ? (
                                    <img src={mentor.profileImageUrl} alt="" className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                        <User size={48} className="text-slate-400" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{mentor.fullName}</h2>
                                {(mentor.totalRatings || 0) > 10 && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-lg border border-green-200">Top Rated</span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1 bg-yellow-400/10 px-3 py-1.5 rounded-2xl border border-yellow-200">
                                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                    <span className="text-sm font-black text-yellow-700">
                                        {mentor.rating || 0}
                                    </span>
                                </div>
                                <span className="text-sm font-bold text-slate-400">
                                    ({mentor.totalRatings || 0} detailed reviews)
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-4">
                                {mentor.subjectProficiency?.map((subject, idx) => {
                                    const subjectName = typeof subject === 'string' 
                                        ? subject 
                                        : subject?.subject || 'Unknown';
                                    
                                    return (
                                        <span key={idx} className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-colors cursor-default">
                                            {subjectName}
                                        </span>
                                    );
                                })}
                            </div>
                            {/* Availability Summary */}
                            {totalSlots > 0 && (
                                <div className="flex items-center gap-2 mt-3 text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full w-fit">
                                    <Clock size={12} />
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
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Bio */}
                    <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative">
                        <div className="absolute -top-3 left-6 px-4 py-1 bg-white border border-slate-100 rounded-full shadow-sm">
                            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">About Mentor</h3>
                        </div>
                        <p className="text-slate-600 leading-relaxed italic text-sm">
                            "{mentor.bio || "No bio information provided by the mentor."}"
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Qualifications */}
                        <section>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <GraduationCap size={20} />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Education</h3>
                            </div>
                            <div className="space-y-4">
                                {mentor.academicQualifications?.length ? mentor.academicQualifications.map((q, idx) => (
                                    <div key={idx} className="group relative pl-6 border-l-2 border-slate-100 hover:border-indigo-400 transition-colors py-1">
                                        <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-slate-200 group-hover:bg-indigo-400 transition-colors" />
                                        <p className="font-black text-slate-800 text-sm leading-tight">{q.degree}</p>
                                        <p className="text-xs text-slate-500 mt-1 font-medium">{q.institutionName || q.institution} • {q.graduationYear || q.year}</p>
                                    </div>
                                )) : (
                                    <p className="text-slate-400 text-sm italic py-2">No education details listed.</p>
                                )}
                            </div>
                        </section>

                        {/* Experience */}
                        <section>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                                    <Briefcase size={20} />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Experience</h3>
                            </div>
                            <div className="space-y-4">
                                {mentor.experiences?.length ? mentor.experiences.map((exp, idx) => (
                                    <div key={idx} className="group relative pl-6 border-l-2 border-slate-100 hover:border-purple-400 transition-colors py-1">
                                        <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-slate-200 group-hover:bg-purple-400 transition-colors" />
                                        <p className="font-black text-slate-800 text-sm leading-tight">{exp.jobTitle || exp.role}</p>
                                        <p className="text-xs text-slate-500 mt-1 font-medium">{exp.institution || exp.company} • {exp.duration}</p>
                                    </div>
                                )) : (
                                    <p className="text-slate-400 text-sm italic py-2">No experience details listed.</p>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Trial Feedback Section */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-yellow-100 flex items-center justify-center text-yellow-600">
                                    <Star size={20} className="fill-yellow-600" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Trial Class Reviews</h3>
                            </div>
                            {mentor.totalRatings ? (
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Latest {mentor.reviews?.length || 0} of {mentor.totalRatings}
                                </div>
                            ) : null}
                        </div>
                        
                        <div className="space-y-4">
                            {mentor.reviews?.length ? mentor.reviews.map((review, idx) => (
                                <div key={idx} className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100 hover:border-yellow-200 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-black">
                                                {review.studentName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800">{review.studentName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{new Date(review.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-0.5 bg-yellow-400/10 px-2 py-1 rounded-full">
                                            <Star size={10} className="fill-yellow-500 text-yellow-500" />
                                            <span className="text-[10px] font-black text-yellow-700">{review.rating}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed italic">
                                        "{review.comment || "Great trial class! The mentor was very helpful."}"
                                    </p>
                                </div>
                            )) : (
                                <div className="py-8 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                    <Star size={24} className="mx-auto text-slate-200 mb-2" />
                                    <p className="text-slate-400 text-xs font-medium">New mentor - Be the first to try a trial class!</p>
                                </div>
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
