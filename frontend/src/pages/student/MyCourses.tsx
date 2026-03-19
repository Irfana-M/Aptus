import React, { useEffect, useState } from 'react';
import StudentLayout from '../../components/students/StudentLayout';
import { fetchMyCourses } from '../../features/student/studentApi';
import { BookOpen, Clock, CheckCircle, RefreshCcw, Calendar, Video } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';

import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';

interface Course {
    _id: string;
    courseType: string;
    subject: {
        _id: string;
        name?: string;
        subjectName?: string;
    };
    mentor: {
        _id: string;
        fullName: string;
    };
    grade: {
        _id: string;
        grade: string;
    };
    schedule: {
        days: string[];
        timeSlot: string;
    };
    status: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

const MyCourses: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadCourses = async () => {
        setLoading(true);
        try {
            const data = await fetchMyCourses();
            // Backend might return { status: 'success', data: [...] } or just [...]
            const list = data.data || data;
            setCourses(Array.isArray(list) ? (list as Course[]) : []);
        } catch (error) {
            console.error("Failed to load courses", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
    }, []);



    return (
        <StudentLayout title="My Courses">
            <div className="max-w-6xl mx-auto p-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Track Your Learning</h1>
                        <p className="text-slate-500 mt-1">Once you subscribe, our admin reviews your schedule and matches you with a mentor.</p>
                    </div>
                    <Button onClick={loadCourses} variant="outline" className="flex items-center gap-2">
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> 
                        Refresh Status
                    </Button>
                </div>

                {loading ? (
                    <Loader size="lg" text="Finding your courses..." />
                ) : courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <div key={course._id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-5 group-hover:opacity-10 transition-opacity`}>
                                     <BookOpen size={128} />
                                </div>

                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <BookOpen size={24} />
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border flex items-center gap-1.5 ${course.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                        {course.isActive ? <CheckCircle size={16} /> : <Clock size={16} />}
                                        {course.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <h3 className="text-xl font-black text-slate-800 mb-2 truncate">{course.subject?.subjectName || course.subject?.name || 'Subject'}</h3>
                                <p className="text-slate-400 text-sm mb-4 flex items-center gap-1.5">
                                    👨‍🏫 {course.mentor?.fullName || 'Mentor TBA'}
                                </p>
                                <p className="text-slate-400 text-sm mb-4 flex items-center gap-1.5">
                                    <Clock size={14} /> 
                                    {course.schedule?.days?.join(', ') || 'TBA'} • {course.schedule?.timeSlot || 'TBA'}
                                </p>

                                <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                                    <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                        <span>Grade {course.grade?.grade || 'N/A'} • {course.courseType}</span>
                                        <span>{course.status || 'available'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                        <Calendar size={12} />
                                        <span>Ends: {new Date(course.endDate).toLocaleDateString()}</span>
                                    </div>
                                    
                                    <Button 
                                        onClick={() => navigate(ROUTES.STUDENT.CLASSROOM)}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Video size={14} /> 
                                        JOIN
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState 
                        icon={BookOpen} 
                        title="No courses found" 
                        description="Your enrolled courses will appear here once admin approves your requests." 
                        actionLabel="GO TO DASHBOARD"
                        onAction={() => navigate(ROUTES.STUDENT.DASHBOARD)}
                    />
                )}
            </div>
        </StudentLayout>
    );
};

export default MyCourses;
