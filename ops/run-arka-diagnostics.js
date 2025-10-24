#!/usr/bin/env node
/**
 * Aggregated diagnostics helper for the ARKA stack.
 * - Runs the API smoke tests (reuse run-arka-apicheck)
 * - Pings routing / runner / orchestrator / adapters health endpoints
 * - Optional: launch the SOLID PASS python harness for deeper validation
 *
 * Usage:
 *   npm run arka:diagnostics
 *   npm run arka:diagnostics -- --solid
 */

const { spawn, spawnSync } = require('child_process');
const path = require('path');
const { runApiCheck } = require('./run-arka-apicheck');

const fetchImpl = globalThis.fetch;

if (typeof fetchImpl !== 'function') {
  console.error('✖ Node.js fetch API not available. Require Node.js >= 18.');
  process.exit(1);
}

function parseArgs(argv) {
  const out = {
    json: false,
    solid: false,
    verbose: false,
    solidArgs: [],
    retries: undefined,
    targets: undefined,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--json') out.json = true;
    else if (token === '--solid') out.solid = true;
    else if (token.startsWith('--solid-python=')) out.solidPython = token.slice(16);
    else if (token.startsWith('--retries=')) {
      const value = Number.parseInt(token.slice(10), 10);
      if (!Number.isNaN(value) && value > 0) out.retries = value;
    } else if (token.startsWith('--targets=')) {
      out.targets = token
        .slice(10)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    } else if (token === '--verbose') out.verbose = true;
    else if (token === '--') {
      out.solidArgs = argv.slice(i + 1);
      break;
    }
  }
  return out;
}

function getRunningContainers() {
  try {
    const result = spawnSync('docker', ['ps', '--format', '{{.Names}}'], {
      encoding: 'utf8',
    });
    if (result.error || result.status !== 0) return new Set();
    return new Set(
      result.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    );
  } catch {
    return new Set();
  }
}

function serviceTargets(selectedKeys) {
  const base = {
    router: process.env.ROUTER_URL || 'http://localhost:8087',
    runner: process.env.RUNNER_URL || 'http://localhost:9091',
    orchestrator: process.env.ORCH_URL || 'http://localhost:9092',
    adapterCodex: process.env.ADAPTER_CODEX_URL || 'http://localhost:9093',
    adapterOpenAI: process.env.ADAPTER_OPENAI_URL || 'http://localhost:9094',
  };
  const defs = [
    {
      key: 'router',
      name: 'router-health',
      container: 'arka-routing',
      url: new URL('/ping', base.router).toString(),
    },
    {
      key: 'runner',
      name: 'runner-health',
      container: 'arka-runner',
      url: new URL('/healthz', base.runner).toString(),
    },
    {
      key: 'orchestrator',
      name: 'orchestrator-health',
      container: 'arka-orchestrator',
      url: new URL('/healthz', base.orchestrator).toString(),
    },
    {
      key: 'adapter-codex',
      name: 'adapter-codex-health',
      container: 'adapter-codex',
      url: new URL('/healthz', base.adapterCodex).toString(),
    },
    {
      key: 'adapter-openai',
      name: 'adapter-openai-health',
      container: 'adapter-openai',
      url: new URL('/healthz', base.adapterOpenAI).toString(),
    },
  ];
  if (!selectedKeys || selectedKeys.length === 0 || selectedKeys.includes('all')) {
    return defs;
  }
  const wanted = new Set(selectedKeys);
  return defs.filter(
    (item) =>
      wanted.has(item.key) ||
      wanted.has(item.name) ||
      wanted.has(item.name.replace('-health', '')),
  );
}

