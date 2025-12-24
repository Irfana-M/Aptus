import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Check, TrendingDown } from 'lucide-react';

const SubscriptionPlans: React.FC = () => {
  const navigate = useNavigate();
  const [subjectCount, setSubjectCount] = useState<number>(1);

  const calculatePrice = (type: 'monthly' | 'yearly') => {
    if (type === 'monthly') return subjectCount * 500;
    // Yearly: 1:5k, 2:10k, 3:15k, 4+:20k
    if (subjectCount >= 4) return 20000;
    return subjectCount * 5000;
  };

  const handleSelectPlan = (type: 'monthly' | 'yearly') => {
    const price = calculatePrice(type);
    navigate('/student/payment', { 
        state: { 
            planType: type, 
            amount: price,
            subjectCount: subjectCount
        } 
    });
  };

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
                <option value={1}>1 Subject</option>
                <option value={2}>2 Subjects</option>
                <option value={3}>3 Subjects</option>
                <option value={4}>Unlimited (4+ Subjects)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Monthly Plan */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-transparent hover:border-indigo-100 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Monthly Access</h2>
                  <p className="text-gray-500 text-sm mt-1">Flexible pay-as-you-go</p>
                </div>
              </div>
              
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-extrabold text-gray-900">₹{calculatePrice('monthly')}</span>
                  <span className="text-xl text-gray-500 ml-2">/mo</span>
                </div>
                <p className="text-xs text-gray-400 mt-2 font-medium">₹500 per subject monthly</p>
              </div>

              <ul className="space-y-4 mb-10">
                {[
                  `${subjectCount} Selected Subject${subjectCount > 1 ? 's' : ''}`,
                  'Live Dedicated Mentor',
                  'Interactive Classes',
                  'Quick Doubt Support'
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-600">
                    <Check size={20} className="text-green-500 mr-3 shrink-0" />
                    <span className="font-medium text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('monthly')}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 group"
            >
              Get Started Monthly
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-indigo-600 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0">
              <div className="bg-indigo-600 text-white text-xs font-bold px-8 py-2 rotate-45 translate-x-[20px] translate-y-[10px] w-[140px] text-center shadow-lg uppercase tracking-widest">
                Best Value
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Yearly Pro</h2>
                  <p className="text-indigo-600 text-sm mt-1 font-bold">Most popular choice</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-extrabold text-gray-900">₹{calculatePrice('yearly')}</span>
                  <span className="text-xl text-gray-500 ml-2">/yr</span>
                </div>
                {(() => {
                  const monthlyCostYearly = subjectCount * 500 * 12;
                  const yearlyPrice = calculatePrice('yearly');
                  const savings = monthlyCostYearly - yearlyPrice;
                  return savings > 0 ? (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-indigo-600 font-bold text-sm bg-indigo-50 px-2 py-1 rounded-md flex items-center gap-1">
                        <TrendingDown size={14} />
                        Save ₹{savings} / year
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>

              <ul className="space-y-4 mb-10">
                {[
                  subjectCount === 1 ? '1 Selected Subject' : 'Unlimited Subjects (3+5 Model)',
                  'Up to 3 Fixed Weekly Slots',
                  '5 Total Live Sessions / Week',
                  'Priority Mentor Matching',
                  'Comprehensive Exam Series'
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-600 font-medium">
                    <Check size={20} className="text-indigo-600 mr-3 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('yearly')}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group"
            >
              Get Started Yearly
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
            <p className="text-gray-400 text-xs">
              * Unlimited Subjects plan (Tier 2) includes a fair usage policy of 5 live sessions per week and 3 fixed mentor slots.
            </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
