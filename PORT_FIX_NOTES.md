# Port / Backend Stability Fix

## What changed

- Removed the automatic `predev` hook that killed processes on ports 5000 and 5173.
- Removed the backend startup routine that forcibly terminated any process already using port 5000.
- The backend now reports `EADDRINUSE` and exits without touching the existing process.
- The port-check script is non-destructive and only reports whether ports 5000 and 5173 are occupied.
- The root development command starts the frontend and backend together and stops the companion process if one fails.
- Increased the frontend API timeout to 240 seconds. The backend allows the configured Lighthouse timeout plus a 30-second response margin, and the Vite proxy remains at 300 seconds.
- Updated the dashboard's backend troubleshooting text and README instructions.

## Correct local startup

From the project root, run exactly once:

```powershell
npm run dev
```

This starts both frontend (`http://localhost:5173`) and backend (`http://localhost:5000`). Do not also run `npm run backend` in another terminal while this command is active.

To start services separately, use two terminals and run one command in each:

```powershell
npm run backend
```

```powershell
npm run frontend
```

To inspect ports without terminating anything:

```powershell
npm run check:ports
```

If a port is occupied on Windows, identify the process first:

```powershell
netstat -ano | findstr ":5000"
tasklist /FI "PID eq <PID>"
```

Only stop a PID after confirming it is an old instance of this project.

## Validation performed in the patch workspace

- `node --check` passed for all backend and script JavaScript files.
- Port-check script test passed with a temporary listener: it detected port 5000 as occupied and left the listener process running.
- Full backend tests and frontend production build could not be completed in this workspace because dependency installation could not retrieve packages from npm (DNS `EAI_AGAIN`); the partial install then lacked Express, dotenv, and Vite type definitions. Re-run `npm ci` in an environment with npm registry access, then run `npm test` and `npm run build`.
