import { Router } from 'express';
import {
  generateComparisonInsights,
  askComparisonChat,
  getAiStatus
} from '../controllers/aiController.js';

const router = Router();

/**
 * @route   GET /api/ai/status
 * @desc    Check AI module status, active model, and fallback mode
 * @access  Public
 */
router.get('/status', getAiStatus);

/**
 * @route   POST /api/ai/compare-insights
 * @desc    Generate competitor gap analysis and improvement advisor report
 * @access  Public
 */
router.post('/compare-insights', generateComparisonInsights);

/**
 * @route   POST /api/ai/chat
 * @desc    Grounded conversational Q&A on comparison findings
 * @access  Public
 */
router.post('/chat', askComparisonChat);

export default router;

