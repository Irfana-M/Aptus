import api from '../../api/api'; 

import type { ConfirmPaymentDto } from "../../types/dto/payment.dto";

export const createPaymentIntent = async (planType: string, amount: number, subjectCount: number, studentId?: string) => {
  const { data } = await api.post('/payment/create-intent', { planType, amount, subjectCount, studentId });
  return data;
};

export const confirmPayment = async (data: ConfirmPaymentDto) => {
  const response = await api.post('/payment/confirm-payment', data);
  return response.data;
};



export const fetchStudentPaymentHistory = async (studentId: string) => {
    const response = await api.get(`/payment/student/${studentId}`);
    return response.data;
};
