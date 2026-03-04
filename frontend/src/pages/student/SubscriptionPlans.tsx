import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Check } from 'lucide-react';
import { Loader } from '../../components/ui/Loader';
import { useAppSelector } from '../../app/hooks';
import { getActivePlans } from '../../api/subscriptionApi';
import { calculateMonthlyCost, validateSubjectCount, type SubscriptionPlan } from '../../utils/subscriptionCalculator';
import { ROUTES } from '../../constants/routes.constants';

const SubscriptionPlans: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { profile } = useAppSelector((state) => state.student);
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectCount, setSubjectCount] = useState<number>(1);
  const [error, setError] = useState<string>('');

  const status = profile?.onboardingStatus || user?.onboardingStatus;

  // Fetch plans from database
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await getActivePlans();
        setPlans(res.data || []);
        setLoading(false);
      } catch {
        console.error('Failed to fetch plans');
        setError('Failed to load subscription plans');
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  // Check onboarding status
  useEffect(() => {
    if (status === 'subscribed') {
      navigate(ROUTES.STUDENT.PREFERENCES.SUBJECTS);
    } else if (status === 'preferences_completed') {
      navigate(ROUTES.STUDENT.DASHBOARD);
    }
  }, [status, navigate]);

  // Find plans by code
  const basicPlan = plans.find(p => p.planCode === 'BASIC');
  const premiumPlan = plans.find(p => p.planCode === 'PREMIUM');

  // Calculate costs dynamically
  const getCalculation = (plan: SubscriptionPlan | undefined) => {
    if (!plan) return null;
    try {
      return calculateMonthlyCost(plan, subjectCount);
    } catch {
      return null;
    }
  };

  const basicCalc = getCalculation(basicPlan);
  const premiumCalc = getCalculation(premiumPlan);

  // Validate subject count
  const basicValidation = basicPlan ? validateSubjectCount(basicPlan, subjectCount) : { valid: false };
  const premiumValidation = premiumPlan ? validateSubjectCount(premiumPlan, subjectCount) : { valid: false };

  const handleSelectPlan = (planCode: string, monthlyCost: number) => {
    const selectedPlan = plans.find(p => p.planCode === planCode);
    if (!selectedPlan) return;

    navigate(ROUTES.STUDENT.PAYMENT, { 
      state: { 
        planCode: selectedPlan.planCode,
        planType: planCode.toLowerCase(), // For backward compatibility
        amount: monthlyCost,
        subjectCount: subjectCount,
        planLabel: selectedPlan.name
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="lg" text="Loading subscription plans..." />
      </div>
    );
  }

  if (error || !basicPlan || !premiumPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'Plans not available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Choose Your Learning Path</h1>
          <p className="text-xl text-gray-600">Invest in your future with our flexible subscription plans.</p>
          
          <div className="mt-8 flex flex-col items-center">
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-600" />
              How many subjects will you learn?
            </label>
            <div className="relative inline-block w-64">
              <select
                value={subjectCount}
                onChange={(e) => setSubjectCount(Number(e.target.value))}
                className="block w-full px-4 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-xl shadow-sm bg-white cursor-pointer appearance-none border-2 transition-all hover:border-indigo-300"
              >
                {[...Array(Math.max(basicPlan.maxSubjects, premiumPlan.maxSubjects))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} Subject{i > 0 ? 's' : ''}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            {!basicValidation.valid && (
              <p className="text-red-500 text-sm mt-2">{basicValidation.error}</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* BASIC PLAN */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-transparent hover:border-indigo-100 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{basicPlan.name}</h2>
                  <p className="text-gray-500 text-sm mt-1">Flexible monthly learning</p>
                </div>
              </div>
              
              {basicCalc && (
                <div className="mb-8">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-extrabold text-gray-900">
                      ₹{basicCalc.monthlyCost}
                    </span>
                    <span className="text-xl text-gray-500 ml-2">/mo</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    {subjectCount} subject{subjectCount > 1 ? 's' : ''} × {basicPlan.sessionsPerSubjectPerWeek} session/week × ₹{basicPlan.pricePerSession} × 4 weeks
                  </p>
                </div>
              )}

              <ul className="space-y-4 mb-10">
                <li className="flex items-center text-gray-600">
                  <Check size={20} className="text-green-500 mr-3 shrink-0" />
                  <span className="font-medium text-sm">{subjectCount} Selected Subject{subjectCount > 1 ? 's' : ''}</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <Check size={20} className="text-green-500 mr-3 shrink-0" />
                  <span className="font-medium text-sm">{basicPlan.sessionType === 'GROUP' ? 'Group Classes' : '1-to-1 Sessions'}</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <Check size={20} className="text-green-500 mr-3 shrink-0" />
                  <span className="font-medium text-sm">
                    {basicCalc?.sessionsPerWeek} Sessions per Week
                  </span>
                </li>
                <li className="flex items-center text-gray-600">
                  <Check size={20} className="text-green-500 mr-3 shrink-0" />
                  <span className="font-medium text-sm">Live Dedicated Mentor</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <Check size={20} className="text-green-500 mr-3 shrink-0" />
                  <span className="font-medium text-sm">📚 Study Materials</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => basicCalc && handleSelectPlan('BASIC', basicCalc.monthlyCost)}
              disabled={!basicValidation.valid || !basicCalc}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Get Started – Basic
            </button>
          </div>

          {/* PREMIUM PLAN */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-indigo-600 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0">
              <div className="bg-indigo-600 text-white text-xs font-bold px-8 py-2 rotate-45 translate-x-[20px] translate-y-[10px] w-[140px] text-center shadow-lg uppercase tracking-widest">
                Best Value
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{premiumPlan.name}</h2>
                  <p className="text-indigo-600 text-sm mt-1 font-bold">Most popular choice</p>
                </div>
              </div>

              {premiumCalc && (
                <div className="mb-8">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-extrabold text-gray-900">
                      ₹{premiumCalc.monthlyCost}
                    </span>
                    <span className="text-xl text-gray-500 ml-2">/mo</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    {subjectCount} subject{subjectCount > 1 ? 's' : ''} × {premiumPlan.sessionsPerSubjectPerWeek} sessions/week × ₹{premiumPlan.pricePerSession} × 4 weeks
                  </p>
                </div>
              )}

              <ul className="space-y-4 mb-10">
                <li className="flex items-center text-gray-600 font-medium">
                  <Check size={20} className="text-indigo-600 mr-3 shrink-0" />
                  <span className="text-sm">{subjectCount} Selected Subject{subjectCount > 1 ? 's' : ''}</span>
                </li>
                <li className="flex items-center text-gray-600 font-medium">
                  <Check size={20} className="text-indigo-600 mr-3 shrink-0" />
                  <span className="text-sm">{premiumPlan.sessionType === 'ONE_TO_ONE' ? '1-to-1 Personalized' : 'Group Sessions'}</span>
                </li>
                <li className="flex items-center text-gray-600 font-medium">
                  <Check size={20} className="text-indigo-600 mr-3 shrink-0" />
                  <span className="text-sm">
                    {premiumCalc?.sessionsPerWeek} Live Sessions per Week
                  </span>
                </li>
                {premiumPlan.mentorChoice && (
                  <li className="flex items-center text-gray-600 font-medium">
                    <Check size={20} className="text-indigo-600 mr-3 shrink-0" />
                    <span className="text-sm">Choose Your Mentor</span>
                  </li>
                )}
                {premiumPlan.rescheduleAllowed && (
                  <li className="flex items-center text-gray-600 font-medium">
                    <Check size={20} className="text-indigo-600 mr-3 shrink-0" />
                    <span className="text-sm">Flexible Rescheduling</span>
                  </li>
                )}
                <li className="flex items-center text-gray-600 font-medium">
                  <Check size={20} className="text-indigo-600 mr-3 shrink-0" />
                  <span className="text-sm">📚 Study Materials</span>
                </li>
                <li className="flex items-center text-gray-600 font-medium">
                  <Check size={20} className="text-indigo-600 mr-3 shrink-0" />
                  <span className="text-sm">📝 Mock Exams & Tests</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => premiumCalc && handleSelectPlan('PREMIUM', premiumCalc.monthlyCost)}
              disabled={!premiumValidation.valid || !premiumCalc}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400 text-xs">
            * Prices calculated based on: subjects × sessions per week × price per session × 4 weeks
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
