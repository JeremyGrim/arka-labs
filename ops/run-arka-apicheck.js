#!/usr/bin/env node
/**
 * Simple API smoke checker for ARKA-APP backend.
 * Usage: BACKEND_URL=http://localhost:8080 node ops/run-arka-apicheck.js
 */

const { URL } = require('url');

function parseCliArgs(argv) {
  const out = { json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--json') {
      out.json = true;
    } else if (token.startsWith('--base=')) {
      out.baseUrl = token.slice(7);
    } else if (token.startsWith('--api-key=')) {
      out.apiKey = token.slice(10);
    } else if (token.startsWith('--retries=')) {
      const value = Number.parseInt(token.slice(10), 10);
      if (!Number.isNaN(value) && value > 0) {
        out.retries = value;
      }
    } else if (token === '--help') {
      out.help = true;
    }
  }
  return out;
}

const DEFAULT_ENDPOINTS = [
  { name: 'health', path: '/api/healthz', validate: (json) => json && json.ok === true },
  {
    name: 'hp-summary',
    path: '/api/hp/summary',
    validate: (json) => json && Array.isArray(json.actions),
  },
  {
    name: 'catalog-flow',
    path: '/api/catalog?facet=flow&limit=1',
    validate: (json) => json && Array.isArray(json.items),
  },
  {
    name: 'agents-directory',
    path: '/api/agents/directory?client=ACME',
    validate: (json) => json && Array.isArray(json.agents),
  },
  {
    name: 'projects-counters',
    path: '/api/projects/counters',
    validate: (json) => json && Array.isArray(json.items),
  },
  {
    name: 'routing-resolve',
    path: '/api/routing/resolve?term=rgpd',
    validate: (json) => {
      if (json && json.flow_ref) return true;
      if (json && Array.isArray(json.items) && json.items.length) {
        return Boolean(json.items[0].flow_ref);
      }
      return false;
    },
    fallback: [
      { path: '/api/resolve?term=rgpd', type: 'bff' },
      { path: '/resolve?term=rgpd', type: 'router' },
    ],
  },
];

const HELP = `Usage: node ops/run-arka-apicheck.js [--json] [--base=<url>] [--api-key=<key>] [--retries=<n>]
Environment:
  BACKEND_URL       Base URL (default: http://localhost:8080)
  BACKEND_API_KEY   Optional X-API-Key header value`;

async function requestWithValidation({ fetchImpl, url, headers, validator }) {
  const res = await fetchImpl(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const ok = validator ? validator(json) : true;
  if (!ok) throw new Error('payload invalid');
  return { status: 'ok' };
}

async function runEndpointCheck({ fetchImpl, baseUrl, apiKey, endpoint, silent = false }) {
  if (!silent) process.stdout.write(`  • ${endpoint.name} … `);
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'X-API-Key': apiKey } : {}),
    };
    const validator = endpoint.validate;
    const attemptTargets = [
      { url: new URL(endpoint.path, baseUrl).toString(), headers },
    ];
    if (endpoint.fallback) {
      for (const fb of endpoint.fallback) {
        if (fb.type === 'router') {
          const routerBase = process.env.ROUTER_URL || 'http://localhost:8087';
          attemptTargets.push({
            url: new URL(fb.path, routerBase).toString(),
            headers: { 'Content-Type': 'application/json' },
            suppress: true,
          });
        } else {
          attemptTargets.push({
            url: new URL(fb.path, baseUrl).toString(),
            headers,
            suppress: true,
          });
        }
      }
    }
    let lastError;
    for (const target of attemptTargets) {
      try {
        const retval = await requestWithValidation({
          fetchImpl,
          url: target.url,
          headers: target.headers,
          validator,
        });
        if (!silent && !target.suppress) console.log('ok');
        return { endpoint: endpoint.name, ...retval };
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('endpoint unavailable');
  } catch (err) {
    if (!silent) console.log('fail');
    return { endpoint: endpoint.name, status: 'fail', error: err.message };
  }
}

async function runApiCheck(options = {}) {
  const baseUrl = options.baseUrl || process.env.BACKEND_URL || 'http://localhost:8080';
  const apiKey = options.apiKey ?? process.env.BACKEND_API_KEY;
  const endpoints = options.endpoints || DEFAULT_ENDPOINTS;
  const fetchImpl = globalThis.fetch;
  const retries = options.retries && options.retries > 0 ? options.retries : 1;
  const retryDelayMs = options.retryDelayMs ?? 1500;

  if (typeof fetchImpl !== 'function') {
    throw new Error('Node.js fetch API not available. Require Node.js >= 18.');
  }

  if (!options.silent) {
    console.log(`➡️  Checking ARKA API (${baseUrl})`);
  }
  const results = [];
  for (const endpoint of endpoints) {
    let attempt = 0;
    let entry;
    // eslint-disable-next-line no-await-in-loop
    while (attempt < retries) {
      const silent = options.silent || attempt > 0;
      // eslint-disable-next-line no-await-in-loop
      entry = await runEndpointCheck({ fetchImpl, baseUrl, apiKey, endpoint, silent });
      if (entry.status === 'ok' || attempt === retries - 1) {
        break;
      }
      attempt += 1;
      if (!options.silent) {
        console.log(`    ↻ retrying ${endpoint.name} (${attempt + 1}/${retries})`);
      }
      if (retryDelayMs > 0) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
    results.push(entry);
  }
  const failures = results.filter((entry) => entry.status !== 'ok');
  return { results, failures, baseUrl };
}

async function main() {
  const cli = parseCliArgs(process.argv.slice(2));
  if (cli.help) {
    console.log(HELP);
    process.exit(0);
  }
  try {
    const { results, failures, baseUrl } = await runApiCheck({
      baseUrl: cli.baseUrl,
      apiKey: cli.apiKey,
      retries: cli.retries,
    });
    if (cli.json) {
      console.log(JSON.stringify({ baseUrl, results }, null, 2));
    } else if (failures.length === 0) {
      console.log('✅ ARKA API reachable and returning expected payloads.');
    } else {
      console.error('✖ API checks failed:');
      for (const failure of failures) {
        console.error(`    - ${failure.endpoint}: ${failure.error}`);
      }
    }
    if (failures.length) process.exit(1);
  } catch (err) {
    console.error(`✖ ${err.message}`);
    process.exit(1);
  }
}

module.exports = { runApiCheck, DEFAULT_ENDPOINTS };

if (require.main === module) {
  main();
}
