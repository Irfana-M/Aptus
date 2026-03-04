import api from '../../api/api'; 

interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

export const createPaymentIntent = async (planType: string, amount: number, subjectCount: number, studentId?: string) => {
  const { data } = await api.post('/payment/create-intent', { planType, amount, subjectCount, studentId });
  return data;
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



export const fetchStudentPaymentHistory = async (studentId: string) => {
    const response = await api.get(`/payment/student/${studentId}`);
    return response.data;
};
