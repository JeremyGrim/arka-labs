#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const PROFILE_FILES = {
  minimal: ['ARKA-DOCKER/docker-compose.yml'],
  core: [
    'ARKA-DOCKER/docker-compose.yml',
    'ARKA-APP/docker/compose.etape4.yml',
  ],
  t1: [
    'ARKA-DOCKER/docker-compose.yml',
    'ARKA-APP/docker/compose.etape4.yml',
    'ARKA-DOCKER/docker/compose.runner.yml',
    'ARKA-DOCKER/docker/compose.adapters.yml',
    'ARKA-DOCKER/docker/compose.orchestrator.yml',
  ],
  full: [
    'ARKA-DOCKER/docker-compose.yml',
    'ARKA-APP/docker/compose.etape4.yml',
    'ARKA-DOCKER/docker/compose.runner.yml',
    'ARKA-DOCKER/docker/compose.adapters.yml',
    'ARKA-DOCKER/docker/compose.orchestrator.yml',
    'obs/compose.obs.yml',
  ],
};
PROFILE_FILES.obs = PROFILE_FILES.full;

const HELP_TEXT = `Usage: npm run arka -- [options]

Options:
  --cmd=<up|down|ps|logs|restart|pull|config>   Command to execute (default: up)
  --profile=<minimal|core|t1|full|obs>          Compose profile (default: full)
  --files=path1,path2                           Extra compose files to append
  --exclude=path1,path2                         Compose files to remove after profile resolution
  --services=name1,name2                        Restrict action/logs to explicit services
  --no-detach                                   Run 'up' in foreground
  --no-build                                    Skip --build on 'up'
  --tail=<lines>                                Tail value for logs (default: 200)
  --follow                                      Follow logs (logs command)
  --volumes                                     Pass -v to 'down'
  --help                                        Display this help

Examples:
  npm run arka                                    # up full stack (detached)
  npm run arka -- --cmd=down --profile=t1         # stop T1 profile
  npm run arka:logs -- --services=arka-app        # follow logs for arka-app
  npm run arka -- --profile=core --cmd=up --no-build`;

const argv = process.argv.slice(2);

function parseArgs(args) {
  const out = {
    cmd: 'up',
    profile: 'full',
    files: [],
    exclude: [],
    services: [],
    passthrough: [],
    options: {},
  };
  let i = 0;
  while (i < args.length) {
    const token = args[i];
    if (token === '--') {
      out.passthrough = args.slice(i + 1);
      break;
    }
    if (!token.startsWith('--')) {
      out.passthrough.push(token);
      i += 1;
      continue;
    }
    const eqIdx = token.indexOf('=');
    const key = token.slice(2, eqIdx === -1 ? undefined : eqIdx);
    const value = eqIdx === -1 ? args[i + 1] : token.slice(eqIdx + 1);
    const nextIsValue = eqIdx === -1;
    switch (key) {
      case 'cmd':
        out.cmd = value;
        if (nextIsValue) i += 1;
        break;
      case 'profile':
        out.profile = value;
        if (nextIsValue) i += 1;
        break;
      case 'files':
        out.files.push(...value.split(',').filter(Boolean));
        if (nextIsValue) i += 1;
        break;
      case 'exclude':
        out.exclude.push(...value.split(',').filter(Boolean));
        if (nextIsValue) i += 1;
        break;
      case 'services':
        out.services.push(...value.split(',').filter(Boolean));
        if (nextIsValue) i += 1;
        break;
      case 'tail':
        out.options.tail = value;
        if (nextIsValue) i += 1;
        break;
      case 'help':
        out.options.help = true;
        break;
      case 'no-detach':
        out.options.noDetach = true;
        break;
      case 'no-build':
        out.options.noBuild = true;
        break;
      case 'follow':
        out.options.follow = true;
        break;
      case 'volumes':
        out.options.volumes = true;
        break;
      default:
        out.passthrough.push(token);
        break;
    }
    i += 1;
  }
  return out;
}

const cli = parseArgs(argv);

if (cli.options.help) {
  console.log(HELP_TEXT);
  process.exit(0);
}

function resolveComposeFiles(profile, extra, exclude) {
  const acc = new Set(PROFILE_FILES[profile] || PROFILE_FILES.full);
  for (const item of extra) acc.add(item);
  for (const item of exclude) acc.delete(item);
  const resolved = [];
  for (const file of acc) {
    const abs = path.resolve(repoRoot, file);
    if (!fs.existsSync(abs)) {
      console.warn(`⚠️  compose file not found, skipping: ${abs}`);
      continue;
    }
    resolved.push(abs);
  }
  if (!resolved.length) {
    console.error('✖ No compose file resolved – check --profile/--files arguments.');
    process.exit(1);
  }
  return resolved;
}

const composeFiles = resolveComposeFiles(cli.profile, cli.files, cli.exclude);

const dockerArgs = ['compose'];
for (const file of composeFiles) {
  dockerArgs.push('-f', file);
}

const services = cli.services.length ? cli.services : [];

switch (cli.cmd) {
  case 'up':
    dockerArgs.push('up');
    if (!cli.options.noDetach) dockerArgs.push('-d');
    if (!cli.options.noBuild) dockerArgs.push('--build');
    break;
  case 'down':
    dockerArgs.push('down');
    if (cli.options.volumes) dockerArgs.push('-v');
    break;
  case 'ps':
    dockerArgs.push('ps');
    break;
  case 'logs':
    dockerArgs.push('logs');
    dockerArgs.push('--tail', cli.options.tail || '200');
    if (cli.options.follow) dockerArgs.push('-f');
    break;
  case 'restart':
    dockerArgs.push('restart');
    break;
  case 'pull':
    dockerArgs.push('pull');
    break;
  case 'config':
    dockerArgs.push('config');
    break;
  default:
    console.error(`✖ Unsupported --cmd value: ${cli.cmd}`);
    process.exit(1);
}

dockerArgs.push(...cli.passthrough);
if (services.length) dockerArgs.push(...services);

console.log(`➡️  docker ${dockerArgs.join(' ')}`);

const child = spawn('docker', dockerArgs, {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
