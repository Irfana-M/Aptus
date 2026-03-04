import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeSubscriptionForm from '../../features/payment/StripeSubscriptionForm';
import { createPaymentIntent } from '../../features/payment/paymentApi';
import { useAppSelector } from '../../app/hooks';
import { toast } from 'react-hot-toast';
import { ROUTES } from '../../constants/routes.constants';


const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  
  const { 
    planCode, 
    planType: legacyPlanType, 
    amount, 
    subjectCount = 1,
    planLabel 
  } = location.state || {};

  
  const activePlanCode = planCode || legacyPlanType;

  const [clientSecret, setClientSecret] = useState('');

  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!activePlanCode || !amount) {
      navigate(ROUTES.STUDENT.SUBSCRIPTION_PLANS); 
      return;
    }

    const initPayment = async () => {
      try {
        const studentId = user?._id;
        const data = await createPaymentIntent(activePlanCode, amount, subjectCount, studentId);
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        console.error('Failed to init payment', error);
        const message = error.response?.data?.message || 'Failed to initialize payment';
        toast.error(message);
        if (error.response?.data?.code === 'ALREADY_SUBSCRIBED' || error.response?.data?.code === 'MONTHLY_PAYMENT_LIMIT') {
          navigate(ROUTES.STUDENT.SUBSCRIPTION_PLANS);
        }
      }
    };

    initPayment();
  }, [activePlanCode, amount, subjectCount, navigate, user?._id]);

  if (!activePlanCode || !clientSecret) {
    return (
      <div className="p-8 text-center">
        {!activePlanCode ? 'No plan selected.' : 'Loading Payment...'}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center">Complete your Subscription</h1>
      <p className="text-center mb-6 text-gray-600">
        You are subscribing to the <strong>{planLabel || activePlanCode}</strong> plan for ₹{amount} 
        ({subjectCount} subject{subjectCount > 1 ? 's' : ''})
      </p>
      
      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripeSubscriptionForm 
            planType={activePlanCode}
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
