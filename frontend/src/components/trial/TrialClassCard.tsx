import React from 'react';
import type { TrialClassResponse } from '../../types/trialTypes';

interface TrialClassCardProps {
  trialClass: TrialClassResponse;
  onViewDetails?: (trialClass: TrialClassResponse) => void;
  onCancel?: (trialClass: TrialClassResponse) => void;
  onJoin?: (trialClass: TrialClassResponse) => void;
  onFeedback?: (trialClass: TrialClassResponse) => void;
}

import { isClassOverdue } from '../../utils/timeUtils';

export const TrialClassCard: React.FC<TrialClassCardProps> = ({
  trialClass,
  onViewDetails,
  onCancel,
  onJoin,
  onFeedback
}) => {
  const isOverdue = trialClass.status === 'assigned' && isClassOverdue(trialClass.preferredDate, trialClass.preferredTime);

  const getStatusColor = (status: string) => {
    if (isOverdue) return 'bg-orange-100 text-orange-800 animate-pulse';
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusText = isOverdue ? "Class Overdue / Joining Pending" : trialClass.status.charAt(0).toUpperCase() + trialClass.status.slice(1);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {trialClass.subject.subjectName}
          </h3>
          <p className="text-sm text-gray-600">
            Grade {trialClass.subject.gradeId} • {trialClass.subject.syllabus}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trialClass.status)}`}>
          {statusText}
        </span>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">Date:</span>
          <span>{formatDate(trialClass.preferredDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Time:</span>
          <span>{trialClass.preferredTime}</span>
        </div>
        {trialClass.mentor && (
          <div className="flex items-center gap-2">
            <span className="font-medium">Mentor:</span>
            <span className="text-blue-600">{trialClass.mentor.name}</span>
          </div>
        )}
        {trialClass.meetLink && (
          <div className="flex items-center gap-2">
            <span className="font-medium">Meeting:</span>
            <span className="text-green-600">Link Available</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(trialClass)}
            className="px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
          >
            View Details
          </button>
        )}
        
        {trialClass.status === 'assigned' && trialClass.meetLink && onJoin && (
          <button
            onClick={() => onJoin(trialClass)}
            className={`px-3 py-2 text-white rounded text-sm transition-colors ${isOverdue ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {isOverdue ? 'Overdue - Join' : 'Join Class'}
          </button>
        )}
        
        {trialClass.status === 'completed' && !trialClass.feedback && onFeedback && (
          <button
            onClick={() => onFeedback(trialClass)}
            className="px-3 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors"
          >
            Give Feedback
          </button>
        )}
        
        {(trialClass.status === 'requested' || trialClass.status === 'assigned') && onCancel && (
          <button
            onClick={() => onCancel(trialClass)}
            className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {trialClass.feedback && (
        <div className="mt-4 p-3 bg-gray-50 rounded border">
          <h4 className="font-medium text-sm mb-1">Your Feedback:</h4>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-500">{"★".repeat(trialClass.feedback.rating)}</span>
            <span className="text-gray-600 text-sm">{trialClass.feedback.rating}/5</span>
          </div>
          <p className="text-sm text-gray-700">{trialClass.feedback.comment}</p>
        </div>
      )}
    </div>
  );
};
