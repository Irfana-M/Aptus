import { createSlice } from '@reduxjs/toolkit';
import { fetchStudentPaymentHistory } from './paymentThunk';

interface Payment {
    _id: string;
    studentId: string;
    courseId?: string; 
    amount: number;
    currency: string;
    paymentDate?: string;
    createdAt?: string;
    status: string;
    paymentIntentId?: string;
    transactionId?: string;
    invoiceId?: string;
    purpose?: string;
}

interface PaymentState {
    paymentHistory: Payment[];
    loading: boolean;
    error: string | null;
}

const initialState: PaymentState = {
    paymentHistory: [],
    loading: false,
    error: null,
};

const paymentSlice = createSlice({
    name: 'payment',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchStudentPaymentHistory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStudentPaymentHistory.fulfilled, (state, action) => {
                state.loading = false;
                state.paymentHistory = action.payload.data;
            })
            .addCase(fetchStudentPaymentHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default paymentSlice.reducer;
