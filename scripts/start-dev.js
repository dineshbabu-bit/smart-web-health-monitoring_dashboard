import { spawn } from 'node:child_process';
import net from 'node:net';
import { execSync } from 'node:child_process';

const BACKEND_PORT = 5000;
const FRONTEND_PORT = 5173;

/**
 * Checks if a port is responding via connection attempt.
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const s = net.createConnection({ port, host: '127.0.0.1' }, () => {
      s.destroy();
      resolve(true);
    });
    s.on('error', () => {
      const s6 = net.createConnection({ port, host: '::1' }, () => {
        s6.destroy();
        resolve(true);
      });
      s6.on('error', () => resolve(false));
      s6.setTimeout(500, () => { s6.destroy(); resolve(false); });
    });
    s.setTimeout(500, () => { s.destroy(); resolve(false); });
  });
}

/**
 * Checks if the existing process on port 5000 is our healthy backend.
 */
async function checkExistingBackendHealth() {
  try {
    const res = await fetch(`http://127.0.0.1:${BACKEND_PORT}/api/health`, {
      signal: AbortSignal.timeout(2000)
    });
    if (res.ok) {
      const json = await res.json();
      if (json && (json.status === 'online' || json.service?.includes('Smart Web'))) {
        return { isOurs: true, data: json };
      }
    }
  } catch {
    // Ignore error
  }
  return { isOurs: false };
}

/**
 * Get PID on Windows/Unix for an occupied port.
 */
function getPortOwner(port) {
  if (process.platform === 'win32') {
    try {
      const psScript = `
        $c = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($c -and $c.OwningProcess -gt 0) {
          $p = $c.OwningProcess
          $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
          $cmd = ""
          try {
            $wmi = Get-CimInstance Win32_Process -Filter "ProcessId = $p" -ErrorAction SilentlyContinue
            if ($wmi -and $wmi.CommandLine) { $cmd = $wmi.CommandLine }
          } catch {}
          [PSCustomObject]@{ PID = $p; Name = if ($proc) { $proc.ProcessName } else { "Unknown" }; CommandLine = $cmd } | ConvertTo-Json -Compress
        }
      `;
      const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
      const raw = execSync(`powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 4000
      }).trim();
      if (raw) return JSON.parse(raw);
    } catch {}
  } else {
    try {
      const raw = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -Fp`, { encoding: 'utf8' }).trim();
      const pids = raw.split('\n').filter((l) => l.startsWith('p')).map((l) => parseInt(l.slice(1), 10));
      if (pids.length > 0) {
        const pid = pids[0];
        let name = 'process';
        try { name = execSync(`ps -p ${pid} -o comm=`, { encoding: 'utf8' }).trim(); } catch {}
        return { PID: pid, Name: name, CommandLine: 'N/A' };
      }
    } catch {}
  }
  return null;
}

const spawnedProcesses = [];
let shuttingDown = false;

function cleanShutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\n[Shutdown] Stopping application services cleanly...');

  for (const proc of spawnedProcesses) {
    if (proc && !proc.killed) {
      try {
        if (process.platform === 'win32') {
          // On Windows, kill process tree cleanly
          try {
            execSync(`taskkill /T /F /PID ${proc.pid}`, { stdio: 'ignore' });
          } catch {
            proc.kill();
          }
        } else {
          proc.kill('SIGTERM');
        }
      } catch {}
    }
  }

  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

process.on('SIGINT', cleanShutdown);
process.on('SIGTERM', cleanShutdown);

console.log('====================================================');
console.log('🚀 Starting Smart Web Health Monitoring Dashboard');
console.log('   Canonical local dev startup coordinator');
console.log('====================================================\n');

// 1. Inspect Port 5000 (Backend)
let startBackend = true;
const backendInUse = await isPortInUse(BACKEND_PORT);

