import net from 'node:net';
import { execSync } from 'node:child_process';

const PORTS = [5000, 5173];

/**
 * Checks if a port is in use by attempting connections on both IPv4 and IPv6 loopbacks,
 * and probing OS socket binding.
 * @param {number} port
 * @returns {Promise<boolean>}
 */
async function probePortConnection(port) {
  const connect4 = new Promise((resolve) => {
    const socket = net.createConnection({ port, host: '127.0.0.1' }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.setTimeout(800, () => {
      socket.destroy();
      resolve(false);
    });
  });

  const connect6 = new Promise((resolve) => {
    const socket = net.createConnection({ port, host: '::1' }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.setTimeout(800, () => {
      socket.destroy();
      resolve(false);
    });
  });

  const connectLocal = new Promise((resolve) => {
    const socket = net.createConnection({ port, host: 'localhost' }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.setTimeout(800, () => {
      socket.destroy();
      resolve(false);
    });
  });

  const [c4, c6, cl] = await Promise.all([connect4, connect6, connectLocal]);
  if (c4 || c6 || cl) return true;

  const bindProbe = await new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', (err) => {
      if (err.code === 'EADDRINUSE') resolve(true);
      else resolve(false);
    });
    probe.once('listening', () => {
      probe.close(() => resolve(false));
    });
    try {
      probe.listen(port);
    } catch {
      resolve(true);
    }
  });

  return bindProbe;
}

/**
 * Inspects a port on Windows using PowerShell to find PID, Process Name, and Command Line.
 * @param {number} port
 * @returns {Array<{ pid: number, name: string, commandLine: string }>}
 */
function getPortDetailsWindows(port) {
  try {
    const psScript = `
      $conns = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue
      if (-not $conns) { exit 0 }
      $results = @()
      $seen = @{}
      foreach ($c in $conns) {
        $p = $c.OwningProcess
        if ($p -gt 0 -and -not $seen[$p]) {
          $seen[$p] = $true
          $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
          $cmd = ""
          try {
            $wmi = Get-CimInstance Win32_Process -Filter "ProcessId = $p" -ErrorAction SilentlyContinue
            if ($wmi -and $wmi.CommandLine) { $cmd = $wmi.CommandLine }
          } catch {}
          $results += [PSCustomObject]@{
            PID = $p
            Name = if ($proc) { $proc.ProcessName } else { "Unknown" }
            CommandLine = if ($cmd) { $cmd } else { "N/A" }
          }
        }
      }
      $results | ConvertTo-Json -Compress
    `;

    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
    const raw = execSync(`powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 6000
    }).trim();

    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.map((item) => ({
      pid: item.PID,
      name: item.Name,
      commandLine: item.CommandLine || 'N/A'
    }));
  } catch {
    // Fallback using netstat
    try {
      const netstat = execSync(`netstat -ano | findstr ":${port}"`, { encoding: 'utf8' });
      const pids = new Set();
      const lines = netstat.split('\n');
      for (const line of lines) {
        if (line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[parts.length - 1], 10);
          if (pid && pid > 0) pids.add(pid);
        }
      }
      return Array.from(pids).map((pid) => ({ pid, name: 'node/process', commandLine: 'N/A' }));
    } catch {
      return [];
    }
  }
}

/**
 * Inspects a port on Unix/macOS using lsof and ps.
 * @param {number} port
 * @returns {Array<{ pid: number, name: string, commandLine: string }>}
 */
function getPortDetailsUnix(port) {
  try {
    const raw = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -Fp`, { encoding: 'utf8' }).trim();
    const pids = raw
      .split('\n')
      .filter((line) => line.startsWith('p'))
      .map((line) => parseInt(line.slice(1), 10))
      .filter((pid) => pid > 0);

    return pids.map((pid) => {
      let commandLine = 'N/A';
      let name = 'process';
      try {
        commandLine = execSync(`ps -p ${pid} -o args=`, { encoding: 'utf8' }).trim();
        name = execSync(`ps -p ${pid} -o comm=`, { encoding: 'utf8' }).trim();
      } catch {}
      return { pid, name, commandLine };
    });
  } catch {
    return [];
  }
}

console.log('========================================================');
console.log('🔍 Development Port Usage Inspector');
console.log('   (Safe mode: no processes are terminated automatically)');
console.log('========================================================\n');

let foundOccupied = false;

for (const port of PORTS) {
  const details = process.platform === 'win32'
    ? getPortDetailsWindows(port)
    : getPortDetailsUnix(port);

  const inUse = details.length > 0 || (await probePortConnection(port));

  if (!inUse) {
    console.log(`✅ Port ${port} is AVAILABLE.`);
    continue;
  }

  foundOccupied = true;
  console.log(`⚠️  Port ${port} is IN USE.`);

  if (details.length > 0) {
    console.log('   Active Process Details:');
    for (const proc of details) {
      console.log(`   • PID          : ${proc.pid}`);
      console.log(`     Process Name : ${proc.name}`);
      console.log(`     Command Line : ${proc.commandLine}`);
    }
    console.log('\n   If this is an old instance of this project you want to stop:');
    if (process.platform === 'win32') {
      console.log(`     PowerShell : Stop-Process -Id ${details.map((d) => d.pid).join(', ')} -Force`);
      console.log(`     Command    : taskkill /F /PID ${details.map((d) => d.pid).join(' /PID ')}`);
    } else {
      console.log(`     Terminal   : kill -9 ${details.map((d) => d.pid).join(' ')}`);
    }
  } else {
    console.log(`   A connection succeeded, but process metadata was unavailable.`);
    if (process.platform === 'win32') {
      console.log(`     Inspect with : netstat -ano | findstr ":${port}"`);
    } else {
      console.log(`     Inspect with : lsof -nP -iTCP:${port} -sTCP:LISTEN`);
    }
  }
  console.log('');
}

if (!foundOccupied) {
  console.log('🎉 All required ports (5000, 5173) are free and ready for startup.\n');
} else {
  console.log('ℹ️  Review the processes above. Never stop an unknown or system process.\n');
}
