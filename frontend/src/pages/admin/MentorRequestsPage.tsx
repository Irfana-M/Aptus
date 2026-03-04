import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchAllMentorRequestsAdmin, approveMentorRequestAdmin, rejectMentorRequestAdmin } from "../../features/admin/adminThunk";
import { Sidebar } from "../../components/admin/Sidebar";
import { Topbar } from "../../components/admin/Topbar";
import { Check, X, Clock, User, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { Loader } from "../../components/ui/Loader";
import { EmptyState } from "../../components/ui/EmptyState";

const MentorRequestsPage = () => {
  const dispatch = useAppDispatch();
  const {mentorAssignmentRequests, loading} = useAppSelector((state) => state.admin);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAllMentorRequestsAdmin());
  }, [dispatch]);

  const handleApprove = async (requestId: string) => {
    setIsProcessing(requestId);
    try {
      await dispatch(approveMentorRequestAdmin(requestId)).unwrap();
      toast.success("Request approved successfully");
    } catch {
      toast.error("Failed to approve request");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = window.prompt("Reason for rejection:");
    if (!reason) return;

    setIsProcessing(requestId);
    try {
      await dispatch(rejectMentorRequestAdmin({ requestId, reason })).unwrap();
      toast.success("Request rejected successfully");
    } catch {
      toast.error("Failed to reject request");
    } finally {
      setIsProcessing(null);
    }
  };

  const pendingRequests = mentorAssignmentRequests.filter((req) => req.status === 'pending');
  const pastRequests = mentorAssignmentRequests.filter((req) => req.status !== 'pending');

  const RequestsTable = ({ requests, title }: { requests: typeof mentorAssignmentRequests, title: string }) => (
     <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          {title}
          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs">{requests.length}</span>
        </h2>
      </div>
      
      {requests.length === 0 ? (
        <div className="p-12">
           <EmptyState 
              icon={BookOpen} 
              title="No requests found" 
              description={`There are no ${title.toLowerCase()} at the moment.`} 
           />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Requested Mentor</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {typeof req.student === 'object' ? req.student.fullName?.[0] : '?'}
                       </div>
                       {typeof req.student === 'object' ? req.student.fullName : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                     <span className="flex items-center gap-2">
                        <User size={16} /> {typeof req.mentor === 'object' ? req.mentor.fullName : 'N/A'}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-medium text-xs border border-slate-200">
                      {typeof req.subject === 'object' ? req.subject.subjectName : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    <div className="flex items-center gap-1.5">
                       <Clock size={14} />
                       {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                      req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        req.status === 'pending' ? 'bg-amber-500' :
                        req.status === 'approved' ? 'bg-emerald-500' :
                        'bg-rose-500'
                      }`} />
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {req.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(req._id)}
                          disabled={isProcessing === req._id}
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-all disabled:opacity-50"
                          title="Approve"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => handleReject(req._id)}
                          disabled={isProcessing === req._id}
                          className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-all disabled:opacity-50"
                          title="Reject"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
     </div>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        isOpen={sidebarOpen}
        activeItem="Mentor Requests"
        onItemClick={() => {}}
        onClose={() => setSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title="Mentor Requests"
        />
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mentor Assignment Requests</h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage and review student requests for personal mentors.</p>
                </div>

                {loading && !mentorAssignmentRequests.length ? (
                    <div className="py-20">
                        <Loader size="lg" text="Loading requests..." />
                    </div>
                ) : (
                    <>
                        <RequestsTable requests={pendingRequests} title="Pendings Requests" />
                        <RequestsTable requests={pastRequests} title="Past History" />
                    </>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};

export default MentorRequestsPage;
