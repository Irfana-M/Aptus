import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/students/StudentLayout';
import { FileText, ClipboardList, Download, Clock, CheckCircle, AlertCircle, MessageSquare, Upload, Calendar } from 'lucide-react';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { getStudentMaterials, getStudentAssignments, getMySubmission, getStudentDownloadUrl, type StudyMaterial, type AssignmentSubmission } from '../../api/classroomApi';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import SubmitAssignmentModal from '../../components/classroom/SubmitAssignmentModal';

type TabType = 'materials' | 'assignments';

const StudentStudyMaterials: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('materials');
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [assignments, setAssignments] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionModal, setSubmissionModal] = useState<{ show: boolean; assignment: StudyMaterial | null }>({ show: false, assignment: null });
  const [submissionDetails, setSubmissionDetails] = useState<{ [key: string]: AssignmentSubmission | null }>({});

  const ITEMS_PER_PAGE = 10;
  const [materialsPage, setMaterialsPage] = useState(1);
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  useEffect(() => { setMaterialsPage(1); }, [materials.length]);
  useEffect(() => { setAssignmentsPage(1); }, [assignments.length]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [materialsRes, assignmentsRes] = await Promise.all([
        getStudentMaterials(),
        getStudentAssignments()
      ]);
      
      // Filter study materials
      const allMaterials = materialsRes.data || [];
      setMaterials(allMaterials.filter((m: StudyMaterial) => m.materialType === 'study_material'));
      setAssignments(assignmentsRes.data || []);
      
      // Load submission status for each assignment
      const assignmentData = assignmentsRes.data || [];
      const submissionPromises = assignmentData.map(async (a: StudyMaterial) => {
        try {
          const res = await getMySubmission(a._id);
          return { id: a._id, submission: res.data };
        } catch {
          return { id: a._id, submission: null };
        }
      });
      
      const results = await Promise.all(submissionPromises);
      const details: { [key: string]: AssignmentSubmission | null } = {};
      results.forEach((r: { id: string; submission: AssignmentSubmission | null }) => { details[r.id] = r.submission; });
      setSubmissionDetails(details);
      
    } catch {
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownload = async (fileKey: string, fileName: string) => {
    try {
      const res = await getStudentDownloadUrl(fileKey);
      const link = document.createElement('a');
      link.href = res.data.url;
      link.download = fileName;
      link.click();
    } catch {
      toast.error('Failed to download file');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getDueStatus = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (diff < 0) return { text: 'Overdue', color: 'text-rose-600 bg-rose-50', icon: AlertCircle };
    if (hours < 24) return { text: `${hours}h left`, color: 'text-amber-600 bg-amber-50', icon: Clock };
    const days = Math.floor(hours / 24);
    return { text: `${days}d left`, color: 'text-emerald-600 bg-emerald-50', icon: Calendar };
  };

  const getSubmissionStatus = (assignmentId: string) => {
    const sub = submissionDetails[assignmentId];
    if (!sub) return { status: 'pending', text: 'Not Submitted', color: 'bg-slate-100 text-slate-600' };
    if (sub.status === 'reviewed') return { status: 'reviewed', text: 'Reviewed', color: 'bg-emerald-100 text-emerald-700' };
    return { status: 'submitted', text: 'Submitted', color: 'bg-indigo-100 text-indigo-700' };
  };

  return (
    <StudentLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-black text-slate-900 mb-6">Study Materials & Assignments</h1>

        {/* Tabs */}
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 mb-6 inline-flex gap-2">
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'materials' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText size={18} />
            Study Materials
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'assignments' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ClipboardList size={18} />
            Assignments
            {assignments.filter(a => !submissionDetails[a._id]).length > 0 && (
              <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">
                {assignments.filter(a => !submissionDetails[a._id]).length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          {loading ? (
            <Loader size="lg" text="Loading your materials..." />
          ) : activeTab === 'materials' ? (
            /* Study Materials */
            materials.length > 0 ? (
              <>
              <div className="space-y-4">
                {materials.slice((materialsPage - 1) * ITEMS_PER_PAGE, materialsPage * ITEMS_PER_PAGE).map(m => (
                  <div key={m._id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-indigo-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{m.title}</h3>
                        <p className="text-xs text-slate-500">
                          {m.subjectId?.subjectName || 'General'} • by {m.mentorId?.fullName} • {formatFileSize(m.fileSize)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{formatDate(m.createdAt)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(m.fileUrl, m.originalName)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                ))}
              </div>
              {materials.length > ITEMS_PER_PAGE && (
                <div className="mt-4">
                  <Pagination
                    currentPage={materialsPage}
                    totalPages={Math.ceil(materials.length / ITEMS_PER_PAGE)}
                    totalItems={materials.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setMaterialsPage}
                    showItemsPerPage={false}
                    variant="minimal"
                  />
                </div>
              )}
              </>
            ) : (
              <EmptyState 
                icon={FileText} 
                title="No study materials available" 
                description="Materials from your mentors will appear here." 
              />
            )
          ) : (
            /* Assignments */
            assignments.length > 0 ? (
              <>
              <div className="space-y-4">
                {assignments.slice((assignmentsPage - 1) * ITEMS_PER_PAGE, assignmentsPage * ITEMS_PER_PAGE).map(a => {
                  const dueStatus = a.assignmentDetails?.dueDate ? getDueStatus(a.assignmentDetails.dueDate) : null;
                  const subStatus = getSubmissionStatus(a._id);
                  const submission = submissionDetails[a._id];
                  const DueIcon = dueStatus?.icon || Clock;
                  
                  return (
                    <div key={a._id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                            <ClipboardList size={24} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-slate-900">{a.title}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${subStatus.color}`}>
                                {subStatus.text}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{a.description}</p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                              <span>by {a.mentorId?.fullName}</span>
                              <span className="flex items-center gap-1">
                                <DueIcon size={14} />
                                Due: {a.assignmentDetails?.dueDate ? formatDate(a.assignmentDetails.dueDate) : 'N/A'}
                              </span>
                              {dueStatus && (
                                <span className={`px-2 py-0.5 rounded-full font-bold ${dueStatus.color}`}>
                                  {dueStatus.text}
                                </span>
                              )}
                            </div>
                            
                            {/* Feedback Display */}
                            {submission?.status === 'reviewed' && submission.feedback && (
                              <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold mb-1">
                                  <MessageSquare size={14} />
                                  Mentor Feedback
                                </div>
                                <p className="text-sm text-slate-700">{submission.feedback}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 items-end ml-4">
                          <button
                            onClick={() => handleDownload(a.fileUrl, a.originalName)}
                            className="flex items-center gap-2 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-bold transition-colors"
                          >
                            <Download size={16} />
                            Download
                          </button>
                          
                          {!submission && (
                            <Button
                              onClick={() => setSubmissionModal({ show: true, assignment: a })}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold"
                            >
                              <Upload size={16} />
                              Submit
                            </Button>
                          )}
                          
                          {submission && subStatus.status === 'submitted' && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock size={12} />
                              Awaiting review
                            </span>
                          )}
                          
                          {submission?.status === 'reviewed' && (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle size={14} />
                              Feedback received
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {assignments.length > ITEMS_PER_PAGE && (
                <div className="mt-4">
                  <Pagination
                    currentPage={assignmentsPage}
                    totalPages={Math.ceil(assignments.length / ITEMS_PER_PAGE)}
                    totalItems={assignments.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setAssignmentsPage}
                    showItemsPerPage={false}
                    variant="minimal"
                  />
                </div>
              )}
              </>
            ) : (
              <EmptyState 
                icon={ClipboardList} 
                title="No assignments yet" 
                description="Assignments from your mentors will appear here." 
              />
            )
          )}
        </div>
      </div>

      {/* Submit Modal */}
      {submissionModal.show && submissionModal.assignment && (
        <SubmitAssignmentModal
          assignment={submissionModal.assignment}
          onClose={() => setSubmissionModal({ show: false, assignment: null })}
          onSuccess={() => {
            setSubmissionModal({ show: false, assignment: null });
            loadData();
          }}
        />
      )}
    </StudentLayout>
  );
};

export default StudentStudyMaterials;
