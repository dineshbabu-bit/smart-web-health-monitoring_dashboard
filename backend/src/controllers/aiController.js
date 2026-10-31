import { analyzeCompetitorGap, answerComparisonChat } from '../services/geminiService.js';
import { ValidationError } from '../utils/customErrors.js';
import { config } from '../config/index.js';

/**
 * Controller to handle AI Competitor Gap Analysis generation.
 * Endpoint: POST /api/ai/compare-insights
 */
export async function generateComparisonInsights(req, res, next) {
  try {
    const { siteA, siteB, comparison } = req.body || {};

    if (!siteA || typeof siteA !== 'object') {
      throw new ValidationError('Missing required field: "siteA" object with url and healthScore is required.');
    }

    if (!siteB || typeof siteB !== 'object') {
      throw new ValidationError('Missing required field: "siteB" object with url and healthScore is required.');
    }

    if (!siteA.url || typeof siteA.url !== 'string') {
      throw new ValidationError('"siteA.url" must be a valid string URL.');
    }

    if (!siteB.url || typeof siteB.url !== 'string') {
      throw new ValidationError('"siteB.url" must be a valid string URL.');
    }

    console.log(`[AI Gap Analysis] Request received for: ${siteA.url} vs ${siteB.url}`);
    const startTime = Date.now();

    const insights = await analyzeCompetitorGap({ siteA, siteB, comparison });
    const durationMs = Date.now() - startTime;

    console.log(`[AI Gap Analysis] Completed in ${durationMs}ms (Provider: ${insights.meta?.provider || 'unknown'})`);

    return res.status(200).json({
      success: true,
      data: insights,
      meta: {
        analysisDurationMs: durationMs,
        provider: insights.meta?.provider || 'rules-engine',
        isFallback: Boolean(insights.meta?.isFallback)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to handle conversational AI questions grounded in audit comparison data.
 * Endpoint: POST /api/ai/chat
 */
export async function askComparisonChat(req, res, next) {
  try {
    const { question, comparisonData } = req.body || {};

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      throw new ValidationError('Missing or empty required field: "question" string is required.');
    }

    console.log(`[AI Chat] Received question: "${question.substring(0, 60)}..."`);
    const startTime = Date.now();

    const result = await answerComparisonChat({
      question: question.trim(),
      comparisonData: comparisonData || {}
    });

    const durationMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      data: result,
      meta: {
        durationMs,
        provider: result.provider || 'rules-engine',
        isFallback: Boolean(result.isFallback)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to check status of AI service.
 * Endpoint: GET /api/ai/status
 */
export function getAiStatus(req, res) {
  const isKeyConfigured = Boolean(
    config.geminiApiKey &&
    config.geminiApiKey.trim() !== '' &&
    config.geminiApiKey !== 'YOUR_GEMINI_API_KEY'
  );

  return res.status(200).json({
    success: true,
    data: {
      status: 'online',
      provider: isKeyConfigured ? 'gemini' : 'rules-fallback',
      model: isKeyConfigured ? (config.geminiModel || 'gemini-2.5-flash') : 'deterministic-expert-engine',
      apiKeyConfigured: isKeyConfigured,
      capabilities: [
        'competitor-gap-analysis',
        'learning-insights',
        'priority-matrix',
        'adaptive-roadmap',
        'grounded-qa'
      ]
    },
    timestamp: new Date().toISOString()
  });
}

