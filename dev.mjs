import { spawn } from 'node:child_process';
const children = [
  spawn(process.execPath, ['server.mjs'], { stdio: 'inherit', env: process.env }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'], { stdio: 'inherit', env: process.env }),
];
function stop() { for (const child of children) if (!child.killed) child.kill('SIGTERM'); }
process.on('SIGINT', () => { stop(); process.exit(0); });
process.on('SIGTERM', () => { stop(); process.exit(0); });
for (const child of children) child.on('exit', code => { if (code && code !== 0) { stop(); process.exitCode = code; } });
