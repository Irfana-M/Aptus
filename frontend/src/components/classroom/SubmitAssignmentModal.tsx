import React, { useState } from 'react';
import { X, Upload, FileText, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { submitAssignment, type StudyMaterial } from '../../api/classroomApi';
import { toast } from 'react-hot-toast';

interface SubmitAssignmentModalProps {
  assignment: StudyMaterial;
  onClose: () => void;
  onSuccess: () => void;
}

const SubmitAssignmentModal: React.FC<SubmitAssignmentModalProps> = ({ assignment, onClose, onSuccess }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles].slice(0, 5)); // Max 5 files
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      
      await submitAssignment(assignment._id, formData);
      toast.success('Assignment submitted successfully!');
      onSuccess();
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error 
        ? ((error as { response: { data: { message: string } } }).response?.data?.message || 'Failed to submit assignment')
        : (error instanceof Error ? error.message : 'Failed to submit assignment');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
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

  const dueDate = assignment.assignmentDetails?.dueDate || (assignment as any).dueDate;

  const isOverdue = dueDate 
    ? new Date() > new Date(dueDate)
    : false;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Submit Assignment</h2>
            <p className="text-sm text-slate-500 mt-1">{assignment.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Assignment Info */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">
              Due: <span className="font-bold">{dueDate ? formatDate(dueDate) : 'N/A'}</span>
            </span>
            {isOverdue && (
              <span className="px-2 py-1 bg-rose-100 text-rose-600 rounded-full text-xs font-bold">
                LATE SUBMISSION
              </span>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <div className="p-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              dragOver 
                ? 'border-indigo-400 bg-indigo-50' 
                : 'border-slate-200 hover:border-indigo-300'
            }`}
          >
            <input
              type="file"
              onChange={handleFileSelect}
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
              className="hidden"
              id="submission-files"
            />
            <label htmlFor="submission-files" className="cursor-pointer">
              <Upload size={40} className="mx-auto text-slate-400 mb-3" />
              <p className="font-bold text-slate-700">Drop files here or click to upload</p>
              <p className="text-xs text-slate-400 mt-2">PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, ZIP (max 5 files)</p>
            </label>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-indigo-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{file.name}</p>
                      <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
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
            disabled={loading || files.length === 0}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Submit Assignment
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubmitAssignmentModal;
