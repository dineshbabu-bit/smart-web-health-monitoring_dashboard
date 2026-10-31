import { validateAndNormalizeUrl, verifyDomainResolves } from '../utils/urlValidator.js';
import { ValidationError } from '../utils/customErrors.js';
import { SUPPORTED_CATEGORIES } from '../config/lighthouseConfig.js';

/**
 * Middleware to validate audit request payload and perform DNS preflight.
 */
export async function validateAuditRequest(req, res, next) {
  try {
    if (!req.body || typeof req.body !== 'object') {
      throw new ValidationError('Request body must be a valid JSON object containing at least the "url" property.');
    }

    const { url, device, categories } = req.body;

    if (!url) {
      throw new ValidationError('Missing required field: "url" is required in request body.');
    }

    console.log(`[URL Validation] Validating URL: "${url}"`);
    // 1. Validate and normalize URL format
    const normalizedUrl = validateAndNormalizeUrl(url);

    // 2. Validate device if supplied
    if (device !== undefined && device !== null) {
      if (typeof device !== 'string' || !['desktop', 'mobile'].includes(device.toLowerCase())) {
        throw new ValidationError('Invalid "device" specified. Must be either "desktop" or "mobile".');
      }
    }

    // 3. Validate categories if supplied
    if (categories !== undefined && categories !== null) {
      if (!Array.isArray(categories)) {
        throw new ValidationError('"categories" must be an array of strings.');
      }
      if (categories.length === 0) {
        throw new ValidationError('"categories" array cannot be empty. Specify at least one category or omit the field.');
      }
      const invalidCats = categories.filter(
        (c) => typeof c !== 'string' || !SUPPORTED_CATEGORIES.includes(c.toLowerCase())
      );
      if (invalidCats.length > 0) {
        throw new ValidationError(
          `Invalid category: [${invalidCats.join(', ')}]. Allowed categories: [${SUPPORTED_CATEGORIES.join(', ')}].`
        );
      }
    }

    // 4. DNS preflight check (with fallback & transient retry)
    console.log(`[DNS Check] Resolving domain for "${normalizedUrl}"...`);
    await verifyDomainResolves(normalizedUrl);

    // 5. Attach validated values to request object
    req.validatedAuditOptions = {
      url: normalizedUrl,
      device: typeof device === 'string' ? device.toLowerCase() : 'desktop',
      categories: Array.isArray(categories) && categories.length > 0
        ? categories.map((c) => String(c).toLowerCase())
        : SUPPORTED_CATEGORIES
    };

    next();
  } catch (error) {
    next(error);
  }
}
