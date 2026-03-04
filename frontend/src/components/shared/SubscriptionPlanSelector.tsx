import React, { useState, useEffect } from 'react';
import { getActivePlans } from '../../api/subscriptionApi';
import {
  calculateMonthlyCost,
  validateSubjectCount,
  type SubscriptionPlan
} from '../../utils/subscriptionCalculator';

/**
 * Example React component showing usage
 */
export const SubscriptionPlanSelector: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [numberOfSubjects, setNumberOfSubjects] = useState<number>(1);
  const [cost, setCost] = useState<number>(0);
  const [error, setError] = useState<string>('');

  // Fetch plans on mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await getActivePlans();
        setPlans(res.data || []);
      } catch (err) {
        console.error('Failed to fetch plans:', err);
      }
    };
    fetchPlans();
  }, []);

  // Recalculate when plan or subjects change
  useEffect(() => {
    if (!selectedPlan) return;

    try {
      // Validate
      const validation = validateSubjectCount(selectedPlan, numberOfSubjects);
      if (!validation.valid) {
        setError(validation.error || '');
        setCost(0);
        return;
      }

      // Calculate (Frontend Preview)
      const result = calculateMonthlyCost(selectedPlan, numberOfSubjects);
      setCost(result.monthlyCost);
      setError('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setCost(0);
    }
  }, [selectedPlan, numberOfSubjects]);

  return (
    <div className="subscription-selector">
      <h2>Select Your Subscription Plan</h2>

      {/* Plan Selection */}
      <div className="plans">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className={`plan-card ${selectedPlan?._id === plan._id ? 'selected' : ''}`}
            onClick={() => setSelectedPlan(plan)}
          >
            <h3>{plan.name}</h3>
            <p>Type: {plan.sessionType}</p>
            <p>Max Subjects: {plan.maxSubjects}</p>
            <p>Sessions per week per subject: {plan.sessionsPerSubjectPerWeek}</p>
            <p>Price per session: {plan.currency} {plan.pricePerSession}</p>
          </div>
        ))}
      </div>

      {/* Subject Count Selector */}
      {selectedPlan && (
        <div className="subject-selector">
          <label>Number of Subjects:</label>
          <input
            type="number"
            min={1}
            max={selectedPlan.maxSubjects}
            value={numberOfSubjects}
            onChange={(e) => setNumberOfSubjects(parseInt(e.target.value) || 1)}
          />
          <span className="max-hint">
            (Max: {selectedPlan.maxSubjects})
          </span>
        </div>
      )}

      {/* Cost Display */}
      {selectedPlan && (
        <div className="cost-preview">
          {error ? (
            <p className="error">{error}</p>
          ) : (
            <div>
              <h3>Monthly Cost Breakdown:</h3>
              <p>
                {numberOfSubjects} subject{numberOfSubjects > 1 ? 's' : ''} ×{' '}
                {selectedPlan.sessionsPerSubjectPerWeek} session{selectedPlan.sessionsPerSubjectPerWeek > 1 ? 's' : ''}/week ×{' '}
                {selectedPlan.pricePerSession} {selectedPlan.currency} × 4 weeks
              </p>
              <h2 className="total-cost">
                Total: {selectedPlan.currency} {cost.toFixed(2)}/month
              </h2>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
