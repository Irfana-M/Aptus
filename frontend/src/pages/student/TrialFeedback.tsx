import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { studentTrialApi } from '../../features/trial/student/studentTrialApi';
import { fetchStudentProfile } from '../../features/student/studentThunk';
import StudentLayout from '../../components/students/StudentLayout';
import { X } from 'lucide-react';
import { ROUTES } from '../../constants/routes.constants';

const TrialClassFeedback: React.FC = () => {
  const { trialClassId } = useParams<{ trialClassId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [rating, setRating] = useState<number>(0);
  const [satisfaction, setSatisfaction] = useState<'satisfied' | 'unsatisfied' | ''>('');
  const [feedback, setFeedback] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [showUnsatisfiedPopup, setShowUnsatisfiedPopup] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!trialClassId) return;
    
    setLoading(true);
    try {
      await studentTrialApi.submitFeedback(trialClassId, {
        rating,
        comment: feedback
      });
      
      dispatch(fetchStudentProfile());
      
      setSubmitted(true);
      
      if (rating >= 4 || satisfaction === 'satisfied') {
        setTimeout(() => {
          navigate(ROUTES.STUDENT.SUBSCRIPTION_PLANS);
        }, 1500);
      } else {
        setTimeout(() => {
          setShowUnsatisfiedPopup(true);
        }, 1000);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithApp = () => {
    navigate(ROUTES.STUDENT.DASHBOARD);
  };

  const handleGoToHomepage = () => {
    navigate(ROUTES.HOME);
  };

  return (
    <StudentLayout title="Trial Class Feedback">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Trial Class Feedback</h1>
            <p className="text-gray-600 mt-2">We'd love to hear about your experience</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
          <h2 className="text-xl md:text-2xl font-semibold text-center mb-8 text-gray-800">
            How was the meeting?
          </h2>

          <div>
            {/* Question 1: Rating */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Rate your experience
              </label>
              <div className="flex justify-center space-x-3 md:space-x-6 mb-6">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setRating(num)}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center font-semibold transition-all ${
                      rating === num
                        ? 'bg-teal-600 text-white border-teal-600 scale-110'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Satisfaction Toggle */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setSatisfaction('satisfied')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    satisfaction === 'satisfied'
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Satisfied
                </button>
                <button
                  onClick={() => setSatisfaction('unsatisfied')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    satisfaction === 'unsatisfied'
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Unsatisfied
                </button>
              </div>
            </div>

            {/* Question 2: Feedback */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Your feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                placeholder="Please share your thoughts..."
              />
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                onClick={handleSubmit}
                disabled={loading || rating === 0}
                className={`px-8 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-md hover:shadow-lg ${
                  (loading || rating === 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          {submitted && !showUnsatisfiedPopup && (
            <div className="mt-6 text-center text-gray-600 text-sm animate-fade-in">
              Thank you for your feedback! Redirecting...
            </div>
          )}
        </div>
      </div>

      {/* Unsatisfied Popup Modal */}
      {showUnsatisfiedPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-fade-in">
            <button
              onClick={() => setShowUnsatisfiedPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={24} />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">😔</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                We're Sorry!
              </h3>
              <p className="text-gray-600 mb-6">
                We appreciate your feedback and will work to improve. What would you like to do next?
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleContinueWithApp}
                  className="w-full bg-teal-600 text-white py-3 px-6 rounded-xl hover:bg-teal-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                >
                  Continue with App
                </button>
                <button
                  onClick={handleGoToHomepage}
                  className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold"
                >
                  Go to Homepage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default TrialClassFeedback;
