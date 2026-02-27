import React, { useState, useEffect } from 'react';
import { MentorLayout } from '../../components/mentor/MentorLayout';
import { FileText, ClipboardList, Plus, Download, MessageSquare, Users, Calendar } from 'lucide-react';
import { getMentorMaterials, getAssignmentSubmissions, provideFeedback, getMentorDownloadUrl, type StudyMaterial, type AssignmentSubmission } from '../../api/classroomApi';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import CreateAssignmentModal from '../../components/classroom/CreateAssignmentModal';
import FeedbackModal from '../../components/classroom/FeedbackModal';
import UploadMaterialModal from '../../features/classroom/components/UploadMaterialModal';
import { useSearchParams } from 'react-router-dom';

type TabType = 'materials' | 'assignments';

const MentorStudyMaterials: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('materials');
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [assignments, setAssignments] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [sessionIdForUpload, setSessionIdForUpload] = useState<string | undefined>(undefined);
  const [selectedAssignment, setSelectedAssignment] = useState<StudyMaterial | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{ show: boolean; submission: AssignmentSubmission | null }>({ show: false, submission: null });

  const loadData = async () => {
    try {
      setLoading(true);
      const [materialsRes, assignmentsRes] = await Promise.all([
        getMentorMaterials('study_material'),
        getMentorMaterials('assignment')
      ]);
      setMaterials(materialsRes.data || []);
      setAssignments(assignmentsRes.data || []);
    } catch (error) {
      console.error('Failed to load data', error);
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Auto-open upload modal if sessionId is in query params
    const sessionId = searchParams.get('sessionId');
    if (sessionId) {
      setSessionIdForUpload(sessionId);
      setShowUploadModal(true);
      setActiveTab('materials');
    }
  }, [searchParams]);

  const handleDownload = async (fileKey: string, fileName: string) => {
    try {
      const res = await getMentorDownloadUrl(fileKey);
      const link = document.createElement('a');
      link.href = res.data.url;
      link.download = fileName;
      link.click();
    } catch {
      toast.error('Failed to download file');
    }
  };

  const handleViewSubmissions = async (assignment: StudyMaterial) => {
    try {
      setSelectedAssignment(assignment);
      const res = await getAssignmentSubmissions(assignment._id);
      setSubmissions(res.data || []);
      setShowSubmissions(true);
    } catch {
      toast.error('Failed to load submissions');
    }
  };

  const handleProvideFeedback = async (submissionId: string, feedback: string) => {
    try {
      await provideFeedback(submissionId, feedback);
      toast.success('Feedback provided successfully');
      setFeedbackModal({ show: false, submission: null });
      // Refresh submissions
      if (selectedAssignment) {
        const res = await getAssignmentSubmissions(selectedAssignment._id);
        setSubmissions(res.data || []);
      }
    } catch {
      toast.error('Failed to provide feedback');
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
    
    if (diff < 0) return { text: 'Overdue', color: 'text-rose-600 bg-rose-50' };
    if (hours < 24) return { text: `${hours}h left`, color: 'text-amber-600 bg-amber-50' };
    const days = Math.floor(hours / 24);
    return { text: `${days}d left`, color: 'text-emerald-600 bg-emerald-50' };
  };

  return (
    <MentorLayout title="Study Materials & Assignments">
      {/* Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 mb-6 inline-flex gap-2">
        <button
          onClick={() => { setActiveTab('materials'); setShowSubmissions(false); }}
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
          onClick={() => { setActiveTab('assignments'); setShowSubmissions(false); }}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'assignments' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ClipboardList size={18} />
          Assignments
        </button>
      </div>

      {/* Create Button */}
      {activeTab === 'assignments' && !showSubmissions && (
        <div className="mb-6">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            <Plus size={20} />
            Create Assignment
          </Button>
        </div>
      )}

      {activeTab === 'materials' && !showSubmissions && (
        <div className="mb-6">
          <Button 
            onClick={() => {
              setSessionIdForUpload(undefined);
              setShowUploadModal(true);
            }}
            className="bg-[#1A1A80] hover:bg-[#2A2A90] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100"
          >
            <Plus size={20} />
            Upload Study Material
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />)}
          </div>
        ) : showSubmissions && selectedAssignment ? (
          /* Submissions View */
          <div>
            <button 
              onClick={() => setShowSubmissions(false)} 
              className="text-indigo-600 font-bold mb-4 hover:underline"
            >
              ← Back to Assignments
            </button>
            <h2 className="text-xl font-black text-slate-800 mb-4">
              Submissions for "{selectedAssignment.title}"
            </h2>
            
            {submissions.length > 0 ? (
              <div className="space-y-4">
                {submissions.map(sub => (
                  <div key={sub._id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        {sub.studentId.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{sub.studentId.fullName}</p>
                        <p className="text-xs text-slate-500">
                          Submitted: {formatDate(sub.submittedAt)}
                          {sub.isLate && <span className="ml-2 text-rose-500 font-bold">LATE</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {sub.files.map((f, i) => (
                        <button
                          key={i}
                          onClick={() => handleDownload(f.fileKey, f.fileName)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1"
                        >
                          <Download size={16} />
                          {f.fileName.length > 15 ? f.fileName.slice(0, 15) + '...' : f.fileName}
                        </button>
                      ))}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${sub.status === 'reviewed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {sub.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                      </span>
                      <button
                        onClick={() => setFeedbackModal({ show: true, submission: sub })}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Provide Feedback"
                      >
                        <MessageSquare size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl">
                <p className="text-slate-500">No submissions yet</p>
              </div>
            )}
          </div>
        ) : activeTab === 'materials' ? (
          /* Study Materials View */
          materials.length > 0 ? (
            <div className="space-y-4">
              {materials.map(m => (
                <div key={m._id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-indigo-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{m.title}</h3>
                      <p className="text-xs text-slate-500">
                        {m.subjectId?.subjectName || 'General'} • {formatFileSize(m.fileSize)} • {formatDate(m.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(m.fileUrl, m.originalName)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold text-sm flex items-center gap-2"
                  >
                    <Download size={18} />
                    Download
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-900 font-bold">No study materials uploaded</p>
              <p className="text-slate-500 text-sm mt-1">Upload materials after completing sessions</p>
            </div>
          )
        ) : (
          /* Assignments View */
          assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map(a => {
                const dueStatus = a.assignmentDetails?.dueDate ? getDueStatus(a.assignmentDetails.dueDate) : null;
                return (
                  <div key={a._id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                          <ClipboardList size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{a.title}</h3>
                          <p className="text-sm text-slate-600 mt-1">{a.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              Due: {a.assignmentDetails?.dueDate ? formatDate(a.assignmentDetails.dueDate) : 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {a.assignmentDetails?.assignedTo?.length || 0} students
                            </span>
                            {dueStatus && (
                              <span className={`px-2 py-0.5 rounded-full font-bold ${dueStatus.color}`}>
                                {dueStatus.text}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleDownload(a.fileUrl, a.originalName)}
                          className="p-2 text-slate-400 hover:text-indigo-600"
                          title="Download"
                        >
                          <Download size={20} />
                        </button>
                        <Button
                          onClick={() => handleViewSubmissions(a)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold"
                        >
                          View Submissions
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <ClipboardList size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-900 font-bold">No assignments created</p>
              <p className="text-slate-500 text-sm mt-1">Create your first assignment to get started</p>
            </div>
          )
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateAssignmentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {showUploadModal && (
        <UploadMaterialModal
          sessionId={sessionIdForUpload}
          onClose={() => {
            setShowUploadModal(false);
            setSearchParams({}); // Clear query params on close
          }}
          onSuccess={() => {
            setShowUploadModal(false);
            setSearchParams({}); // Clear query params on success
            loadData();
          }}
        />
      )}

      {feedbackModal.show && feedbackModal.submission && (
        <FeedbackModal
          submission={feedbackModal.submission}
          onClose={() => setFeedbackModal({ show: false, submission: null })}
          onSubmit={(feedback) => handleProvideFeedback(feedbackModal.submission!._id, feedback)}
        />
      )}
    </MentorLayout>
  );
};

export default MentorStudyMaterials;
