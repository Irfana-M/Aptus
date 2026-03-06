import React, { useState, useEffect } from 'react';
import { MentorLayout } from '../../components/mentor/MentorLayout';
import { Calendar, Clock, Filter, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { mentorApi } from '../../features/mentor/mentorApi';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';
import { LeaveStatus } from '../../enums/LeaveStatus';

interface LeaveRequest {
  _id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
}

const MentorLeaves: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Form State
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await mentorApi.getMyLeaves({
        page,
        limit: 10,
        status: statusFilter || undefined
      });
      
      if (response.success) {
        setLeaves(response.data.items);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch leaves", error);
      toast.error("Failed to load leave history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [page, statusFilter]);

  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setSubmitting(true);
      await mentorApi.requestLeave(leaveForm);
      toast.success("Leave request submitted successfully");
      setIsRequestModalOpen(false);
      setLeaveForm({ startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const statusColors = {
    [LeaveStatus.PENDING]: 'bg-amber-50 text-amber-700 border-amber-100',
    [LeaveStatus.APPROVED]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    [LeaveStatus.REJECTED]: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  const statusIcons = {
    [LeaveStatus.PENDING]: <Clock size={14} />,
    [LeaveStatus.APPROVED]: <CheckCircle2 size={14} />,
    [LeaveStatus.REJECTED]: <XCircle size={14} />,
  };

  return (
    <MentorLayout title="My Leave History">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Leave Management</h2>
            <p className="text-slate-500 font-bold text-sm">Track and manage your leave requests</p>
          </div>
          <Button 
            onClick={() => setIsRequestModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            Apply for New Leave
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Filter:</span>
          </div>
          <div className="flex gap-2">
            {['', LeaveStatus.PENDING, LeaveStatus.APPROVED, LeaveStatus.REJECTED].map((status) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === status 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
                }`}
              >
                {status || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Table/List UI */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          {loading ? (
            <div className="p-20">
              <Loader size="lg" text="Fetching your leave history..." />
            </div>
          ) : leaves.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Duration</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reason</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Applied On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {leaves.map((leave) => (
                    <tr key={leave._id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${statusColors[leave.status].split(' ')[0]} shadow-sm`}>
                            <Calendar size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                              {new Date(leave.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - 
                              {new Date(leave.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                              {Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} Days
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 max-w-xs">
                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {leave.reason}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusColors[leave.status]}`}>
                          {statusIcons[leave.status]}
                          <span className="capitalize">{leave.status}</span>
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className="text-xs font-bold text-slate-500">
                          {new Date(leave.appliedAt).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(leave.appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="p-2 bg-white rounded-xl border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="p-2 bg-white rounded-xl border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={AlertCircle}
              title="No leave requests found"
              description={statusFilter ? `You have no ${statusFilter} leave requests.` : "You haven't applied for any leaves yet."}
            />
          )}
        </div>
      </div>

      {/* NEW LEAVE MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl shadow-indigo-900/20 overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Request Leave</h3>
              <p className="text-sm text-slate-500 font-bold mt-1">Please ensure you provide a valid reason.</p>
            </div>

            <form onSubmit={handleRequestLeave} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Start Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">End Date</label>
                  <input
                    type="date"
                    required
                    min={leaveForm.startDate || new Date().toISOString().split('T')[0]}
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Reason for Leave</label>
                <textarea
                  required
                  rows={4}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Explain why you need leave..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MentorLayout>
  );
};

export default MentorLeaves;
