import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Video, Calendar as CalendarIcon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentTrialClasses } from '../../../features/trial/student/studentTrialThunk';
import { fetchStudentUpcomingSessions, reportAbsence } from '../../../features/session/sessionThunk';
import { EmptyState } from '../../ui/EmptyState';
import type { RootState, AppDispatch } from '../../../app/store'; 
import { format, addDays, startOfWeek, isSameDay, endOfWeek, addHours, isAfter } from 'date-fns';
import type { Session } from '../../../types/scheduling.types';


const ScheduleList: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    
    // Selectors
    const { trialClasses } = useSelector((state: RootState) => state.studentTrial);
    const { sessions, loading } = useSelector((state: RootState) => state.session);
    const { user } = useSelector((state: RootState) => state.auth);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Start on Monday

    useEffect(() => {
        if (user?._id) {
            dispatch(fetchStudentTrialClasses());
            
            // Fetch sessions for the current week view
            const from = weekStart.toISOString();
            const to = endOfWeek(weekStart, { weekStartsOn: 1 }).toISOString();
            dispatch(fetchStudentUpcomingSessions({ from, to }));
        }
    }, [dispatch, user, weekStart]);

    // Generate week days
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

    const handleLeaveRequest = (sessionId: string) => {
        const reason = window.prompt("Please provide a reason for the leave:");
        if (reason) {
            dispatch(reportAbsence({ sessionId, reason }));
        }
    };

    const handleReschedule = (sessionId: string) => {
        navigate(`/student/reschedule/${sessionId}`);
    };

    // Combine and filter schedule
    const getDailySchedule = (date: Date) => {
        const scheduleItems: {
            id: string;
            type: string;
            subject: string;
            time: string;
            status: string;
            link: string | null | undefined;
            isTrial: boolean;
            courseId?: string;
            session?: Session;
        }[] = [];

        // 1. Trial Classes
        trialClasses.forEach(trial => {
            if (trial.preferredDate) {
                const trialDate = new Date(trial.preferredDate);
                if (isSameDay(trialDate, date)) {
                    scheduleItems.push({
                        id: trial.id,
                        type: 'Trial Class',
                        subject: typeof trial.subject === 'object' && trial.subject ? trial.subject.subjectName : String(trial.subject),
                        time: trial.preferredTime,
                        status: trial.status,
                        link: trial.meetLink || `/trial-class/${trial.id}/call`,
                        isTrial: true
                    });
                }
            }
        });

        // 2. Sessions (from Redux)
        sessions.forEach(session => {
            const sessionDate = new Date(session.startTime);
            if (isSameDay(sessionDate, date)) {
                scheduleItems.push({
                    id: session.id,
                    type: 'Class',
                    subject: session.subjectId?.subjectName || 'Course Session',
                    time: `${format(new Date(session.startTime), 'p')} - ${format(new Date(session.endTime), 'p')}`,
                    status: session.status,
                    link: `/student/classroom`, 
                    isTrial: false,
                    courseId: session.courseId,
                    session: session
                });
            }
        });

        // Sort by time
        return scheduleItems.sort((a, b) => a.time.localeCompare(b.time));
    };

    const schedule = getDailySchedule(selectedDate);

    const handlePrevWeek = () => setWeekStart(prev => addDays(prev, -7));
    const handleNextWeek = () => setWeekStart(prev => addDays(prev, 7));

  return (
    <div className="space-y-6">
       {/* Calendar Strip */}
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{format(selectedDate, 'MMMM yyyy')}</h2>
            <div className="flex gap-2">
                <button onClick={handlePrevWeek} className="p-1 hover:bg-gray-100 rounded transition-colors"><ChevronLeft className="w-5 h-5 text-gray-500" /></button>
                <button onClick={handleNextWeek} className="p-1 hover:bg-gray-100 rounded transition-colors"><ChevronRight className="w-5 h-5 text-gray-500" /></button>
            </div>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day, index) => {
                const isSelected = isSameDay(day, selectedDate);
                const dayName = format(day, 'EEE');
                const dayNumber = format(day, 'd');
                
                return (
                <div 
                    key={index} 
                    onClick={() => setSelectedDate(day)}
                    className="text-center cursor-pointer group"
                >
                <p className={`text-xs mb-1 group-hover:text-teal-600 ${isSelected ? 'text-teal-600 font-semibold' : 'text-gray-500'}`}>{dayName}</p>
                <div className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-sm transition-colors ${
                    isSelected ? 'bg-teal-500 text-white font-bold shadow-md' : 'text-gray-700 bg-gray-50 group-hover:bg-teal-50'
                }`}>
                    {dayNumber}
                </div>
                </div>
            )})}
            </div>
        </div>

        {/* Schedule Items */}
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Schedule for {format(selectedDate, 'MMM do')}</h2>
            </div>
            <div className="space-y-4">
            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                </div>
            ) : schedule.length > 0 ? (
                schedule.map((item, idx) => {
                    const isCancelled = item.status === 'cancelled';
                    const isRescheduling = item.status === 'rescheduling';
                    const canApplyLeave = !item.isTrial && item.session && isAfter(new Date(item.session.startTime), addHours(new Date(), 24)) && item.status === 'scheduled';
                    const canReschedule = !item.isTrial && (isRescheduling || (item.session?.cancelledBy === 'mentor' && item.status === 'cancelled'));

                    return (
                        <div key={`${item.id}-${idx}`} className={`flex gap-3 items-start group p-3 rounded-lg border transition-all ${
                            isCancelled ? 'bg-red-50 border-red-100' : 
                            isRescheduling ? 'bg-orange-50 border-orange-100' :
                            'hover:bg-gray-50 border-transparent hover:border-gray-100'
                        }`}>
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0 transition-colors ${
                                item.isTrial ? 'bg-orange-50 text-orange-600' : 
                                isCancelled ? 'bg-red-100 text-red-600' :
                                'bg-teal-50 text-teal-600'
                            }`}>
                                {item.subject.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className={`font-semibold truncate ${isCancelled ? 'text-red-900' : 'text-gray-900'}`}>{item.subject}</p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {item.type} • <span className={`capitalize ${isCancelled ? 'text-red-500 font-medium' : ''}`}>{item.status.replace('_', ' ')}</span>
                                            {item.session?.cancellationReason && ` (${item.session.cancellationReason})`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {canApplyLeave && (
                                            <button 
                                                onClick={() => handleLeaveRequest(item.id)}
                                                className="text-[10px] font-bold text-red-600 hover:bg-red-50 px-2 py-1 rounded border border-red-200 transition-colors"
                                            >
                                                APPLY LEAVE
                                            </button>
                                        )}
                                        {canReschedule && (
                                            <button 
                                                onClick={() => handleReschedule(item.id)}
                                                className="text-[10px] font-bold text-orange-600 hover:bg-orange-50 px-2 py-1 rounded border border-orange-200 transition-colors"
                                            >
                                                RESCHEDULE
                                            </button>
                                        )}
                                        {item.link && !isCancelled && !isRescheduling && (
                                            <button 
                                                onClick={() => {
                                                    if (item.isTrial) navigate(`/trial-class/${item.id}/call`);
                                                    else navigate(item.link!);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 p-1 flex items-center gap-1 group/btn"
                                                title={item.isTrial ? "Join Trial Call" : "Open Classroom"}
                                            >
                                                <span className="text-[10px] font-bold opacity-0 group-hover/btn:opacity-100 transition-opacity">JOIN</span>
                                                <Video size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded whitespace-nowrap flex items-center gap-1">
                                <CalendarIcon size={12} />
                                {item.time}
                            </p>
                        </div>
                    );
                })
            ) : (
                <EmptyState 
                  icon={CalendarIcon} 
                  title="No classes scheduled" 
                  description="Enjoy your day off!" 
                  className="py-4 border-none"
                />
            )}
            </div>
        </div>
    </div>
  );
};

export default ScheduleList;

