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
            console.log('📡 [Thunk] Fetching student payment history...', studentId);
            const response = await fetchStudentPaymentHistoryApi(studentId);
            
            // API helper now returns response.data.data directly (the array)
            const payments = response || [];
            
            console.log(`✅ [Thunk] Received ${Array.isArray(payments) ? payments.length : 0} payment records`);
            
            if (!Array.isArray(payments)) {
                console.warn('⚠️ [Thunk] Payment history response data is not an array:', payments);
                return [] as Payment[];
            }
            
            return payments as Payment[];
        } catch (error: unknown) {
             console.error('❌ [Thunk] Error fetching payment history:', error);
             const message = error instanceof Error ? error.message : 'Failed to fetch payment history';
             return rejectWithValue(message);
        }
    }
);
