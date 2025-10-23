#!/usr/bin/env node
/**
 * Simple API smoke checker for ARKA-APP backend.
 * Usage: BACKEND_URL=http://localhost:8080 node ops/run-arka-apicheck.js
 */

const { URL } = require('url');

const baseUrl = process.env.BACKEND_URL || 'http://localhost:8080';
const apiKey = process.env.BACKEND_API_KEY;

const endpoints = [
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
];

const fetchFn = globalThis.fetch;

if (typeof fetchFn !== 'function') {
  console.error('✖ Node.js fetch API not available. Require Node.js >= 18.');
  process.exit(1);
}

const joinUrl = (base, path) => {
  try {
    return new URL(path, base).toString();
  } catch (err) {
    console.error(`✖ Invalid URL: base=${base} path=${path}`);
    throw err;
  }
};

(async () => {
  console.log(`➡️  Checking ARKA API (${baseUrl})`);
  const results = [];
  for (const endpoint of endpoints) {
    const url = joinUrl(baseUrl, endpoint.path);
    process.stdout.write(`  • ${endpoint.name} … `);
    try {
      const res = await fetchFn(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'X-API-Key': apiKey } : {}),
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      const ok = endpoint.validate ? endpoint.validate(json) : true;
      if (!ok) {
        throw new Error('payload invalid');
      }
      console.log('ok');
      results.push({ endpoint: endpoint.name, status: 'ok' });
    } catch (err) {
      console.log('fail');
      results.push({ endpoint: endpoint.name, status: 'fail', error: err.message });
    }
  }

  const failures = results.filter((entry) => entry.status !== 'ok');
  if (failures.length) {
    console.error('✖ API checks failed:');
    for (const failure of failures) {
      console.error(`    - ${failure.endpoint}: ${failure.error}`);
    }
    process.exit(1);
  }

  console.log('✅ ARKA API reachable and returning expected payloads.');
})();
