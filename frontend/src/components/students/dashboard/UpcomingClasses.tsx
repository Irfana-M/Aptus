import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentTrialClasses } from '../../../features/trial/student/studentTrialThunk';
import { fetchMyEnrollments } from '../../../features/student/studentThunk';
import { EmptyState } from '../../ui/EmptyState';
import { Calendar } from 'lucide-react';
import type { RootState, AppDispatch } from '../../../app/store';
import { format, isAfter, startOfDay, addDays } from 'date-fns';
import type { Course } from '../../../types/courseTypes';

const UpcomingClasses: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    
    const { trialClasses } = useSelector((state: RootState) => state.studentTrial);
    const { enrollments } = useSelector((state: RootState) => state.student);
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (user?._id) {
             dispatch(fetchStudentTrialClasses());
             dispatch(fetchMyEnrollments());
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
                if (isAfter(trialDate, startOfDay(now))) {
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

        const getTimeForDay = (course: Course, day: string) => {
            const schedule = course?.schedule;
            if (schedule?.slots && schedule.slots.length > 0) {
                const matched = schedule.slots.find((s) => s.day === day);
                if (matched) return `${matched.startTime} - ${matched.endTime}`;
            }

            const timeSlot = schedule?.timeSlot || (course as unknown as Record<string, unknown>).timeSlot as string;
            if (!timeSlot) return 'TBD';
            if (!timeSlot.includes('|')) return timeSlot;
            const parts = timeSlot.split('|');
            if (day === 'Saturday') return parts[0];
            if (day === 'Sunday') return parts[1];
            return timeSlot;
        };

        // 2. Enrollments (Simplified look ahead for next 7 days)
        enrollments.forEach(enrollment => {
             const course = enrollment.course;
             if (course?.status === 'ongoing' || course?.status === 'booked') {
                 for (let i = 0; i < 7; i++) {
                     const checkDate = addDays(now, i);
                     const dayName = format(checkDate, 'EEEE');
                     
                     const isCourseDay = course.schedule?.days?.includes(dayName) || (course as unknown as Record<string, unknown>).dayOfWeek === checkDate.getDay();

                     if (isCourseDay) {
                         allEvents.push({
                             id: `${enrollment._id}-${i}`,
                             title: course.subject?.subjectName || 'Course Class',
                             date: checkDate,
                              time: getTimeForDay(course, dayName),
                             icon: '📚'
                         });
                     }
                 }
             }
        });

        allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

        return allEvents.length > 0 ? allEvents[0] : null;

    }, [trialClasses, enrollments]);


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
