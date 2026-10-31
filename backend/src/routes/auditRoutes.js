import { Router } from 'express';
import { analyzeWebsite, getAuditHealth } from '../controllers/auditController.js';
import { validateAuditRequest } from '../middleware/validateRequest.js';

const router = Router();

/**
 * @route   GET /api/audit/health
 * @desc    Check health status of audit module
 * @access  Public
 */
router.get('/health', getAuditHealth);

/**
 * @route   POST /api/audit/analyze
 * @desc    Perform Lighthouse audit on requested URL
 * @access  Public
 */
router.post('/analyze', validateAuditRequest, analyzeWebsite);

export default router;
