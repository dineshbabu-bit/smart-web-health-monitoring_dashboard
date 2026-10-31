# Smart Web Application Health Monitoring Dashboard

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Lighthouse](https://img.shields.io/badge/Google%20Lighthouse-12.3.0-orange.svg)](https://developers.google.com/web/tools/lighthouse)
[![Vite](https://img.shields.io/badge/Vite-8.2-purple.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

A production-ready full-stack web application health monitoring dashboard that analyses website performance, accessibility, best practices, and SEO using **Google Lighthouse** and **Headless Chrome Launcher**, presenting interactive analytics, comparisons, and exportable PDF audit reports.

---

## 📌 Problem Statement

Engineering teams and QA professionals often struggle to audit website health and Core Web Vitals objectively under real network and rendering conditions without artificial mocks or restrictive domain allowlists. Furthermore, target site failures (such as bot blocks, connection resets, or slow pages) are frequently misreported as backend outages. This dashboard addresses these challenges with real Chrome-driven audits, robust error classification, sequential comparison benchmarking, and clean PDF report exports.

---

## 🎯 Aim & Objectives

- **Unrestricted Public Audits**: Inspect any valid HTTP/HTTPS web application across Desktop ($1350\times940$) and Mobile ($412\times823$) form factors.
- **Official Google Core Web Vitals**: Measure LCP (Largest Contentful Paint), INP (Interaction to Next Paint), and CLS (Cumulative Layout Shift) alongside FCP, TBT, and Speed Index.
- **Custom Project Health Score**: Compute a weighted composite score ($0–100$) balancing Performance ($35\%$), Accessibility ($25\%$), Best Practices ($20\%$), and SEO ($20\%$).
- **Head-to-Head Comparison Studio**: Benchmark two websites sequentially to eliminate resource contention and declare an advantage winner.
- **AI Competitor Gap Analyzer & Improvement Advisor**: Automated AI-powered competitor analysis identifying weaker websites, gap differentials, and weakest performance categories.
- **Competitor Learning Insights**: "What can we learn from the better website?" synthesizing real Core Web Vitals advantages.
- **Smart Fix Priority Matrix**: Triage matrix ranking issues by priority, difficulty, and expected UX benefit with expandable instructions.
- **Adaptive 7-Day Roadmap**: Day-by-day remediation sprint with interactive checkboxes persisted in browser `localStorage`.
- **Before-and-After Tracker**: Live re-audit execution of the weaker site using real Lighthouse runs to measure verified score gains and metric deltas.
- **Grounded AI Engineering Chat**: Interactive Q&A strictly grounded in comparison audit metrics with instant question suggestions.
- **Historical Trend Tracking**: Persist scan history in browser `localStorage` with delta calculations against previous audits.
- **Exportable PDF Reports**: Download styled PDF audit reports for single sites, comparisons, and AI competitor gap plans using `jsPDF` and `jspdf-autotable`.
- **Accurate Error Hierarchy**: Distinguish target-specific failures from server outages, ensuring the backend health indicator accurately reflects `/api/health`.

---

## 💻 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, jsPDF, jsPDF-AutoTable |
| **Backend** | Node.js (ES Modules), Express.js, Google Lighthouse 12.3, Chrome Launcher 1.1, Helmet, CORS, Morgan |
| **Container & Cloud** | Docker, Chromium on Debian Bookworm, Render Blueprint (`render.yaml`), Vercel (`vercel.json`) |
| **Testing** | Node.js Test Runner (`node:test`, `node:assert/strict`), Integration Suite, Full System Verification |

---

## 🏗️ Architecture & Request Workflow

```
[ Frontend: React 19 + Vite (Port 5173) ]
                 │
                 ▼  POST /api/audit/analyze (Vite Proxy or Direct API)
[ Backend: Express.js (Port 5000 / $PORT) ]
                 │
                 ├─► 1. URL Normalization & Protocol Validation (http/https only)
                 ├─► 2. SSRF Protection (Blocks 169.254.169.254 & metadata endpoints)
                 ├─► 3. DNS Preflight Resolution (Node.js dns.lookup + resolve fallback)
                 ├─► 4. Mutex Queue (Enforces single sequential Chrome process)
                 │
                 ▼
[ Chrome Launcher 1.1 ] ──► Spawns Isolated Headless Chrome Instance (dynamic port)
                 │
                 ▼
[ Google Lighthouse 12.3 ] ──► Executes Performance, A11y, Best Practices, SEO Audits
                 │
                 ▼
[ Report Parser ] ──► Extracts Core Web Vitals, Opportunities, Diagnostics, Category Audits
                 │
                 ▼
[ Health Calculator ] ──► Generates Composite Health Score (0-100) & Tier
                 │
                 ▼
[ Chrome Cleanup ] ──► Guarantees chrome.kill() in finally block (zero orphaned processes)
                 │
                 ▼
[ Response JSON ] ──► Returns structured payload to Frontend (200 OK)
```

---

## ⚙️ Configuration & Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port for Express server (overridden by `$PORT` on hosting platforms) |
| `NODE_ENV` | `development` | Environment mode (`development`, `production`, `test`) |
| `CORS_ORIGIN` | `*` | Allowed CORS origins (set to frontend domain in production) |
| `GEMINI_API_KEY` | _(empty)_ | Google Gemini API key. When omitted, system defaults smoothly to deterministic expert engine |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model identifier used for competitor gap analysis |
| `LIGHTHOUSE_TIMEOUT_MS` | `180000` | Maximum execution watchdog timeout for Lighthouse audits |
| `CHROME_PATH` | _(auto)_ | Path to Chromium executable (`/usr/bin/chromium` in Docker) |
| `CHROME_FLAGS` | _(optimized)_ | Headless browser flags passed to Chrome Launcher |
| `ALLOW_LOCAL_AUDITS` | `false` | Set `true` to allow auditing localhost/private IPs in production |

### Frontend Configuration (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Base URL for API requests (`/api` in dev with Vite proxy, or full backend URL in production) |

---

## 🚀 Installation & Local Startup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v24.x tested and supported)
- **Google Chrome**: Installed on host machine (or Chromium)

### 1. Install Dependencies
```powershell
# From project root
npm install
npm run install:all
```

### 2. Start Both Frontend and Backend Concurrently
```powershell
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 3. Individual Startup Commands
```powershell
# Start only backend (use this only when the backend is not already running)
npm run backend

# Start only frontend (use this when the backend is running in another terminal)
npm run frontend

# Inspect whether the development ports are occupied; this command never kills processes
npm run check:ports
```

**Run exactly one backend instance.** The root `npm run dev` command starts the frontend and backend together. Do not also run `npm run backend` in a second terminal while `npm run dev` is active. If port `5000` or `5173` is occupied, inspect its PID before stopping it. The application no longer terminates existing processes automatically.

---

## 🧪 Testing Suite

Run the full battery of tests directly from the root workspace:

```powershell
# 1. Run unit test suite (URL validator, DNS, custom errors, report parser, SSRF protection)
npm test

# 2. Run real Lighthouse integration test with headless Chrome
npm run test:integration

# 3. Run complete 16-point system verification test
npm run test:verification

# 4. Run frontend TypeScript check and production build
npm run build

# 5. Run frontend linter (oxlint)
npm run frontend -- lint
```

---

## 🛡️ 8-Tier Error Classification

The dashboard distinguishes between target-specific anomalies and server availability:

1. **Invalid URL (`INVALID_URL`)**: Rejects empty strings, non-HTTP protocols, and malformed characters.
2. **DNS Resolution Failure (`DNS_ERROR`)**: Domain does not exist on public DNS servers.
3. **Website Navigation Failure (`LIGHTHOUSE_ERROR` / `TARGET_UNREACHABLE`)**: Target server timed out, closed connection, or blocked automated headless browsers. Backend explicitly reports that the **audit engine is online**.
4. **Chrome Engine Failure (`CHROME_ERROR`)**: Browser executable could not be spawned on host machine.
5. **Lighthouse Audit Timeout (`LIGHTHOUSE_TIMEOUT`)**: Target page took longer than watchdog threshold (180s).
6. **Backend Unavailable (`BACKEND_ERROR`)**: Network failure between frontend and backend service.
7. **Incomplete Audit Data (`INVALID_RESPONSE`)**: Response payload lacked required score categories.
8. **PDF Generation Failure (`PDF_ERROR`)**: Browser prevented download or table rendering failed.

---

## ⚖️ Composite Health Score Formula

$$\text{Health Score} = (\text{Performance} \times 0.35) + (\text{Accessibility} \times 0.25) + (\text{Best Practices} \times 0.20) + (\text{SEO} \times 0.20)$$

| Score Range | Tier | Color | Evaluation |
|---|---|---|---|
| **90 – 100** | **Excellent** | Emerald (`#10b981`) | Exceptional speed, accessibility compliance, and search readiness. |
| **75 – 89** | **Good** | Blue (`#3b82f6`) | Solid overall foundations with minor optimization opportunities. |
| **50 – 74** | **Needs Improvement** | Amber (`#f59e0b`) | Noticeable latency or accessibility bottlenecks impacting user experience. |
| **0 – 49** | **Poor** | Rose (`#ef4444`) | Severe performance degradation or failing standard guidelines. |

---

## 🌐 Production Deployment Guide

### A. Deploy Backend to Render (Recommended)

The backend runs Google Lighthouse using headless Chrome, which requires Chromium and font dependencies. The included `backend/Dockerfile` and `render.yaml` configure this automatically.

1. Push your repository to **GitHub**.
2. Log into [Render](https://render.com/) and click **New +** → **Blueprint**.
3. Select your GitHub repository. Render reads `render.yaml` and sets up the Docker web service.
4. Set Environment Variables on Render:
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: `https://your-frontend-domain.vercel.app` (or `*`)
   - `CHROME_PATH`: `/usr/bin/chromium`
5. Click **Apply**. Once deployed, your backend URL will be:
   `https://<your-service-name>.onrender.com`
6. Verify the deployed health endpoint:
   ```bash
   curl -I https://<your-service-name>.onrender.com/api/health
   # Expected: HTTP/2 200 OK
   ```

### B. Deploy Frontend to Vercel

1. Log into [Vercel](https://vercel.com/) and click **Add New** → **Project**.
2. Select your repository and set the **Root Directory** to `frontend`.
3. Set Environment Variable:
   - `VITE_API_BASE_URL`: `https://<your-backend-service>.onrender.com/api`
4. Click **Deploy**.
5. Vercel uses `frontend/vercel.json` to handle client-side routing rewrites for `/history` and `/compare`.

---

## 📜 License

This project is licensed under the MIT License.
