import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchStudentPaymentHistory as fetchStudentPaymentHistoryApi } from './paymentApi';
import type { Payment } from './types';

export const fetchStudentPaymentHistory = createAsyncThunk<
    Payment[], 
    string,
    { rejectValue: string }
>(
    'payment/fetchHistory',
    async (studentId: string, { rejectWithValue }) => {
        try {
            const response = await fetchStudentPaymentHistoryApi(studentId);
            return response as Payment[];
        } catch (error: unknown) {
             const message = error instanceof Error ? error.message : 'Failed to fetch payment history';
             return rejectWithValue(message);
        }
    }
);
