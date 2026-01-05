import React, { useState, useEffect, useCallback } from 'react';
import { useStripe, useElements, PaymentElement, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import type { PaymentRequest, PaymentIntent } from '@stripe/stripe-js';
import { confirmPayment } from './paymentApi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { updatePaymentStatus } from '../auth/authSlice';
import { fetchStudentProfile } from '../student/studentThunk';



interface Props {
  planType: 'monthly' | 'yearly';
  amount: number;
  subjectCount: number;
}

const StripeSubscriptionForm: React.FC<Props> = ({ planType, amount, subjectCount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Use student profile if available, otherwise fallback to auth user (rehydrated on refresh)
  const { user: authUser } = useAppSelector((state) => state.auth);
  const studentProfile = useAppSelector((state) => state.student.profile);
  
  const user = studentProfile || authUser;

  const handleSuccess = useCallback(async (paymentIntent: PaymentIntent) => {
      try {
        // Handle case where user state might be wrapped or uses id instead of _id
        const studentId = user?._id || (user as { id?: string; data?: { _id?: string } })?.id || (user as { id?: string; data?: { _id?: string } })?.data?._id;
        
        if (!studentId) {
             console.error("Full User Object:", user);
             throw new Error("Student ID not found in state. Please refresh and try again.");
        }

        await confirmPayment({
          paymentIntentId: paymentIntent.id,
          studentId: studentId.toString(), 
          planType,
          subjectCount,
        });
        
        // Update Redux state immediately to unlock sidebar
        dispatch(updatePaymentStatus({ hasPaid: true }));
        dispatch(fetchStudentProfile());
        
        toast.success('Subscription activated!');
        navigate('/student/dashboard');
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : 'Payment verified but activation failed. Contact support.');
      }
  }, [user, planType, subjectCount, navigate, dispatch]);

  useEffect(() => {
    if (stripe) {
      const pr = stripe.paymentRequest({
        country: 'IN', // Replace with your country code
        currency: 'inr',
        total: {
          label: `${planType} Subscription`,
          amount: amount * 100, // Stripe expects amount in subunits (paise)
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      // Check the availability of the Payment Request API.
      pr.canMakePayment().then((result) => {
        if (result) {
          setPaymentRequest(pr);
        }
      });

      pr.on('paymentmethod', async (ev) => {
        if (!stripe || !elements) {
            ev.complete('fail');
            return;
        }

        // Confirm the PaymentIntent using the elements instance which handles the client secret internally
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.origin + '/student/payment-success',
          },
          redirect: 'if_required', 
        });

        if (error) {
          ev.complete('fail');
          toast.error(error.message || 'Payment failed');
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
           ev.complete('success');
           handleSuccess(paymentIntent);
        } else {
           ev.complete('fail');
        }
      });
    }
  }, [stripe, elements, amount, planType, handleSuccess]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    console.log('Form Submitted');
    console.log('Stripe:', !!stripe, 'Elements:', !!elements, 'User:', user);

    if (!stripe || !elements || !user) {
      console.error('Missing required objects for payment');
      return;
    }

    setLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/student/payment-success',
      },
      redirect: 'if_required', 
    });

    if (error) {
      toast.error(error.message || 'Payment failed');
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      await handleSuccess(paymentIntent);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white space-y-4">
      {/* Wallet Payment Option - Temporarily Disabled 
      {walletBalance >= amount && (
        <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
            <div className="flex justify-between items-center mb-2">
                <span className="text-teal-800 font-medium">Wallet Balance</span>
                <span className="text-teal-900 font-bold">₹{walletBalance.toFixed(2)}</span>
            </div>
            <button
                type="button"
                onClick={handleWalletPayment}
                disabled={loading}
                className="w-full bg-teal-600 text-white py-2 px-4 rounded hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
            >
               {loading ? 'Processing...' : `Pay ₹${amount} with Wallet`}
            </button>
            <div className="relative mt-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-teal-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-teal-50 px-2 text-teal-600">Or pay with other methods</span>
                  </div>
            </div>
        </div>
      )}
      */}

      {paymentRequest && (
        <div className="mb-4">
           <PaymentRequestButtonElement options={{ paymentRequest }} />
           <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or pay with card</span>
              </div>
            </div>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <PaymentElement />
        <button 
          type="submit" 
          disabled={!stripe || loading}
          className="w-full mt-4 bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : `Pay & Subscribe (${planType})`}
        </button>
      </form>
    </div>
  );
};

export default StripeSubscriptionForm;