if (backendInUse) {
  const health = await checkExistingBackendHealth();
  if (health.isOurs) {
    console.log(`[BACKEND] ℹ️  Healthy backend instance is already running on port ${BACKEND_PORT}.`);
    console.log(`[BACKEND] Reusing existing backend (no duplicate instance started).`);
    startBackend = false;
  } else {
    const owner = getPortOwner(BACKEND_PORT);
    console.error(`\n❌ [PORT CONFLICT] Port ${BACKEND_PORT} is already occupied by another process.`);
    if (owner) {
      console.error(`   PID          : ${owner.PID}`);
      console.error(`   Process Name : ${owner.Name}`);
      console.error(`   Command Line : ${owner.CommandLine || 'N/A'}`);
      console.error('\n   To stop this process if it is an old instance:');
      if (process.platform === 'win32') {
        console.error(`     PowerShell : Stop-Process -Id ${owner.PID} -Force`);
      } else {
        console.error(`     Terminal   : kill -9 ${owner.PID}`);
      }
    } else {
      console.error(`   Inspect port usage with: npm run check:ports`);
    }
    console.error('   Backend will not be started until port 5000 is available.\n');
    startBackend = false;
  }
}

// 2. Inspect Port 5173 (Frontend)
let startFrontend = true;
const frontendInUse = await isPortInUse(FRONTEND_PORT);

if (frontendInUse) {
  const owner = getPortOwner(FRONTEND_PORT);
  console.log(`\n[FRONTEND] ⚠️  Port ${FRONTEND_PORT} is already occupied.`);
  if (owner) {
    console.log(`   PID          : ${owner.PID}`);
    console.log(`   Process Name : ${owner.Name}`);
    console.log(`   Command Line : ${owner.CommandLine || 'N/A'}`);
    console.log('\n   A frontend or Vite instance is already running or holding port 5173.');
    console.log('   The already running backend will NOT be terminated.');
    console.log('   To stop the existing frontend process if desired:');
    if (process.platform === 'win32') {
      console.log(`     PowerShell : Stop-Process -Id ${owner.PID} -Force`);
    } else {
      console.log(`     Terminal   : kill -9 ${owner.PID}`);
    }
  } else {
    console.log('   Inspect with: npm run check:ports');
  }
  startFrontend = false;
}

// 3. Start Backend if needed
if (startBackend) {
  console.log(`[BACKEND] Spawning backend server on port ${BACKEND_PORT}...`);
  const backendProc = spawn(process.execPath, ['src/server.js'], {
    cwd: './backend',
    env: { ...process.env, PORT: String(BACKEND_PORT) },
    stdio: ['inherit', 'pipe', 'pipe']
  });

  backendProc.stdout.on('data', (d) => process.stdout.write(`\x1b[36m[BACKEND]\x1b[0m ${d}`));
  backendProc.stderr.on('data', (d) => process.stderr.write(`\x1b[31m[BACKEND ERR]\x1b[0m ${d}`));

  backendProc.on('exit', (code) => {
    if (!shuttingDown) {
      console.error(`\x1b[31m[BACKEND EXIT]\x1b[0m Backend stopped unexpectedly with code ${code}.`);
    }
  });

  spawnedProcesses.push(backendProc);
}

// 4. Start Frontend if needed
if (startFrontend) {
  console.log(`[FRONTEND] Spawning Vite development server on port ${FRONTEND_PORT}...`);
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const frontendProc = spawn(npmCmd, ['run', 'dev', '--prefix', 'frontend'], {
    shell: process.platform === 'win32',
    env: { ...process.env },
    stdio: ['inherit', 'pipe', 'pipe']
  });

  frontendProc.stdout.on('data', (d) => process.stdout.write(`\x1b[35m[FRONTEND]\x1b[0m ${d}`));
  frontendProc.stderr.on('data', (d) => process.stderr.write(`\x1b[31m[FRONTEND ERR]\x1b[0m ${d}`));

  frontendProc.on('exit', (code) => {
    if (!shuttingDown) {
      console.warn(`\x1b[33m[FRONTEND EXIT]\x1b[0m Frontend process exited (code ${code}). Backend remains active.`);
    }
  });

  spawnedProcesses.push(frontendProc);
}

// 5. Output Summary banner
setTimeout(() => {
  console.log('\n====================================================');
  console.log('✨ System Status Summary:');
  console.log(`🌐 Frontend  : http://localhost:${FRONTEND_PORT}`);
  console.log(`📊 Backend   : http://localhost:${BACKEND_PORT}`);
  console.log(`❤️  Health API: http://localhost:${BACKEND_PORT}/api/health`);
  console.log('⌨️  Press Ctrl+C to terminate services cleanly.');
  console.log('====================================================\n');
}, 3000);
