import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentTrialClasses } from '../../../features/trial/student/studentTrialThunk';
import { fetchStudentUpcomingSessions } from '../../../features/session/sessionThunk';
import { EmptyState } from '../../ui/EmptyState';
import { Calendar } from 'lucide-react';
import type { RootState, AppDispatch } from '../../../app/store';
import { format, isAfter, addDays, startOfToday } from 'date-fns';

const UpcomingClasses: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    
    const { trialClasses } = useSelector((state: RootState) => state.studentTrial);
    const { sessions } = useSelector((state: RootState) => state.session);
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (user?._id) {
             dispatch(fetchStudentTrialClasses());
             
             // Fetch sessions for next 14 days
             const from = new Date().toISOString();
             const to = addDays(new Date(), 14).toISOString();
             dispatch(fetchStudentUpcomingSessions({ from, to }));
        }
    }, [dispatch, user]);

    const upcomingClass = useMemo(() => {
        const now = new Date();
        const allEvents: {
            id: string;
            title: string;
            date: Date;
            time: string;
            icon: string;
        }[] = [];

        // 1. Trial Classes
        trialClasses.forEach(trial => {
            if (trial.preferredDate && trial.status !== 'completed' && trial.status !== 'cancelled') {
                const trialDate = new Date(trial.preferredDate);
                // Simple check if it's today or in future
                if (isAfter(trialDate, startOfToday())) {
                     const subjectName = typeof trial.subject === 'object' && trial.subject ? trial.subject.subjectName : String(trial.subject);
                     allEvents.push({
                        id: trial.id,
                        title: `Trial: ${subjectName}`,
                        date: trialDate,
                        time: trial.preferredTime,
                        icon: '🎓'
                    });
                }
            }
        });

        // 2. Regular Sessions
        sessions.forEach(session => {
            if (session.status === 'scheduled' || session.status === 'live' || session.status === 'in_progress') {
                const sessionDate = new Date(session.startTime);
                if (isAfter(sessionDate, now)) {
                     allEvents.push({
                        id: session.id,
                        title: session.subjectId?.subjectName || 'Course Class',
                        date: sessionDate,
                        time: format(sessionDate, 'p'),
                        icon: '📚'
                    });
                }
            }
        });

        allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

        return allEvents.length > 0 ? allEvents[0] : null;

    }, [trialClasses, sessions]);


  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">Upcoming Class</h2>
        <div className="space-y-3">
        {upcomingClass ? (
            <div 
                key={upcomingClass.id} 
                onClick={() => navigate(upcomingClass.title.startsWith('Trial') ? `/trial-class/${upcomingClass.id.split('-')[0]}/call` : '/student/classroom')}
                className="bg-blue-50 rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:bg-blue-100 transition-colors border border-transparent hover:border-blue-200"
            >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl shadow-sm">
                {upcomingClass.icon}
            </div>
            <div>
                <p className="font-semibold text-gray-900">{upcomingClass.title}</p>
                <p className="text-xs text-gray-500">
                    {format(upcomingClass.date, 'MMM do')} • {upcomingClass.time}
                </p>
            </div>
            </div>
        ) : (
            <EmptyState 
              icon={Calendar} 
              title="No upcoming classes" 
              description="Stay tuned for your next session." 
              className="py-4 border-none"
            />
        )}
        </div>
    </div>
  );
};

export default UpcomingClasses;

