import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { config } from '../config/index.js';
import { getLighthouseOptions } from '../config/lighthouseConfig.js';
import { parseLighthouseReport } from './reportParser.js';
import {
  ChromeLaunchError,
  DnsResolutionError,
  LighthouseExecutionError,
  LighthouseTimeoutError,
  TargetTimeoutError,
  TargetUnreachableError
} from '../utils/customErrors.js';

/**
 * Concurrency-limited audit execution pool.
 * Supports up to 2 simultaneous Chrome Lighthouse sessions to enable parallel
 * head-to-head website comparisons without CPU or port starvation.
 */
let activeAudits = 0;
const MAX_CONCURRENT_AUDITS = 1;
const waitingQueue = [];

function acquireAuditSlot() {
  if (activeAudits < MAX_CONCURRENT_AUDITS) {
    activeAudits++;
    return Promise.resolve();
  }
  return new Promise((resolve) => waitingQueue.push(resolve));
}

function releaseAuditSlot() {
  activeAudits = Math.max(0, activeAudits - 1);
  if (waitingQueue.length > 0) {
    activeAudits++;
    const nextInQueue = waitingQueue.shift();
    if (typeof nextInQueue === 'function') {
      nextInQueue();
    }
  }
}

/**
 * Returns diagnostic health metrics for the Lighthouse & Chrome engine.
 */
export function getEngineHealth() {
  let chromeInstallations = [];
  try {
    chromeInstallations = chromeLauncher.Launcher.getInstallations();
  } catch (err) {
    console.warn('[Engine Health] Could not query Chrome installations:', err.message);
  }

  const isChromeInstalled = chromeInstallations.length > 0;
  return {
    status: isChromeInstalled ? (activeAudits > 0 ? 'busy' : 'ready') : 'missing_chrome',
    chromeInstalled: isChromeInstalled,
    chromePath: chromeInstallations[0] || process.env.CHROME_PATH || null,
    activeAudits,
    queueLength: waitingQueue.length,
    maxConcurrent: MAX_CONCURRENT_AUDITS
  };
}

/**
 * Maps known Lighthouse and Chrome error codes to user-friendly messages and custom errors.
 * @param {Error} error
 * @param {string} targetUrl
 * @returns {Error}
 */