async function checkService(target, containers, verbose = false) {
  if (!containers.has(target.container)) {
    if (verbose) console.log(`  • ${target.name} … skipped (container not running)`);
    return { name: target.name, status: 'skipped', reason: 'container not running' };
  }
  if (verbose) process.stdout.write(`  • ${target.name} … `);
  try {
    const res = await fetchImpl(target.url, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (verbose) console.log('ok');
    return { name: target.name, status: 'ok' };
  } catch (err) {
    if (verbose) console.log('fail');
    return { name: target.name, status: 'fail', error: err.message };
  }
}

function splitCommandString(value) {
  const tokens = [];
  const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match;
  while ((match = regex.exec(value)) !== null) {
    if (match[1] !== undefined) tokens.push(match[1]);
    else if (match[2] !== undefined) tokens.push(match[2]);
    else tokens.push(match[3]);
  }
  return tokens;
}

function resolvePythonCommand(cliPath) {
  const candidates = [];
  if (cliPath) candidates.push(splitCommandString(cliPath));
  if (process.env.SOLID_PASS_PYTHON && process.env.SOLID_PASS_PYTHON !== cliPath) {
    candidates.push(splitCommandString(process.env.SOLID_PASS_PYTHON));
  }
  candidates.push(['py', '-3.12'], ['py', '-3.11'], ['python3'], ['python']);

  for (const candidate of candidates) {
    const [cmd, ...args] = candidate;
    if (!cmd) continue;
    try {
      const check = spawnSync(cmd, [...args, '--version'], {
        stdio: 'ignore',
        shell: false,
      });
      if (check.status === 0) {
        return { cmd, args };
      }
    } catch (err) {
      continue;
    }
  }
  return null;
}

function runSolidPass(cliPath, extraArgs, verbose) {
  const script = path.resolve(__dirname, 'solid_pass', 'scripts', 'solid_runner.py');
  const resolved = resolvePythonCommand(cliPath);
  if (!resolved) {
    return Promise.resolve({
      status: 'fail',
      output: 'Aucun interpréteur Python trouvé (essayé py -3.12/-3.11, python3, python).',
      code: 127,
    });
  }
  if (verbose) {
    console.log(`➡️  Launching SOLID PASS via ${resolved.cmd} ${[...resolved.args, script].join(' ')}`);
  }
  return new Promise((resolve) => {
    const child = spawn(resolved.cmd, [...resolved.args, script, ...extraArgs], {
      cwd: path.resolve(__dirname, 'solid_pass'),
      stdio: verbose ? 'inherit' : 'pipe',
      shell: false,
    });
    let output = '';
    if (!verbose) {
      child.stdout.on('data', (data) => { output += data.toString(); });
      child.stderr.on('data', (data) => { output += data.toString(); });
    }
    child.on('exit', (code) => {
      resolve({ status: code === 0 ? 'ok' : 'fail', output, code });
    });
  });
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  const summary = {
    api: null,
    services: [],
    solidPass: null,
  };
  const runningContainers = getRunningContainers();

  try {
    const apiResult = await runApiCheck({
      silent: cli.json || !cli.verbose,
      baseUrl: process.env.BACKEND_URL,
      apiKey: process.env.BACKEND_API_KEY,
      retries: cli.retries,
    });
    summary.api = apiResult;
    if (!cli.json) {
      if (apiResult.failures.length === 0) {
        console.log('✅ API checks passed (ARKA APP).');
      } else {
        console.error('✖ API checks reported failures.');
      }
    }
  } catch (err) {
    summary.api = { failures: [{ endpoint: 'bootstrap', error: err.message }], results: [] };
    console.error(`✖ API checks aborted: ${err.message}`);
  }

  const targets = serviceTargets(cli.targets);
  const serviceChecks = await Promise.all(
    targets.map((target) => checkService(target, runningContainers, !cli.json && cli.verbose)),
  );
  summary.services = serviceChecks;
  const serviceFailures = serviceChecks.filter((entry) => entry.status === 'fail');
  const serviceSkipped = serviceChecks.filter((entry) => entry.status === 'skipped');
  if (!cli.json) {
    if (serviceFailures.length) {
      console.error('✖ Service health probe failures detected.');
      serviceFailures.forEach((entry) => console.error(`    - ${entry.name}: ${entry.error}`));
    } else if (serviceSkipped.length) {
      console.log(
        `ℹ️  Service checks partiellement exécutés (skipped: ${serviceSkipped
          .map((entry) => entry.name)
          .join(', ')})`,
      );
    } else {
      console.log('✅ Service health endpoints reachable (routing/runner/orchestrator/adapters).');
    }
  }

  if (cli.solid) {
    summary.solidPass = await runSolidPass(cli.solidPython, cli.solidArgs, cli.verbose);
    if (!cli.json) {
      if (summary.solidPass.status === 'ok') {
        console.log('✅ SOLID PASS completed successfully.');
      } else {
        console.error('✖ SOLID PASS failed (see output below).');
        if (!cli.verbose) process.stderr.write(summary.solidPass.output);
      }
    }
  }

  if (cli.json) {
    console.log(JSON.stringify(summary, null, 2));
  }

  const apiFailed = summary.api && summary.api.failures && summary.api.failures.length > 0;
  const servicesFailed = serviceFailures.length > 0;
  const solidFailed = summary.solidPass && summary.solidPass.status !== 'ok';

  if (apiFailed || servicesFailed || solidFailed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`✖ diagnostics aborted: ${err.message}`);
  process.exit(1);
});

