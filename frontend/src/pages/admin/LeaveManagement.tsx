import React, { useState, useEffect } from "react";
import { adminLeaveApi } from "../../features/admin/adminApi";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { Loader } from "../../components/ui/Loader";
import { EmptyState } from "../../components/ui/EmptyState";
import { LeaveStatus } from "../../enums/LeaveStatus";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";

interface LeaveRequest {
  _id: string;
  mentorId: string;
  mentorName: string;
  mentorEmail: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  rejectionReason?: string;
}

const LeaveManagement: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [mentorSearch, setMentorSearch] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const [rejectingLeave, setRejectingLeave] = useState<LeaveRequest | null>(
    null,
  );

  const [rejectionReason, setRejectionReason] = useState("");

  // Confirmation Modal
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedLeaveForApproval, setSelectedLeaveForApproval] = useState<{
    id: string;
    mentorId: string;
  } | null>(null);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await adminLeaveApi.fetchAllLeaves({
        page,
        limit: 10,
        status: statusFilter || undefined,
      });

      if (response.data.success) {
        setLeaves(response.data.data.items);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch leaves", error);
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [page, statusFilter]);

  const handleApproveClick = (leaveId: string, mentorId: string) => {
    setSelectedLeaveForApproval({ id: leaveId, mentorId });
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedLeaveForApproval) return;

    try {
      setSubmittingAction(true);
      const { id, mentorId } = selectedLeaveForApproval;
      const response = await adminLeaveApi.approveLeave(id, mentorId);
      if (response.data.success) {
        toast.success("Leave request approved");
        setShowApproveModal(false);
        setSelectedLeaveForApproval(null);
        fetchLeaves();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve leave");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingLeave || !rejectionReason.trim()) return;

    try {
      setSubmittingAction(true);
      const response = await adminLeaveApi.rejectLeave(
        rejectingLeave._id,
        rejectingLeave.mentorId,
        rejectionReason,
      );
      if (response.data.success) {
        toast.success("Leave request rejected");
        setRejectingLeave(null);
        setRejectionReason("");
        fetchLeaves();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject leave");
    } finally {
      setSubmittingAction(false);
    }
  };

  const statusColors = {
    [LeaveStatus.PENDING]: "bg-amber-50 text-amber-700 border-amber-100",
    [LeaveStatus.APPROVED]: "bg-emerald-50 text-emerald-700 border-emerald-100",
    [LeaveStatus.REJECTED]: "bg-rose-50 text-rose-700 border-rose-100",
  };

  return (
    <AdminLayout title="Mentor Leave Management" activeItem="Leave Management">
      <div className="flex-1 overflow-y-auto p-4 space-y-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
              Leave Requests
            </h1>
            <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px]">
              Review and manage mentor absence requests
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Search mentor name..."
                value={mentorSearch}
                onChange={(e) => setMentorSearch(e.target.value)}
                className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-sm w-full md:w-64 shadow-sm"
              />
            </div>
            <Button
              onClick={fetchLeaves}
              className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 shadow-sm"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-[24px] border border-slate-100 shadow-sm">
          {[
            "",
            LeaveStatus.PENDING,
            LeaveStatus.APPROVED,
            LeaveStatus.REJECTED,
          ].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 ${
                statusFilter === status
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${status ? statusColors[status as LeaveStatus].split(" ")[0].replace("bg-", "bg-") : "bg-slate-400"}`}
              />
              {status || "All Requests"}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
          {loading ? (
            <div className="p-32">
              <Loader size="lg" text="Syncing leave records..." />
            </div>
          ) : leaves.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Mentor info
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Duration
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Reason / Details
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                      Status
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {leaves.map((leave) => (
                    <tr
                      key={leave._id}
                      className="hover:bg-slate-50/40 transition-colors group"
                    >
                      <td className="px-8 py-7">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black relative overflow-hidden group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                            {leave.mentorName.charAt(0)}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {leave.mentorName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                              {leave.mentorEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Calendar size={14} className="text-indigo-400" />
                            {new Date(leave.startDate).toLocaleDateString(
                              "en-GB",
                              { day: "2-digit", month: "short" },
                            )}{" "}
                            -
                            {new Date(leave.endDate).toLocaleDateString(
                              "en-GB",
                              { day: "2-digit", month: "short" },
                            )}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                            Applied{" "}
                            {new Date(leave.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="max-w-[280px]">
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            {leave.reason}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-7 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${statusColors[leave.status]}`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${leave.status === "pending" ? "bg-amber-400 animate-pulse" : ""}`}
                          />
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-8 py-7 text-right">
                        {leave.status === LeaveStatus.PENDING ? (
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() =>
                                handleApproveClick(leave._id, leave.mentorId)
                              }
                              disabled={submittingAction}
                              className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"
                              title="Approve Leave"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <button
                              onClick={() => setRejectingLeave(leave)}
                              disabled={submittingAction}
                              className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90"
                              title="Reject Leave"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2 text-slate-300">
                            <MoreHorizontal size={20} />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="px-10 py-8 bg-slate-50/40 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400"
                      >
                        {i}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Showing Page {page} of {totalPages}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={AlertTriangle}
              title="No leave history available"
              description={
                statusFilter
                  ? `No leave requests currently in ${statusFilter} state.`
                  : "Mentor leave requests will appear here once submitted."
              }
            />
          )}
        </div>
      </div>

      {/* Confirmation Modal for Approval */}
      {showApproveModal && (
        <ConfirmationModal
          isOpen={showApproveModal}
          onClose={() => {
            setShowApproveModal(false);
            setSelectedLeaveForApproval(null);
          }}
          onConfirm={handleConfirmApprove}
          title="Approve Leave Request"
          message="Are you sure you want to approve this leave request? This action will mark the leave as approved."
          confirmText="Approve"
          variant="info"
          isLoading={submittingAction}
        />
      )}

      {rejectingLeave && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-8 bg-rose-50/50 border-b border-rose-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <XCircle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Reject Leave
                </h3>
                <p className="text-[10px] font-black uppercase text-rose-600 tracking-widest mt-0.5">
                  Request for {rejectingLeave.mentorName}
                </p>
              </div>
            </div>

            <form onSubmit={handleReject} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  Rejection Reason
                </label>
                <textarea
                  required
                  autoFocus
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this request is being rejected..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRejectingLeave(null)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="flex-[2] py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-rose-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  {submittingAction ? "Processing..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default LeaveManagement;
