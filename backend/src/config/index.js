import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  lighthouseTimeoutMs: parseInt(process.env.LIGHTHOUSE_TIMEOUT_MS, 10) || 180000,
  chromeFlags: process.env.CHROME_FLAGS
    ? process.env.CHROME_FLAGS.split(',').map((f) => f.trim()).filter(Boolean)
    : [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--ignore-certificate-errors',
        '--disable-extensions',
        '--disable-software-rasterizer',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--metrics-recording-only',
        '--no-first-run',
        '--mute-audio',
        '--no-default-browser-check'
      ]
};
