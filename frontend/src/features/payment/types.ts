export interface Payment {
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
    paymentMethod?: string;
    description?: string;
}

export interface PaymentState {
    paymentHistory: Payment[];
    loading: boolean;
    error: string | null;
}