function handleLighthouseError(error, targetUrl) {
  const message = error?.message || '';
  const friendlyMsg = error?.friendlyMessage || '';
  const code = error?.code || '';

  // 1. DNS Resolution failure during navigation
  if (
    code === 'ERR_NAME_NOT_RESOLVED' ||
    code === 'DNS_FAILURE' ||
    message.includes('DNS_FAILURE') ||
    message.includes('ERR_NAME_NOT_RESOLVED')
  ) {
    return new DnsResolutionError(
      `Unable to resolve domain for "${targetUrl}". The website domain does not exist or DNS lookup failed.`,
      false,
      { originalCode: code, rawMessage: message }
    );
  }

  // 2. Connection refused / host unreachable
  if (
    code === 'ERR_CONNECTION_REFUSED' ||
    code === 'CONNECTION_REFUSED' ||
    code === 'ERR_CONNECTION_RESET' ||
    code === 'ERR_ADDRESS_UNREACHABLE' ||
    code === 'ERR_CONNECTION_FAILED' ||
    code === 'ERR_NETWORK_CHANGED' ||
    message.includes('ERR_CONNECTION_REFUSED') ||
    message.includes('ERR_CONNECTION_RESET') ||
    message.includes('ERR_ADDRESS_UNREACHABLE')
  ) {
    return new TargetUnreachableError(
      `Connection to "${targetUrl}" failed or was refused. The server might be down or not accepting connections.`,
      { originalCode: code, rawMessage: message }
    );
  }

  // 3. Target page timeout
  if (
    code === 'ERR_TIMED_OUT' ||
    code === 'PAGE_HUNG' ||
    message.includes('ERR_TIMED_OUT') ||
    message.includes('PAGE_HUNG') ||
    message.includes('Timed out waiting for')
  ) {
    return new TargetTimeoutError(
      `The website at "${targetUrl}" took too long to respond during the audit.`,
      { originalCode: code, rawMessage: message }
    );
  }

  // 4. Lighthouse timeout watchdog
  if (message.includes('Analysis timed out after') || message.includes('Lighthouse audit timed out')) {
    return new LighthouseTimeoutError(
      `The Lighthouse audit timed out for "${targetUrl}". The target website was too slow to complete analysis.`,
      { originalCode: code, rawMessage: message }
    );
  }

  // 5. Chrome launch failure
  if (
    message.includes('Chrome failed to start') ||
    message.includes('No Chrome installations found') ||
    code === 'CHROME_LAUNCH_ERROR'
  ) {
    return new ChromeLaunchError(
      'The browser engine could not start the audit. Ensure Google Chrome is installed on the host machine.',
      { originalCode: code, rawMessage: message }
    );
  }

  // 6. Navigation / render / FCP failures
  if (code === 'NO_FCP' || message.includes('NO_FCP')) {
    return new LighthouseExecutionError(
      `The page at "${targetUrl}" loaded, but did not render any first contentful paint (FCP). The site may have crashed or blocked automated browsers.`,
      { originalCode: code, rawMessage: message },
      422
    );
  }

  if (code === 'INSECURE_DOCUMENT_REQUEST' || message.includes('CERT_AUTHORITY_INVALID')) {
    return new LighthouseExecutionError(
      `SSL/TLS certificate error encountered while connecting to "${targetUrl}".`,
      { originalCode: code, rawMessage: message },
      422
    );
  }

  if (
    message.includes('lndriver.navigate') ||
    message.includes('lh:runner:gather') ||
    message.includes('performance mark has not been set')
  ) {
    return new LighthouseExecutionError(
      `Navigation audit failed for "${targetUrl}". The page failed to complete navigation or closed the connection unexpectedly.`,
      { originalCode: code, rawMessage: message },
      422
    );
  }

  return new LighthouseExecutionError(
    friendlyMsg || message || 'The audit could not be completed for this page.',
    { originalCode: code, rawMessage: message },
    422
  );
}

/**
 * Performs a single isolated Lighthouse audit against Chrome.
 * Guarantees Chrome cleanup in all exit paths.
 * @param {string} targetUrl
 * @param {Object} options
 * @returns {Promise<Object>}
 */
