#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const composeFiles = [
  'ARKA-DOCKER/docker-compose.yml',
  'ARKA-APP/docker/compose.etape4.yml',
  'T1_DEPLOY/docker/compose.runner.yml',
  'T1_DEPLOY/docker/compose.adapters.yml',
  'T1_DEPLOY/docker/compose.orchestrator.yml',
  'obs/compose.obs.yml'
];

const down = process.argv.includes('--down');
const extraArgs = process.argv.filter(arg => arg.startsWith('--') && arg !== '--down');

const args = ['compose'];
for (const file of composeFiles) {
  args.push('-f', path.resolve(repoRoot, file));
}
if (down) {
  args.push('down');
} else {
  args.push('up', '-d', '--build');
}
args.push(...extraArgs);

const child = spawn('docker', args, {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

child.on('exit', code => {
  process.exit(code ?? 1);
});
