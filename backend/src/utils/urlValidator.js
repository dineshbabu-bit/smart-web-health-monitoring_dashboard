import dns from 'dns/promises';
import net from 'net';
import { config } from '../config/index.js';
import { ValidationError, DnsResolutionError } from './customErrors.js';

const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const DISALLOWED_SCHEMES = [
  'javascript:',
  'file:',
  'data:',
  'vbscript:',
  'ftp:',
  'ftps:',
  'ws:',
  'wss:',
  'mailto:',
  'tel:',
  'sms:',
  'blob:'
];

// Pre-compiled regex patterns to avoid repeated recompilation on every validation call
const QUOTE_STRIP_REGEX = /^['"`<([\]+|['"`>)\]]+$/g;
const SCHEME_WITH_SLASH_REGEX = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//i;
const SCHEME_MATCH_REGEX = /^([a-zA-Z][a-zA-Z0-9+.-]*):(.*)$/;
const PORT_REGEX = /^[0-9]+(\/.*)?$/;
const LOCAL_HOST_REGEX = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)(:\d+)?(\/.*)?$/i;

/**
 * Detects cloud instance metadata endpoints (AWS, GCP, Azure, etc.) to prevent SSRF attacks.
 * @param {string} hostname
 * @returns {boolean}
 */
export function isCloudMetadata(hostname) {
  const lower = (hostname || '').toLowerCase();
  return (
    lower === '169.254.169.254' ||
    lower === 'metadata.google.internal' ||
    lower === 'metadata' ||
    lower.endsWith('.internal') ||
    lower === 'fd00:ec2::254' ||
    lower === '[fd00:ec2::254]'
  );
}

/**
 * Checks whether a hostname or IP is on a private / local network.
 * @param {string} hostname
 * @returns {boolean}
 */
export function isPrivateIpOrHost(hostname) {
  const lower = (hostname || '').toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower === '[::1]'
  ) {
    return true;
  }
  if (isCloudMetadata(lower)) return true;

  if (net.isIPv4(lower)) {
    const parts = lower.split('.').map(Number);
    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 127.0.0.0/8
    if (parts[0] === 127) return true;
    // 169.254.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
  }

  if (net.isIPv6(lower)) {
    if (lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) {
      return true;
    }
  }

  return false;
}

/**
 * Validates and normalizes target URL for analysis.
 * Supports bare domains like "github.com", "www.github.com", and full URLs.
 * @param {string} rawUrl
 * @returns {string} Normalized URL string (e.g., "https://github.com/")
 * @throws {ValidationError}
 */
export function validateAndNormalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new ValidationError('URL parameter is required and must be a non-empty string.');
  }

  let trimmedUrl = rawUrl.trim().replace(QUOTE_STRIP_REGEX, '').trim();
  if (!trimmedUrl) {
    throw new ValidationError('URL parameter cannot be empty or blank.');
  }

  // Check for disallowed protocol schemes (e.g. javascript:, file:, data:, ftp:)
  const lowerUrl = trimmedUrl.toLowerCase();
  for (let i = 0; i < DISALLOWED_SCHEMES.length; i++) {
    if (lowerUrl.startsWith(DISALLOWED_SCHEMES[i])) {
      throw new ValidationError(`Unsupported protocol "${DISALLOWED_SCHEMES[i]}". Only HTTP and HTTPS are allowed.`);
    }
  }

  // Check if explicit scheme with '//' is present (e.g. http://, https://, ftp://)
  const schemeWithSlashMatch = trimmedUrl.match(SCHEME_WITH_SLASH_REGEX);
  if (schemeWithSlashMatch) {
    const protocol = schemeWithSlashMatch[1].toLowerCase();
    if (!['http', 'https'].includes(protocol)) {
      throw new ValidationError(`Unsupported protocol "${protocol}:". Only HTTP and HTTPS are allowed.`);
    }
  } else {
    // Check if it starts with an unsupported scheme without // (e.g. "javascript:alert(1)")
    const schemeMatch = trimmedUrl.match(SCHEME_MATCH_REGEX);
    if (schemeMatch) {
      const possibleScheme = schemeMatch[1].toLowerCase();
      const rest = schemeMatch[2];
      const isPort = PORT_REGEX.test(rest);
      if (!isPort) {
        if (!['http', 'https'].includes(possibleScheme)) {
          throw new ValidationError(`Unsupported protocol "${possibleScheme}:". Only HTTP and HTTPS are allowed.`);
        }
      }
    }
    // Default to http:// for local hosts/IPs, and https:// for public domains
    if (LOCAL_HOST_REGEX.test(trimmedUrl)) {
      trimmedUrl = `http://${trimmedUrl}`;
    } else {
      trimmedUrl = `https://${trimmedUrl}`;
    }
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    throw new ValidationError(`Invalid URL format: "${rawUrl}". Please provide a valid web address.`);
  }

  if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
    throw new ValidationError(`Unsupported protocol "${parsedUrl.protocol}". Only HTTP and HTTPS are allowed.`);
  }

  const hostname = parsedUrl.hostname;
  const isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]';

  const isIpAddress = net.isIP(hostname) > 0;

  const isValidDomain =
    hostname.length >= 3 &&
    hostname.includes('.') &&
    !hostname.startsWith('.') &&
    !hostname.endsWith('.');

  if (!hostname || (!isValidDomain && !isLocalHost && !isIpAddress)) {
    throw new ValidationError(`Invalid hostname "${hostname}". Must be a valid domain.`);
  }

  // 1. Strict SSRF Protection: Always block cloud instance metadata endpoints
  if (isCloudMetadata(hostname)) {
    throw new ValidationError(
      'Access to cloud instance metadata and internal infrastructure services is forbidden.',
      { hostname }
    );
  }

  // 2. Production SSRF Protection: In production, block private / local network audits unless explicitly allowed
  if (config.nodeEnv === 'production' && process.env.ALLOW_LOCAL_AUDITS !== 'true') {
    if (isPrivateIpOrHost(hostname)) {
      throw new ValidationError(
        'Auditing internal and local network addresses is restricted in production environments.',
        { hostname }
      );
    }
  }

  return parsedUrl.toString();
}

