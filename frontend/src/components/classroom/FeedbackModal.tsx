import React, { useState } from 'react';
import { X, MessageSquare, Send, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import type { AssignmentSubmission } from '../../api/classroomApi';

interface FeedbackModalProps {
  submission: AssignmentSubmission;
  onClose: () => void;
  onSubmit: (feedback: string) => Promise<void>;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ submission, onClose, onSubmit }) => {
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(feedback);
    } finally {
      setLoading(false);
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Provide Feedback</h2>
              <p className="text-sm text-slate-500">for {submission.studentId.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Submission Info */}
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              Submitted: <span className="font-bold">{formatDate(submission.submittedAt)}</span>
            </span>
            {submission.isLate && (
              <span className="px-2 py-1 bg-rose-100 text-rose-600 rounded-full text-xs font-bold">
                LATE
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {submission.files.map((f, i) => (
              <span key={i} className="px-3 py-1 bg-white rounded-lg text-xs font-medium text-slate-600 border border-slate-200">
                📎 {f.fileName}
              </span>
            ))}
          </div>
        </div>

        {/* Feedback Input */}
        <div className="p-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Your Feedback</label>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Write your feedback, comments, and suggestions for improvement..."
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
          />
          
          {submission.feedback && submission.status === 'reviewed' && (
            <p className="text-xs text-amber-600 mt-2 font-medium">
              ⚠️ You already provided feedback. Submitting again will update it.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !feedback.trim()}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Send size={18} />
                Submit Feedback
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
