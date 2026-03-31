import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';


interface ReportAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  title?: string;
  description?: string;
  isLoading?: boolean;
  actionType?: 'mentor-cancel' | 'student-absence';
}

export const ReportAbsenceModal: React.FC<ReportAbsenceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  isLoading = false,
  actionType = 'student-absence'
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Role-specific defaults
  const isMentorCancel = actionType === 'mentor-cancel';
  const displayTitle = title || (isMentorCancel ? "Cancel Session" : "Report Absence");
  const displayDescription = description || (isMentorCancel 
    ? "Provide a reason for cancellation. This will notify your student and release your slot capacity. (48 hours notice required)" 
    : "Please provide a reason for your absence. This will be shared with the relevant parties.");

  const themeColors = isMentorCancel 
    ? { icon: 'text-rose-600', iconBg: 'bg-rose-100', headerBg: 'bg-rose-50/50', button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' }
    : { icon: 'text-amber-600', iconBg: 'bg-amber-100', headerBg: 'bg-gray-50/50', button: 'bg-slate-900 hover:bg-slate-800 shadow-slate-200' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason.');
      return;
    }
    setError('');
    await onSubmit(reason);
    setReason(''); // Reset after success
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between ${themeColors.headerBg}`}>
          <div className="flex items-center gap-2">
             <div className={`p-2 ${themeColors.iconBg} ${themeColors.icon} rounded-lg`}>
                <AlertTriangle size={20} />
             </div>
             <h3 className="font-bold text-lg text-gray-900">{displayTitle}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            {displayDescription}
          </p>

          <div className="space-y-2">
            <label htmlFor="reason" className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
              }}
              placeholder="e.g., Identifying illness, Family emergency..."
              className={`w-full p-3 rounded-xl border ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-200'} focus:ring-4 transition-all outline-none min-h-[100px] text-sm resize-none`}
              disabled={isLoading}
            />
            {error && <p className="text-xs text-rose-500 font-medium mt-1">{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`${themeColors.button} text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition-all`}
            >
              {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isLoading ? 'Submitting...' : isMentorCancel ? 'Confirm Cancellation' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
