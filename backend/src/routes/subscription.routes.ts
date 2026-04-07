import { Router } from 'express';
import { container } from '../inversify.config';
import { TYPES } from '../types';
import { SubscriptionController } from '../controllers/subscription.controller';

const router = Router();
const subscriptionController = container.get<SubscriptionController>(TYPES.SubscriptionController);

/**
 * @route GET /api/subscription/plans
 * @desc Get all active subscription plans
 * @access Public
 */
router.get('/plans', (req, res) => subscriptionController.getActivePlans(req, res));

/**
 * @route POST /api/subscription/calculate-cost
 * @desc Calculate monthly subscription cost based on plan and subjects
 * @access Public
 * @body { planCode: string, numberOfSubjects: number }
 */
router.post('/calculate-cost', (req, res) => subscriptionController.calculateCost(req, res));


export default router;
