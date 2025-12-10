import React from 'react';
import Header from '../../components/layout/Header';
import { CheckCircle } from 'lucide-react';

const SubscriptionPlans: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Subscription Plan</h1>
          <p className="text-lg text-gray-600">
            Select a plan that works best for you and start your learning journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Basic Plan */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200 hover:border-teal-500 transition">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Basic</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">$29</span>
              <span className="text-gray-600">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-teal-600 mr-2 mt-0.5" />
                <span className="text-gray-700">4 sessions per month</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-teal-600 mr-2 mt-0.5" />
                <span className="text-gray-700">One-on-one mentoring</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-teal-600 mr-2 mt-0.5" />
                <span className="text-gray-700">Email support</span>
              </li>
            </ul>
            <button className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition">
              Select Plan
            </button>
          </div>

          {/* Standard Plan - Featured */}
          <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-teal-600 relative transform scale-105">
            <div className="absolute top-0 right-0 bg-teal-600 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-semibold">
              Popular
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Standard</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">$49</span>
              <span className="text-gray-600">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-teal-600 mr-2 mt-0.5" />
                <span className="text-gray-700">8 sessions per month</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-teal-600 mr-2 mt-0.5" />
                <span className="text-gray-700">One-on-one mentoring</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-teal-600 mr-2 mt-0.5" />
                <span className="text-gray-700">Priority email support</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-teal-600 mr-2 mt-0.5" />
                <span className="text-gray-700">Study materials included</span>
              </li>
            </ul>
            <button className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition">
              Select Plan
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200 hover:border-teal-500 transition">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Premium</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">$79</span>
              <span className="text-gray-600">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-teal-600 mr-2 mt-0.5" />
                <span className="text-gray-700">12 sessions per month</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-teal-600 mr-2 mt-0.5" />
                <span className="text-gray-700">One-on-one mentoring</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-teal-600 mr-2 mt-0.5" />
                <span className="text-gray-700">24/7 chat support</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-teal-600 mr-2 mt-0.5" />
                <span className="text-gray-700">Study materials + practice tests</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-teal-600 mr-2 mt-0.5" />
                <span className="text-gray-700">Progress tracking dashboard</span>
              </li>
            </ul>
            <button className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition">
              Select Plan
            </button>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p>All plans include access to recorded sessions and learning resources</p>
          <p className="mt-2">Cancel anytime. No hidden fees.</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
