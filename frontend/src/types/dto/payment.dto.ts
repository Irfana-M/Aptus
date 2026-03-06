import type { AvailabilitySlot } from "../student.types";

export interface ConfirmPaymentDto {
    paymentIntentId: string;
    studentId: string;
    planType: string;
    subjectCount: number;
    availability?: AvailabilitySlot[];
    subjects?: string[];
}

export interface PaymentIntentResponse {
    success: boolean;
    clientSecret: string;
    paymentIntentId: string;
}
