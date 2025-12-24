import api from '../../api/api'; 

interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

export const createPaymentIntent = async (planType: 'monthly' | 'yearly', subjectCount: number = 1) => {
  const response = await api.post('/payment/create-intent', { planType, subjectCount });
  return response.data;
};

export const confirmPayment = async (data: { 
    paymentIntentId: string; 
    studentId: string; 
    planType: string;
    subjectCount: number;
    availability?: AvailabilitySlot[];
    subjects?: string[];
}) => {
  const response = await api.post('/payment/confirm-payment', data);
  return response.data;
};

export const payWithWallet = async (data: { 
    studentId: string; 
    planType: string;
    subjectCount: number;
    availability?: AvailabilitySlot[];
    subjects?: string[];
}) => {
  const response = await api.post('/payment/pay-with-wallet', data);
  return response.data;
};

export const fetchStudentPaymentHistory = async (studentId: string) => {
    const response = await api.get(`/payment/student/${studentId}`);
    return response.data;
};
