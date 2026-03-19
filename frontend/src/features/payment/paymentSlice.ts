import { createSlice } from '@reduxjs/toolkit';
import { fetchStudentPaymentHistory } from './paymentThunk';

import type { PaymentState } from './types';

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
                state.paymentHistory = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchStudentPaymentHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default paymentSlice.reducer;
