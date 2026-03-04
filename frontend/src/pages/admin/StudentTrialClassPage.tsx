import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { ROUTES } from '../../constants/routes.constants';
import { fetchStudentTrialClasses } from '../../features/admin/adminThunk';
import { selectAdminLoading } from '../../features/admin/adminSelectors';
import { Sidebar } from '../../components/admin/Sidebar';
import { Topbar } from '../../components/admin/Topbar';
import { DataTable } from '../../components/ui/DataTable';
import { showToast } from '../../utils/toast';
import { Loader } from '../../components/ui/Loader';
import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  BookOpen,
  Video,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import type { TrialClass, TrialClassStudent } from '../../types/trialTypes';

import type { Column } from "../../types/table.types";

export const StudentTrialClassesPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectAdminLoading);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Students");
  const [trialClasses, setTrialClasses] = useState<TrialClass[]>([]);
  const [studentInfo, setStudentInfo] = useState<TrialClassStudent | null>(null);

  useEffect(() => {
    if (studentId) {
      loadStudentTrialClasses();
    }
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStudentTrialClasses = async () => {
    try {
      const result = await dispatch(fetchStudentTrialClasses({ 
        studentId: studentId! 
      })).unwrap();
      
      setTrialClasses(result);
      
      
      if (result.length > 0 && result[0].student) {
        setStudentInfo(result[0].student);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      showToast.error(err.message || 'Failed to load trial classes');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'assigned':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return "bg-yellow-100 text-yellow-800";
      case 'assigned':
        return "bg-blue-100 text-blue-800";
      case 'completed':
        return "bg-green-100 text-green-800";
      case 'cancelled':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns: Column<TrialClass>[] = [
    {
      header: "Subject & Grade",
      accessor: (row) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">{row.subject.subjectName}</p>
          <p className="text-gray-500">{row.subject.syllabus} - Grade {row.subject.gradeId || row.subject.grade}</p>
        </div>
      ),
    },
    {
      header: "Preferred Time",
      accessor: (row) => (
        <div className="text-sm">
          <p className="text-gray-900">
            {new Date(row.preferredDate).toLocaleDateString()}
          </p>
          <p className="text-gray-500">{row.preferredTime}</p>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Status",
      accessor: (row) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(row.status)}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Mentor",
      accessor: (row) => (
        <div className="text-sm">
          {row.mentor ? (
            <div>
              <p className="font-medium text-gray-900">{row.mentor.name}</p>
              <p className="text-gray-500">{row.mentor.email}</p>
              {row.meetLink && (
                <a 
                  href={row.meetLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 mt-1"
                >
                  <Video size={12} />
                  Join Meeting
                </a>
              )}
            </div>
          ) : (
            <span className="text-gray-400">Not assigned</span>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/admin/trial-class/${row.id}`)}
            className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors duration-200"
            title="View Details"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (loading && trialClasses.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          isOpen={sidebarOpen}
          activeItem={activeNav}
          onItemClick={setActiveNav}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex items-center justify-center">
          <Loader size="lg" text="Loading trial classes..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        activeItem={activeNav}
        onItemClick={setActiveNav}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title="Student Trial Classes"
          user={{
            name: "Admin User",
            email: "admin@mentora.com",
          }}
        />

        <div className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(ROUTES.ADMIN.STUDENTS)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {studentInfo ? `${studentInfo.fullName}'s Trial Classes` : 'Student Trial Classes'}
                </h1>
                <p className="text-gray-600">
                  Student ID: {studentId}
                  {studentInfo && ` • ${studentInfo.email}`}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Classes</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{trialClasses.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {trialClasses.filter(tc => tc.status === 'requested').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Assigned</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {trialClasses.filter(tc => tc.status === 'assigned').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {trialClasses.filter(tc => tc.status === 'completed').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Trial Classes Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Trial Class Requests</h2>
              <p className="text-gray-500 text-sm mt-1">
                Showing {trialClasses.length} trial classes for this student
              </p>
            </div>

            <DataTable<TrialClass>
              columns={columns}
              data={trialClasses}
              loading={loading}
              onRowClick={(trialClass) => navigate(`/admin/trial-class/${trialClass.id}`)}
              variant="bordered"
              emptyMessage={
                trialClasses.length === 0 
                  ? "No trial classes found for this student"
                  : "No trial classes match your criteria"
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentTrialClassesPage;
