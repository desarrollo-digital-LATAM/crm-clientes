const { execFile } = require('node:child_process');
const net = require('node:net');

const ports = [3000, 3001];
const timeoutMs = 5000;
const intervalMs = 100;

function run(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { windowsHide: true }, (error, stdout) => {
      if (error && error.code !== 1) return reject(error);
      resolve(stdout);
    });
  });
}

function portIsFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)));
  });
}

async function killPort(port) {
  if (process.platform === 'win32') {
    const output = await run('cmd.exe', ['/d', '/s', '/c', `netstat -ano -p tcp | findstr LISTENING | findstr :${port}`]);
    const pids = [...output.matchAll(/\s(\d+)\s*$/gm)].map((match) => match[1]);
    for (const pid of [...new Set(pids)]) await run('cmd.exe', ['/d', '/s', '/c', `taskkill /pid ${pid} /t /f`]);
    return;
  }
  const output = await run('sh', ['-c', `lsof -tiTCP:${port} -sTCP:LISTEN || true`]);
  for (const pid of output.split(/\s+/).filter(Boolean)) await run('kill', ['-TERM', pid]);
}

async function waitForFree() {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if ((await Promise.all(ports.map(portIsFree))).every(Boolean)) return;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`No se pudieron liberar los puertos ${ports.join(' y ')}.`);
}

(async () => {
  await Promise.all(ports.map(killPort));
  await waitForFree();
  const { spawn } = require('node:child_process');
  const child = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run dev'] : ['run', 'dev'], { stdio: 'inherit', windowsHide: false });
  child.on('exit', (code, signal) => { if (signal) process.kill(process.pid, signal); else process.exit(code ?? 0); });
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
})().catch((error) => { console.error(error.message); process.exit(1); });
