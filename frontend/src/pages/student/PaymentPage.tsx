import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeSubscriptionForm from '../../features/payment/StripeSubscriptionForm';
import { createPaymentIntent } from '../../features/payment/paymentApi';

// Replace with your Publishable Key or environment variable
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { planType, amount, subjectCount = 1 } = location.state || {}; // { planType: 'monthly', amount: 500, subjectCount: 1 }

  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    if (!planType) {
      navigate('/student/subscription-plans'); // Redirect if no plan selected
      return;
    }

    const initPayment = async () => {
      try {
        const data = await createPaymentIntent(planType, subjectCount);
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Failed to init payment', error);
      }
    };

    initPayment();
  }, [planType, navigate, subjectCount]);

  if (!planType || !clientSecret) return <div className="p-8 text-center">{!planType ? 'No plan selected.' : 'Loading Payment...'}</div>;

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center">Complete your Subscription</h1>
      <p className="text-center mb-6 text-gray-600">You are subscribing to the {planType} plan for ₹{amount} ({subjectCount} subject{subjectCount > 1 ? 's' : ''})</p>
      
      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripeSubscriptionForm 
            planType={planType} 
            amount={amount || 0} 
            subjectCount={subjectCount} 
            availability={location.state?.availability}
            subjects={location.state?.subjects}
          />
        </Elements>
      )}
    </div>
  );
};

export default PaymentPage;