/**
 * Sleeps for the given milliseconds.
 * @param {number} ms
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Checks if a DNS error is transient/temporary.
 * @param {string} code
 * @returns {boolean}
 */
function isTransientDnsError(code) {
  const transientCodes = [
    'EAI_AGAIN',
    'SERVFAIL',
    'ETIMEOUT',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'EREFUSED',
    'EBUSY'
  ];
  return transientCodes.includes(code);
}

/**
 * Short-lived in-memory DNS cache to avoid redundant network lookups.
 * TTL: 5 minutes for valid domains.
 */
const dnsCache = new Map();
const DNS_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Performs DNS resolution with fallback methods (OS getaddrinfo + direct DNS queries)
 * and transient retry backoff.
 * @param {string} hostname
 * @param {number} [maxRetries=2]
 * @returns {Promise<boolean>}
 */
async function resolveHostnameWithFallback(hostname, maxRetries = 2, targetUrl = null) {
  const cached = dnsCache.get(hostname);
  if (cached && Date.now() - cached.timestamp < DNS_CACHE_TTL_MS) {
    return true;
  }

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 150ms, 300ms
      await sleep(attempt * 150);
    }

    // Method 1: Node.js dns.lookup with { all: true } (supports both IPv4 & IPv6 safely)
    try {
      const records = await dns.lookup(hostname, { all: true });
      if (Array.isArray(records) && records.length > 0) {
        dnsCache.set(hostname, { timestamp: Date.now() });
        return true;
      }
    } catch (err) {
      lastError = err;
    }

    // Method 2: Direct DNS resolver fallback (dns.resolve4 or dns.resolve6)
    try {
      const addresses = await Promise.any([
        dns.resolve4(hostname).then((ips) => (ips && ips.length > 0 ? ips : Promise.reject())),
        dns.resolve6(hostname).then((ips) => (ips && ips.length > 0 ? ips : Promise.reject())),
        dns.resolve(hostname).then((ips) => (ips && ips.length > 0 ? ips : Promise.reject()))
      ]);
      if (addresses && addresses.length > 0) {
        dnsCache.set(hostname, { timestamp: Date.now() });
        return true;
      }
    } catch (err) {
      // If AggregateError or resolution failure, save error
      if (!lastError) lastError = err;
    }

    // If the error is definitely non-existent domain, no need to retry repeatedly
    if (lastError && (lastError.code === 'ENOTFOUND' || lastError.code === 'NXDOMAIN' || lastError.code === 'EBADNAME')) {
      if (attempt >= 1) break;
    }
  }

  // Method 3: Direct connection probe fallback before throwing
  if (targetUrl) {
    try {
      const probeRes = await fetch(targetUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3500),
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' }
      });
      if (probeRes.status >= 100 && probeRes.status < 600) {
        dnsCache.set(hostname, { timestamp: Date.now() });
        return true;
      }
    } catch {
      try {
        const getProbe = await fetch(targetUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(3500),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            'Range': 'bytes=0-10'
          }
        });
        if (getProbe.status >= 100 && getProbe.status < 600) {
          dnsCache.set(hostname, { timestamp: Date.now() });
          return true;
        }
      } catch {
        // Continue to throw DnsResolutionError
      }
    }
  }

  // If all attempts failed, throw structured DnsResolutionError
  const errorCode = lastError?.code || 'DNS_LOOKUP_FAILED';
  const isTransient = isTransientDnsError(errorCode);

  if (isTransient) {
    throw new DnsResolutionError(
      `DNS resolution timed out or encountered a temporary network issue for "${hostname}". Please try again.`,
      true,
      { hostname, code: errorCode }
    );
  }

  throw new DnsResolutionError(
    `Domain "${hostname}" could not be resolved. Please verify the website address.`,
    false,
    { hostname, code: errorCode }
  );
}

/**
 * Robust DNS preflight lookup to catch non-existent domains early without rejecting valid sites.
 * @param {string} targetUrl
 * @returns {Promise<boolean>}
 * @throws {ValidationError|DnsResolutionError}
 */
export async function verifyDomainResolves(targetUrl) {
  let urlObj;
  try {
    urlObj = new URL(targetUrl);
  } catch {
    throw new ValidationError(`Invalid URL provided for DNS resolution: "${targetUrl}".`);
  }

  const hostname = urlObj.hostname;
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    net.isIP(hostname) > 0
  ) {
    return true;
  }

  return resolveHostnameWithFallback(hostname, 2, targetUrl);
}
