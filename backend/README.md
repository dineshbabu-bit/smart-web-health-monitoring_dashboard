# Smart Web Application Health Monitoring Backend

A high-performance Node.js & Express backend for automated website performance, accessibility, SEO, and best-practices auditing using **Google Lighthouse** and **Chrome Launcher**.

---

## 🌟 Key Features

- **Automated Multi-Category Audits**: Runs Lighthouse audits across **Performance**, **Accessibility**, **Best Practices**, and **SEO**.
- **Core Web Vitals & Key Metric Extraction**:
  - **LCP** (Largest Contentful Paint)
  - **FCP** (First Contentful Paint)
  - **CLS** (Cumulative Layout Shift)
  - **INP** (Interaction to Next Paint)
  - **TBT** (Total Blocking Time)
  - **Speed Index** (SI)
- **Opportunities & Diagnostics**: Extracts actionable suggestions with estimated time/byte savings.
- **Fail-Safe Chrome Management**: Ensures Chrome browser instances are reliably terminated in `finally` blocks, preventing memory leaks and orphaned processes.
- **Robust Error Handling**: Distinct HTTP responses for invalid URLs, unreachable domains, DNS resolution failures, and Lighthouse timeouts.
- **Device Emulation**: Supports both `desktop` and `mobile` device profiles with appropriate viewport and network throttling.
- **Production Architecture**: Structured into Routes, Controllers, Services, Middleware, and Config.

---

## 🏗️ Project Architecture

```
s5 mini backend/
├── .env.example               # Environment variable templates
├── .gitignore
├── package.json
├── README.md
└── src/
    ├── app.js                 # Express app initialization, CORS, Helmet, routes
    ├── server.js              # Server entry point and graceful process teardown
    ├── config/
    │   ├── index.js           # App & environment configuration
    │   └── lighthouseConfig.js# Lighthouse audit settings & device presets
    ├── controllers/
    │   └── auditController.js # Handles requests and formats responses
    ├── middleware/
    │   ├── errorHandler.js    # Global error & 404 handler
    │   └── validateRequest.js # Request payload and URL validation
    ├── routes/
    │   ├── index.js           # Central API router
    │   └── auditRoutes.js     # Audit API routes
    ├── services/
    │   ├── lighthouseService.js# Chrome Launcher and Lighthouse runner
    │   └── reportParser.js    # Extracts scores, Core Web Vitals, opportunities
    └── utils/
        ├── customErrors.js    # Operational error classes (ValidationError, NetworkError, etc.)
        └── urlValidator.js    # URL validation & DNS pre-resolution
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Google Chrome** or Chromium installed on the host machine

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port for Express server |
| `NODE_ENV` | `development` | Environment (`development` / `production`) |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |
| `LIGHTHOUSE_TIMEOUT_MS` | `180000` | Max duration for audit |
| `CHROME_FLAGS` | `--no-sandbox,--disable-gpu,--headless=new` | Flags passed to headless Chrome |

### 4. Start Server
```bash
# Start in development mode (with hot reload)
npm run dev

# Start in production mode
npm start
```

---

## 📡 API Reference

### 1. Health Check
`GET /api/health`

**Response:**
```json
{
  "status": "online",
  "service": "Smart Web Application Health Monitoring API",
  "version": "1.0.0",
  "timestamp": "2026-08-25T16:15:00.000Z"
}
```

---

### 2. Run Audit Analysis
`POST /api/audit/analyze`

**Request Body:**
```json
{
  "url": "https://example.com",
  "device": "desktop",
  "categories": ["performance", "accessibility", "best-practices", "seo"]
}
```

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `url` | String | **Yes** | - | Target URL (e.g. `https://example.com`) |
| `device` | String | No | `"desktop"` | `"desktop"` or `"mobile"` |
| `categories` | Array[String] | No | All 4 | Subset of categories to analyze |

**Sample Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/",
    "finalUrl": "https://example.com/",
    "fetchTime": "2026-08-25T16:12:00.000Z",
    "lighthouseVersion": "12.3.0",
    "device": "desktop",
    "scores": {
      "performance": 100,
      "accessibility": 95,
      "bestPractices": 100,
      "seo": 100
    },
    "metrics": {
      "firstContentfulPaint": {
        "title": "First Contentful Paint",
        "value": 450,
        "numericUnit": "ms",
        "displayValue": "0.5 s",
        "score": 100,
        "rating": "good"
      },
      "largestContentfulPaint": {
        "title": "Largest Contentful Paint",
        "value": 600,
        "numericUnit": "ms",
        "displayValue": "0.6 s",
        "score": 100,
        "rating": "good"
      },
      "totalBlockingTime": {
        "title": "Total Blocking Time",
        "value": 0,
        "numericUnit": "ms",
        "displayValue": "0 ms",
        "score": 100,
        "rating": "good"
      },
      "cumulativeLayoutShift": {
        "title": "Cumulative Layout Shift",
        "value": 0,
        "numericUnit": "unitless",
        "displayValue": "0",
        "score": 100,
        "rating": "good"
      },
      "speedIndex": {
        "title": "Speed Index",
        "value": 500,
        "numericUnit": "ms",
        "displayValue": "0.5 s",
        "score": 100,
        "rating": "good"
      },
      "interactionToNextPaint": {
        "title": "Interaction to Next Paint",
        "value": null,
        "numericUnit": "ms",
        "displayValue": "N/A",
        "score": null,
        "rating": "info"
      }
    },
    "opportunities": [
      {
        "id": "render-blocking-resources",
        "title": "Eliminate render-blocking resources",
        "score": 85,
        "savingsMs": 150
      }
    ],
    "diagnostics": [
      {
        "id": "dom-size",
        "title": "Avoid an excessive DOM size",
        "displayValue": "15 elements",
        "score": 100
      }
    ],
    "categoryDetails": {
      "performance": {
        "title": "Performance",
        "score": 100,
        "stats": { "total": 35, "passed": 34, "failed": 1, "informational": 0 },
        "criticalIssues": []
      }
    }
  },
  "meta": {
    "analysisDurationMs": 4250,
    "device": "desktop",
    "analyzedUrl": "https://example.com/"
  },
  "timestamp": "2026-08-25T16:12:05.000Z"
}
```

---

## 🛑 Error Responses

### Invalid URL (`400 Bad Request`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Domain \"thisdomainwillneverexist12345.com\" could not be resolved (DNS lookup failed).",
    "details": { "hostname": "thisdomainwillneverexist12345.com" }
  },
  "timestamp": "2026-08-25T16:12:00.000Z"
}
```

### Unreachable Site / Connection Refused (`502 Bad Gateway`)
```json
{
  "success": false,
  "error": {
    "code": "TARGET_NETWORK_ERROR",
    "message": "Connection to \"http://localhost:9999\" was refused. The server might be down.",
    "details": { "originalCode": "ERR_CONNECTION_REFUSED" }
  },
  "timestamp": "2026-08-25T16:12:00.000Z"
}
```
