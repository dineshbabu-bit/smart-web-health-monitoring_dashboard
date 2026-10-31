import { Router } from 'express';
import auditRoutes from './auditRoutes.js';
import aiRoutes from './aiRoutes.js';
import { config } from '../config/index.js';
import { getEngineHealth } from '../services/lighthouseService.js';

const router = Router();

// Root API health / welcome check
router.get('/health', (req, res) => {
  const engineHealth = getEngineHealth();
  const isAiKeyConfigured = Boolean(
    config.geminiApiKey &&
    config.geminiApiKey.trim() !== '' &&
    config.geminiApiKey !== 'YOUR_GEMINI_API_KEY'
  );

  res.status(200).json({
    status: 'online',
    service: 'Smart Web Application Health Monitoring API',
    version: '1.0.0',
    backend: {
      status: 'online',
      uptimeSec: Math.round(process.uptime()),
      environment: config.nodeEnv
    },
    auditEngine: engineHealth,
    gemini: {
      status: 'online',
      provider: isAiKeyConfigured ? 'gemini' : 'rules-fallback',
      apiKeyConfigured: isAiKeyConfigured,
      model: isAiKeyConfigured ? config.geminiModel : 'deterministic-expert-engine'
    },
    timestamp: new Date().toISOString()
  });
});

// Audit endpoints
router.use('/audit', auditRoutes);

// AI Advisor & Competitor Gap Analysis endpoints
router.use('/ai', aiRoutes);

export default router;
