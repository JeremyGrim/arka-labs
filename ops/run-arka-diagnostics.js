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

const { spawn } = require('child_process');
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
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--json') out.json = true;
    else if (token === '--solid') out.solid = true;
    else if (token.startsWith('--solid-python=')) out.solidPython = token.slice(16);
    else if (token === '--verbose') out.verbose = true;
    else if (token === '--') {
      out.solidArgs = argv.slice(i + 1);
      break;
    }
  }
  return out;
}

function serviceTargets() {
  const base = {
    router: process.env.ROUTER_URL || 'http://localhost:8087',
    runner: process.env.RUNNER_URL || 'http://localhost:9091',
    orchestrator: process.env.ORCH_URL || 'http://localhost:9092',
    adapterCodex: process.env.ADAPTER_CODEX_URL || 'http://localhost:9093',
    adapterOpenAI: process.env.ADAPTER_OPENAI_URL || 'http://localhost:9094',
  };
  return [
    { name: 'router-health', url: new URL('/healthz', base.router).toString() },
    { name: 'runner-health', url: new URL('/healthz', base.runner).toString() },
    { name: 'orchestrator-health', url: new URL('/healthz', base.orchestrator).toString() },
    { name: 'adapter-codex-health', url: new URL('/healthz', base.adapterCodex).toString() },
    { name: 'adapter-openai-health', url: new URL('/healthz', base.adapterOpenAI).toString() },
  ];
}

async function checkService(target, verbose = false) {
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

function runSolidPass(pyPath, extraArgs, verbose) {
  const script = path.resolve(__dirname, 'solid_pass', 'scripts', 'solid_runner.py');
  const pythonExecutable = pyPath || process.env.SOLID_PASS_PYTHON || 'python3';
  if (verbose) {
    console.log(`➡️  Launching SOLID PASS via ${pythonExecutable} ${script}`);
  }
  return new Promise((resolve) => {
    const child = spawn(pythonExecutable, [script, ...extraArgs], {
      cwd: path.resolve(__dirname, 'solid_pass'),
      stdio: verbose ? 'inherit' : 'pipe',
      shell: process.platform === 'win32',
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

  try {
    const apiResult = await runApiCheck({
      silent: cli.json || !cli.verbose,
      baseUrl: process.env.BACKEND_URL,
      apiKey: process.env.BACKEND_API_KEY,
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

  const serviceChecks = await Promise.all(serviceTargets().map((target) => checkService(target, !cli.json && cli.verbose)));
  summary.services = serviceChecks;
  const serviceFailures = serviceChecks.filter((entry) => entry.status !== 'ok');
  if (!cli.json) {
    if (serviceFailures.length) {
      console.error('✖ Service health probe failures detected.');
      serviceFailures.forEach((entry) => console.error(`    - ${entry.name}: ${entry.error}`));
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
