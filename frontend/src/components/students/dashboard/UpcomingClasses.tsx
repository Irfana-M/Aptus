import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentTrialClasses } from '../../../features/trial/student/studentTrialThunk';
import { fetchMyEnrollments } from '../../../features/student/studentThunk';
import type { RootState, AppDispatch } from '../../../app/store';
import { format, isAfter, startOfDay, addDays } from 'date-fns';

const UpcomingClasses: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    
    const { trialClasses } = useSelector((state: RootState) => state.studentTrial);
    const { enrollments } = useSelector((state: RootState) => state.student);
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (user?._id) {
             // Dispatch if not already loaded (optional optimization, but safe to call)
             // We rely on ScheduleList's dispatch or just ensure it's called here too.
             // It is better to ensure data availability on this component too.
             // However, to avoid duplicate calls if mounted together, we can check basic state length or just rely on Redux deduping if handled (it's not usually automatic).
             // For simplicity, we dispatch.
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
                // If it has time, we should parse it to get exact time comparison
                // But simplified: check if date is today or future.
                if (isAfter(trialDate, startOfDay(now))) {
                     const subjectName = typeof trial.subject === 'object' && trial.subject ? (trial.subject as { subjectName: string }).subjectName : String(trial.subject);
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

        // 2. Enrollments (Simplified look ahead for next 7 days for demo)
        // Finding the "Next" class in a recurring schedule is complex.
        // We will check the next 7 days for any match.
        enrollments.forEach(enrollment => {
             const course = enrollment.courseId;
             if (course?.status === 'ongoing' || course?.status === 'booked') {
                 for (let i = 0; i < 7; i++) {
                     const checkDate = addDays(now, i);
                     const dayNum = checkDate.getDay();
                     if (course.dayOfWeek === dayNum) {
                         allEvents.push({
                             id: `${enrollment._id}-${i}`,
                             title: course.subject?.subjectName || 'Course Class',
                             date: checkDate,
                             time: course.timeSlot,
                             icon: '📚'
                         });
                     }
                 }
             }
        });

        // Sort by date/time
        allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

        return allEvents.length > 0 ? allEvents[0] : null;

    }, [trialClasses, enrollments]);


  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">Upcoming Class</h2>
        <div className="space-y-3">
        {upcomingClass ? (
            <div key={upcomingClass.id} className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
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
            <p className="text-gray-500 text-sm">No upcoming classes scheduled.</p>
        )}
        </div>
    </div>
  );
};

export default UpcomingClasses;
