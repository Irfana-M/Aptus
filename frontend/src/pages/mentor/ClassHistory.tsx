import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar, BookOpen, Clock, ClipboardList } from 'lucide-react';
import { MentorLayout } from '../../components/mentor/MentorLayout';
import { Table, type TableColumn } from '../../components/mentor/Table';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';
import { fetchMentorTrialClasses, fetchMentorProfile, fetchMentorCourses } from "../../features/mentor/mentorThunk";
import type { AppDispatch, RootState } from "../../app/store";

// Helper for date formatting
const formatDate = (dateString: string) => {
    try {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    } catch {
        return dateString;
    }
};

interface HistoryItem {
    id: string;
    studentName: string;
    subject: string;
    grade: string;
    date: string;
    time: string;
    type: 'Trial' | 'Regular';
    status: string;
}

const ClassHistory: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();

    const { trialClasses, courses, loading, profile } = useSelector((state: RootState) => state.mentor);
    const [view, setView] = useState<'all' | 'trial' | 'regular'>('all');

    useEffect(() => {
        dispatch(fetchMentorTrialClasses());
        dispatch(fetchMentorCourses());
        if (!profile) {
            dispatch(fetchMentorProfile());
        }
    }, [dispatch, profile]);

    // Format and combine data
    const historyData = React.useMemo(() => {
        const data: HistoryItem[] = [];

        // Add completed trial classes
        trialClasses.forEach(tc => {
            if (tc.status === 'completed') {
                data.push({
                    id: tc._id || tc.id,
                    studentName: tc.student?.fullName || 'N/A',
                    subject: tc.subject?.subjectName || 'N/A',
                    grade: (tc.subject?.grade as string) || 'N/A',
                    date: tc.preferredDate,
                    time: tc.preferredTime,
                    type: 'Trial',
                    status: tc.status
                });
            }
        });

        // Add courses (simplified for history view)
        courses.forEach(course => {
            // Courses are ongoing, but we can show them here if they've started
            // In a real app, you'd show individual completed sessions
            data.push({
                id: course._id,
                studentName: course.student?.fullName || (course.courseType === 'group' ? 'Group Batch' : 'Regular Student'),
                subject: course.subject?.subjectName || 'N/A',
                grade: course.grade?.name || 'N/A',
                date: course.startDate,
                time: course.schedule?.timeSlot || course.timeSlot || 'N/A',
                type: 'Regular',
                status: course.status
            });
        });

        // Sort by date descending
        return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [trialClasses, courses]);

    const filteredData = historyData.filter(item => {
        if (view === 'all') return true;
        return item.type.toLowerCase() === view;
    });

    const columns: TableColumn<HistoryItem>[] = [
        {
            header: 'Date',
            accessor: (item) => (
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{formatDate(item.date)}</span>
                </div>
            )
        },
        {
            header: 'Student/Batch',
            accessor: (item) => (
                <div>
                    <div className="font-medium text-gray-900">{item.studentName}</div>
                    <div className="text-xs text-gray-500">{item.grade}</div>
                </div>
            )
        },
        {
            header: 'Subject',
            accessor: (item) => (
                <div className="flex items-baseline gap-2">
                    <BookOpen size={14} className="text-gray-400" />
                    <span>{item.subject}</span>
                </div>
            )
        },
        {
            header: 'Time',
            accessor: (item) => (
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span>{item.time}</span>
                </div>
            )
        },
        {
            header: 'Type',
            accessor: (item) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.type === 'Trial' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                    {item.type}
                </span>
            )
        },
        {
            header: 'Status',
            accessor: (item) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    item.status === 'completed' || item.status === 'conducted' || item.status === 'active' || item.status === 'ongoing'
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                }`}>
                    {item.status}
                </span>
            )
        }
    ];

    return (
        <MentorLayout title="Class History">
            <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Class History</h1>
                        <p className="text-gray-500 mt-1">Review all your completed sessions</p>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setView('all')}
                            className={`px-4 py-1.5 text-sm rounded-md transition-all ${view === 'all' ? 'bg-white shadow-sm text-cyan-600 font-medium' : 'text-gray-500'}`}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setView('trial')}
                            className={`px-4 py-1.5 text-sm rounded-md transition-all ${view === 'trial' ? 'bg-white shadow-sm text-cyan-600 font-medium' : 'text-gray-500'}`}
                        >
                            Trials
                        </button>
                        <button 
                            onClick={() => setView('regular')}
                            className={`px-4 py-1.5 text-sm rounded-md transition-all ${view === 'regular' ? 'bg-white shadow-sm text-cyan-600 font-medium' : 'text-gray-500'}`}
                        >
                            Regular
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12">
                            <Loader size="md" />
                        </div>
                    ) : filteredData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table data={filteredData} columns={columns} />
                        </div>
                    ) : (
                        <div className="p-12">
                            <EmptyState 
                                title="No classes found"
                                description="No completed classes found for this view."
                                icon={ClipboardList}
                            />
                        </div>
                    )}
                </div>
            </div>
        </MentorLayout>
    );
};

export default ClassHistory;
