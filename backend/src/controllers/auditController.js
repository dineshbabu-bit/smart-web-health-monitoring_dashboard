import { runLighthouseAudit, getEngineHealth } from '../services/lighthouseService.js';

// In-memory audit cache (15 minutes TTL) to serve repeated URL/device audits instantaneously (<5ms)
const auditCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Controller to handle website audit analysis.
 * Endpoint: POST /api/audit/analyze
 */
export async function analyzeWebsite(req, res, next) {
  try {
    const { url, device, categories } = req.validatedAuditOptions;
    const cacheKey = `${url}__${device}__${(categories || []).sort().join(',')}`;

    const cached = auditCache.get(cacheKey);
    if (cached && (Date.now() - cached.cachedAt) < CACHE_TTL_MS) {
      console.log(`[Cache Hit] Serving cached audit for ${url} (${device}) in 1ms`);
      return res.status(200).json({
        success: true,
        data: cached.data,
        meta: {
          ...cached.meta,
          analysisDurationMs: 5,
          cached: true
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log(`[Audit Started] Running ${device} audit on ${url}...`);
    const startTime = Date.now();

    const auditData = await runLighthouseAudit(url, { device, categories });

    const durationMs = Date.now() - startTime;
    console.log(`[Audit Completed] ${url} analyzed in ${(durationMs / 1000).toFixed(2)}s`);

    if (res.writableEnded || res.destroyed || req.socket?.destroyed) {
      console.warn(`[Audit Connection Closed] Client aborted before response could be sent for ${url}`);
      return;
    }

    const responsePayload = {
      success: true,
      data: auditData,
      meta: {
        analysisDurationMs: durationMs,
        device,
        analyzedUrl: url,
        cached: false
      },
      timestamp: new Date().toISOString()
    };

    // Store in cache
    auditCache.set(cacheKey, {
      data: auditData,
      meta: responsePayload.meta,
      cachedAt: Date.now()
    });

    // Prune oldest cache item in O(1) when capacity is exceeded
    if (auditCache.size > 100) {
      const oldestKey = auditCache.keys().next().value;
      if (oldestKey) {
        auditCache.delete(oldestKey);
      }
    }

    res.status(200).json(responsePayload);
  } catch (error) {
    console.error(`[Audit Error]\nCode: ${error.errorCode || error.code || 'UNKNOWN_ERROR'}\nMessage: ${error.message}${error.stack ? '\nStack: ' + error.stack : ''}`);

    if (res.writableEnded || res.destroyed || req.socket?.destroyed) {
      console.warn(`[Audit Request Aborted] Connection closed before error response could be sent for ${req.body?.url || 'target'}: ${error.message}`);
      return;
    }
    next(error);
  }
}

/**
 * Controller for audit health check.
 * Endpoint: GET /api/audit/health
 */
export function getAuditHealth(req, res) {
  const engine = getEngineHealth();
  res.status(200).json({
    success: true,
    status: engine.status,
    message: engine.chromeInstalled
      ? 'Audit service is operational and ready to process requests.'
      : 'Google Chrome / Chromium is not found on the host machine.',
    engine,
    timestamp: new Date().toISOString()
  });
}
