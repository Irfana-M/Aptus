import { Router } from 'express';
import { container } from '../inversify.config.js';
import { TYPES } from '../types.js';
import { PaymentController } from '../controllers/payment.controller.js';

const router = Router();
const paymentController = container.get<PaymentController>(TYPES.PaymentController);

// Binding contexts to ensure 'this' refers to the class instance
router.post('/create-intent', paymentController.createIntent.bind(paymentController));
router.post('/confirm-payment', paymentController.confirmPayment.bind(paymentController));
router.get('/student/:studentId', paymentController.getStudentPayments.bind(paymentController));

export default router;