async function executeSingleLighthouseAudit(targetUrl, { device = 'desktop', categories } = {}) {
  let chrome = null;
  const { flags, chromeFlags } = getLighthouseOptions({ device, categories });

  const tStart = performance.now();
  console.log(`[Chrome Launch] Launching headless Chrome for ${targetUrl} (${device})...`);

  try {
    // 1. Launch isolated headless Chrome instance
    const tChromeStart = performance.now();
    try {
      const launchOptions = {
        chromeFlags,
        logLevel: 'error'
      };
      if (process.env.CHROME_PATH) {
        launchOptions.chromePath = process.env.CHROME_PATH;
      }
      chrome = await chromeLauncher.launch(launchOptions);
      if (chrome?.process) {
        chrome.process.on('error', (procErr) => {
          console.warn('[Chrome Process Event]:', procErr.message);
        });
      }
    } catch (launchErr) {
      console.error(`[Chrome Error] Failed to launch Chrome:`, launchErr.message);
      throw new ChromeLaunchError(
        `Unable to initialize Chrome instance: ${launchErr.message}`,
        { error: launchErr.message }
      );
    }
    const chromeLaunchMs = (performance.now() - tChromeStart).toFixed(2);
    console.log(`[Timing] Chrome launch   : ${chromeLaunchMs} ms`);
    console.log(`[Chrome Ready] Chrome running on debugging port ${chrome.port} (PID: ${chrome.pid})`);

    // 2. Attach port to Lighthouse flags
    const runnerFlags = {
      ...flags,
      port: chrome.port
    };

    console.log(`[Lighthouse Start] Running audit on ${targetUrl} [${device}]...`);

    // 3. Execute Lighthouse navigation audit with timeout watchdog
    let timerId;
    let timedOut = false;
    const timeoutPromise = new Promise((_, reject) => {
      timerId = setTimeout(() => {
        timedOut = true;
        reject(
          new LighthouseTimeoutError(
            `Analysis timed out after ${Math.round(config.lighthouseTimeoutMs / 1000)}s for "${targetUrl}". The target website was too slow to respond.`
          )
        );
      }, config.lighthouseTimeoutMs);
      if (timerId.unref) timerId.unref();
    });

    let runnerResult;
    const tLhStart = performance.now();
    try {
      const lhPromise = lighthouse(targetUrl, runnerFlags);
      // Catch post-timeout errors so unhandledRejection is not triggered if timeout wins the race
      lhPromise.catch((e) => {
        if (timedOut) {
          console.warn(`[Lighthouse Abort] Post-timeout notification for ${targetUrl}: ${e?.message}`);
        }
      });

      runnerResult = await Promise.race([
        lhPromise,
        timeoutPromise
      ]);
    } finally {
      clearTimeout(timerId);
    }
    const lhExecutionMs = (performance.now() - tLhStart).toFixed(2);
    console.log(`[Timing] Lighthouse exec : ${lhExecutionMs} ms (${(lhExecutionMs / 1000).toFixed(2)}s)`);

    if (!runnerResult || !runnerResult.lhr) {
      throw new LighthouseExecutionError('Lighthouse did not return a valid audit report.');
    }

    console.log(`[Lighthouse Completed] Audit completed successfully for ${targetUrl}`);

    // 4. Parse raw LHR into structured response
    const tParseStart = performance.now();
    const structuredReport = parseLighthouseReport(runnerResult.lhr, device);
    const parseMs = (performance.now() - tParseStart).toFixed(2);
    console.log(`[Timing] Report parsing  : ${parseMs} ms`);

    return structuredReport;
  } catch (error) {
    console.error(`[Lighthouse Failure] Audit failed for ${targetUrl}:`, error.message);
    if (error.isOperational) {
      throw error;
    }
    throw handleLighthouseError(error, targetUrl);
  } finally {
    // 5. Always guarantee Chrome instance is cleanly terminated
    if (chrome) {
      const tCleanupStart = performance.now();
      console.log(`[Chrome Cleanup] Closing Chrome instance on port ${chrome.port} (PID: ${chrome.pid})...`);
      try {
        await chrome.kill();
        const cleanupMs = (performance.now() - tCleanupStart).toFixed(2);
        console.log(`[Timing] Chrome cleanup  : ${cleanupMs} ms`);
        console.log(`[Chrome Cleanup] Chrome instance closed successfully.`);
      } catch (killErr) {
        const errMsg = String(killErr?.message || killErr || '');
        if (!errMsg.includes('EPERM') && !errMsg.includes('EBUSY') && !errMsg.includes('ESRCH')) {
          console.warn(`[Chrome Cleanup Note]:`, errMsg);
        }
      } finally {
        chrome = null;
      }
    }
    const totalAuditMs = (performance.now() - tStart).toFixed(2);
    console.log(`[Timing] Audit total     : ${totalAuditMs} ms (${(totalAuditMs / 1000).toFixed(2)}s)`);
  }
}

/**
 * Runs a Google Lighthouse audit on the specified URL with concurrency-controlled pooling.
 * @param {string} targetUrl - Validated target URL
 * @param {Object} options - Analysis options
 * @param {'desktop'|'mobile'} [options.device='desktop']
 * @param {string[]} [options.categories]
 * @returns {Promise<Object>} Structured audit results
 */
export async function runLighthouseAudit(targetUrl, options = {}) {
  await acquireAuditSlot();
  try {
    return await executeSingleLighthouseAudit(targetUrl, options);
  } finally {
    releaseAuditSlot();
  }
}
