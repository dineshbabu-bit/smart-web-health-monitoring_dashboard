import { config } from './index.js';

export const SUPPORTED_CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

export const DEVICE_PRESETS = {
  desktop: {
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    }
  },
  mobile: {
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 1.75,
      disabled: false
    },
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    }
  }
};

/**
 * Builds Lighthouse runner options based on device type and target categories.
 * @param {Object} options
 * @param {string} [options.device='desktop']
 * @param {string[]} [options.categories]
 * @returns {Object} Lighthouse options and config
 */
export function getLighthouseOptions({ device = 'desktop', categories = SUPPORTED_CATEGORIES } = {}) {
  const selectedCategories = Array.isArray(categories) && categories.length > 0
    ? categories.filter((cat) => SUPPORTED_CATEGORIES.includes(cat.toLowerCase()))
    : SUPPORTED_CATEGORIES;

  const validCategories = selectedCategories.length > 0 ? selectedCategories : SUPPORTED_CATEGORIES;
  const isMobile = device.toLowerCase() === 'mobile';
  const devicePreset = isMobile ? DEVICE_PRESETS.mobile : DEVICE_PRESETS.desktop;

  // Optimized Lighthouse execution flags
  // Uses Google standard 'simulate' throttlingMethod with stable quiet thresholds
  const flags = {
    logLevel: config.nodeEnv === 'development' ? 'error' : 'silent',
    output: 'json',
    onlyCategories: validCategories,
    throttlingMethod: 'simulate',
    maxWaitForFcp: 35000,
    maxWaitForLoad: 45000,
    pauseAfterFcpMs: 250,
    pauseAfterLoadMs: 500,
    networkQuietThresholdMs: 500,
    cpuQuietThresholdMs: 500,
    disableStorageReset: false,
    disableFullPageScreenshot: true,
    skipAudits: [
      'full-page-screenshot',
      'screenshot-thumbnails'
    ],
    ...devicePreset
  };

  return {
    flags,
    chromeFlags: config.chromeFlags,
    timeoutMs: config.lighthouseTimeoutMs
  };
}
