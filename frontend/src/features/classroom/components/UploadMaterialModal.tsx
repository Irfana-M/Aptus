import React, { useState } from 'react';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { uploadStudyMaterial } from '../../../api/classroomApi';
import { toast } from 'react-hot-toast';

interface UploadMaterialModalProps {
  sessionId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadMaterialModal: React.FC<UploadMaterialModalProps> = ({ sessionId, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !file) {
      toast.error('Please provide a title and select a file');
      return;
    }

    if (!sessionId) {
      toast.error('Session ID is required for upload');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('file', file);

      await uploadStudyMaterial(sessionId, formData);
      toast.success('Study material uploaded successfully!');
      onSuccess();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Failed to upload material';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900">Upload Study Material</h2>
            <p className="text-sm text-slate-500 font-medium">Add resources for your students</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Material Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Session Notes - Week 1"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Briefly describe what this material contains..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none font-medium"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Select File</label>
            <div 
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                file ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <input
                type="file"
                onChange={e => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png,.zip"
                className="hidden"
                id="study-material-file"
              />
              <label htmlFor="study-material-file" className="cursor-pointer block">
                {file ? (
                  <div className="flex items-center justify-center gap-3 text-indigo-600 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FileText size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm truncate max-w-[200px]">{file.name}</p>
                      <p className="text-xs text-indigo-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400">
                    <Upload size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-sm">Click to upload or drag & drop</p>
                    <p className="text-xs mt-1 font-medium">PDF, DOCX, PPTX, JPG, PNG or ZIP</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A1A80] hover:bg-[#2A2A90] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Material'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadMaterialModal;
