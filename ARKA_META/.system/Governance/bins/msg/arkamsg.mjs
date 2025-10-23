#!/usr/bin/env node
/**
 * Messagerie ARKA — format threads v1
 *
 * Commandes :
 *   arkamsg pull --agent <id> [--thread <tid>] [--show]
 *   arkamsg send --from <id> --to <id> --subject "..." --body "..."
 *                [--status TODO|IN_PROGRESS|BLOCKED]
 *                [--type STATUS|RESULT]
 *                [--actions "ack,plan,deliver"]
 *                [--thread <tid>]
 *                [--relates-to <message_id>]
 *                [--no-notify]
 */
import fs from 'fs/promises';
import path from 'path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = process.cwd();
const messagingRoot = path.join(repoRoot, 'ARKA_META/messaging');
const threadsRoot = path.join(messagingRoot, 'msg');
const agentsRoot = path.join(messagingRoot, 'agents');

const DEFAULT_PROJECT_ID = process.env.ARKA_PROJECT_ID || 'arka-labs-b';
const DEFAULT_PROVIDER = process.env.ARKA_PROVIDER || 'codex';
const DEFAULT_SESSION_PREFIX = process.env.ARKA_SESSION_PREFIX || 'arka';
const notifyCliPath = path.join(repoRoot, 'ARKA_OS/ARKA_CORE/management/push_notify/bin/notify.mjs');
const notifyConfigRoot = path.join(repoRoot, 'ARKA_OS/ARKA_CORE/management/push_notify/config');
const notifyAllowlistPath = path.join(notifyConfigRoot, 'allowlist.yaml');

let notifyAllowlistCache = null;

function normalizeAllowlistKey(value) {
  if (!value) return null;
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function loadNotifyAllowlist() {
  if (notifyAllowlistCache) {
    return notifyAllowlistCache;
  }
  try {
    const content = await fs.readFile(notifyAllowlistPath, 'utf8');
    const raw = parseYaml(content) ?? {};
    const rolesRaw = raw.roles ?? {};
    const aliasesRaw = raw.aliases ?? {};

    const roleMap = new Map();
    for (const [roleName] of Object.entries(rolesRaw)) {
      const normalized = normalizeAllowlistKey(roleName);
      if (!normalized) continue;
      roleMap.set(normalized, roleName);
    }

    const aliasMap = new Map();
    for (const [alias, targetRole] of Object.entries(aliasesRaw)) {
      const normalizedAlias = normalizeAllowlistKey(alias);
      if (!normalizedAlias) continue;
      aliasMap.set(normalizedAlias, String(targetRole));
    }

    for (const [normalizedRole, roleName] of roleMap.entries()) {
      if (!aliasMap.has(normalizedRole)) {
        aliasMap.set(normalizedRole, roleName);
      }
    }

    notifyAllowlistCache = {
      roleMap,
      aliasMap,
      error: null,
    };
  } catch (error) {
    console.warn(
      `[arkamsg] Impossible de charger allowlist notifications (${error.message}). Notifications auto désactivées.`
    );
    notifyAllowlistCache = {
      roleMap: new Map(),
      aliasMap: new Map(),
      error,
    };
  }
  return notifyAllowlistCache;
}

function allowlistHasRole(allowlist, roleName) {
  if (!allowlist || !roleName) return false;
  const normalizedRole = normalizeAllowlistKey(roleName);
  if (!normalizedRole) return false;
  return allowlist.roleMap.has(normalizedRole);
}

function isNotifyTargetAllowed(allowlist, agentId) {
  if (!allowlist || !agentId) return false;
  const normalizedAgent = normalizeAllowlistKey(agentId);
  if (!normalizedAgent) return false;
  if (allowlist.roleMap.has(normalizedAgent)) {
    return true;
  }
  const aliasRole = allowlist.aliasMap.get(normalizedAgent);
  if (!aliasRole) return false;
  return allowlistHasRole(allowlist, aliasRole);
}

async function loadYamlModule() {
  const candidates = [
    path.resolve(repoRoot, 'node_modules/yaml/dist/index.js'),
    path.resolve(__dirname, '../../../../node_modules/yaml/dist/index.js'),
    path.resolve(__dirname, '../../../../../node_modules/yaml/dist/index.js'),
  ];
  for (const modulePath of candidates) {
    try {
      return await import(pathToFileURL(modulePath).href);
    } catch (err) {
      if (err.code !== 'ERR_MODULE_NOT_FOUND' && err.code !== 'ENOENT') throw err;
    }
  }
  throw new Error(
    'Module YAML introuvable : installez la dépendance avec `npm install yaml`.'
  );
}

const { parse: parseYaml, stringify: stringifyYaml } = await loadYamlModule();

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0) return { command: null, options: {} };
  const [command, ...rest] = args;
  const options = {};
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith('--')) {
      (options._ ??= []).push(token);
      continue;
    }
    const key = token.slice(2);
    const next = rest[i + 1];
    const value = next === undefined || next.startsWith('--') ? true : rest[++i];
    const camel = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (options[camel] === undefined) {
      options[camel] = value;
    } else if (Array.isArray(options[camel])) {
      options[camel].push(value);
    } else {
      options[camel] = [options[camel], value];
    }
  }
  return { command, options };
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function loadYamlFile(filePath, fallback) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return parseYaml(content) ?? fallback;
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function saveYamlFile(filePath, data) {
  const content = stringifyYaml(data);
  await fs.writeFile(filePath, content, 'utf8');
}

function nowIso() {
  return new Date().toISOString();
}

function slugify(input, fallback = 'message') {
  const slug = String(input ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || fallback;
}

function timestampForDir(date = new Date()) {
  return date.toISOString().replace(/:/g, '-');
}

function generateTid() {
  return `T-${crypto.randomBytes(3).toString('base64url').toUpperCase()}`;
}

async function ensureAgent(agent) {
  if (!agent) throw new Error('Agent obligatoire');
  const dir = path.join(agentsRoot, agent);
  await ensureDir(dir);
  const msgBoxPath = path.join(dir, 'msg-box.yaml');
  const msgBox = await loadYamlFile(msgBoxPath, { agent, threads: [] });
  msgBox.agent = agent;
  if (!Array.isArray(msgBox.threads)) msgBox.threads = [];
  await saveYamlFile(msgBoxPath, msgBox);
  return { dir, msgBoxPath, msgBox };
}

async function loadMsgBox(agent) {
  const msgBoxPath = path.join(agentsRoot, agent, 'msg-box.yaml');
  return loadYamlFile(msgBoxPath, { agent, threads: [] });
}

async function saveMsgBox(agent, data) {
  const msgBoxPath = path.join(agentsRoot, agent, 'msg-box.yaml');
  await ensureDir(path.dirname(msgBoxPath));
  data.agent = agent;
  await saveYamlFile(msgBoxPath, data);
}

function findThread(msgBox, predicate) {
  return msgBox.threads?.find(predicate) ?? null;
}

function updateThreadEntry(list, tid, updater) {
  let entry = list.find((item) => item.tid === tid);
  if (!entry) {
    entry = { tid, path: null, status: 'TODO', updated_at: nowIso() };
    list.push(entry);
  }
  updater(entry);
}

async function ensureThreadDirectory(subject) {
  await ensureDir(threadsRoot);
  const base = `${timestampForDir()}—${slugify(subject, 'message')}`;
  let dirName = base;
  let attempt = 1;
  while (true) {
    const candidate = path.join(threadsRoot, dirName);
    try {
      await fs.access(candidate);
      dirName = `${base}-${++attempt}`;
    } catch (error) {
      if (error.code === 'ENOENT') {
        await ensureDir(candidate);
        return { dirName, absPath: candidate };
      }
      throw error;
    }
  }
}

function normalizeThreadPath(threadPath) {
  if (!threadPath) return null;
  if (threadPath.startsWith('ARKA_META/')) return threadPath;
  if (threadPath.startsWith('messaging/')) return `ARKA_META/${threadPath}`;
  if (threadPath.startsWith('msg/')) return `ARKA_META/messaging/${threadPath}`;
  return path.posix.join('ARKA_META', 'messaging', threadPath);
}

function resolveThreadAbsolutePath(threadPath) {
  const normalized = normalizeThreadPath(threadPath);
  if (!normalized) return null;
  return path.join(repoRoot, normalized);
}

function buildMessageFileName(type, from, to, subject) {
  const slug = slugify(subject, 'note');
  const fromSlug = slugify(from, 'from');
  const toSlug = slugify(to, 'to');
  return `${type}__${fromSlug}@${toSlug}__${slug}.yaml`;
}

async function readThreadMessages(threadPath) {
  const absPath = resolveThreadAbsolutePath(threadPath);
  if (!absPath) return [];
  const entries = await fs.readdir(absPath);
  const yamlEntries = entries.filter((entry) => entry.endsWith('.yaml'));
  const messages = [];
  for (const entry of yamlEntries.sort()) {
    const data = await loadYamlFile(path.join(absPath, entry), null);
    if (data) {
      messages.push({ file: entry, data });
    }
  }
  return messages;
}

function normalizeActions(actions) {
  if (!actions) return undefined;
  if (Array.isArray(actions)) return actions.map((item) => item.trim()).filter(Boolean);
  return String(actions)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function runNotifyEnqueue({ pointer, project, toAgent, provider, sessionPrefix, metadata }) {
  const args = [
    notifyCliPath,
    'enqueue',
    '--pointer',
    pointer,
    '--project',
    project,
    '--to-agent',
    toAgent,
    '--provider',
    provider,
    '--session-prefix',
    sessionPrefix,
  ];
  if (metadata) {
    args.push('--metadata', JSON.stringify(metadata));
  }
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error('notify enqueue a échoué');
  }
}

async function handleSend(options) {
  const from = options.from ?? options.agent;
  const recipients = Array.isArray(options.to)
    ? options.to
    : typeof options.to === 'string'
      ? [options.to]
      : [];
  if (!from) throw new Error('--from obligatoire');
  if (recipients.length === 0) throw new Error('--to obligatoire');

  const subject = options.subject ?? '(sans sujet)';
  let body = options.body ?? '';
  if (options.bodyFile) {
    body = await fs.readFile(path.resolve(options.bodyFile), 'utf8');
  }
  if (!body) throw new Error('Le corps du message est vide (--body ou --body-file)');

  const type = (options.type ?? 'STATUS').toString().toUpperCase();
  const statusValue =
    type === 'STATUS'
      ? (options.status ?? 'TODO').toString().toUpperCase()
      : undefined;
  const actionsExpected = normalizeActions(options.actions);
  const relatesTo = options.relatesTo;
  const providedTid = options.thread;
  const notifyDisabled = options.noNotify === true || options.noNotify === 'true';

  await ensureAgent(from);

  const projectId = options.project ?? DEFAULT_PROJECT_ID;
  const provider = options.provider ?? DEFAULT_PROVIDER;
  const sessionPrefix = options.sessionPrefix ?? DEFAULT_SESSION_PREFIX;
  let notifyAllowlist = null;
  if (!notifyDisabled) {
    notifyAllowlist = await loadNotifyAllowlist();
    if (notifyAllowlist?.error) {
      console.warn(
        '[arkamsg] Allowlist notify indisponible : aucune notification automatique ne sera émise.'
      );
    }
  }

  for (const to of recipients) {
    if (to === true || !to) {
      throw new Error('Valeur manquante pour --to');
    }
    const { msgBox: toMsgBox } = await ensureAgent(to);
    const { msgBox: fromMsgBox } = await ensureAgent(from);

    let threadTid = providedTid;
    let threadInfo = null;

    if (threadTid) {
      threadInfo =
        findThread(toMsgBox, (entry) => entry.tid === threadTid) ||
        findThread(fromMsgBox, (entry) => entry.tid === threadTid);
      if (!threadInfo) {
        throw new Error(`Thread ${threadTid} introuvable pour ${from}/${to}`);
      }
      if (threadInfo.path) {
        threadInfo.path = normalizeThreadPath(threadInfo.path);
      }
    } else {
      threadTid = generateTid();
      const { dirName, absPath } = await ensureThreadDirectory(subject);
      const relPath = path.posix.join('ARKA_META', 'messaging', 'msg', dirName);
      threadInfo = { tid: threadTid, path: relPath, absPath };
    }

    const threadDir =
      threadInfo.absPath ?? resolveThreadAbsolutePath(threadInfo.path ?? '');
    if (!threadInfo.path || !threadDir) {
      throw new Error(`Thread ${threadTid} mal initialisé (path manquant)`);
    }
    await ensureDir(threadDir);

    const fileName = buildMessageFileName(type, from, to, subject);
    const messageData = {
      tid: threadTid,
      type,
      from,
      to,
      sujet: subject,
      message: body,
    };
    if (type === 'STATUS') {
      messageData.status = statusValue ?? 'TODO';
    }
    if (relatesTo) messageData.relates_to = relatesTo;
    if (actionsExpected?.length) messageData.actions_expected = actionsExpected;

    const filePath = path.join(threadDir, fileName);
    await saveYamlFile(filePath, messageData);

    const updatedAt = nowIso();
    const updateEntry = (entry, forAgent) => {
      entry.path = normalizeThreadPath(threadInfo.path);
      entry.status = type === 'STATUS' ? messageData.status : type;
      entry.last = fileName;
      entry.updated_at = updatedAt;
      entry.summary = subject;
      if (!entry.participants) {
        entry.participants = Array.from(new Set([from, to]));
      } else if (!entry.participants.includes(forAgent === from ? to : from)) {
        entry.participants.push(forAgent === from ? to : from);
      }
    };

    updateThreadEntry(fromMsgBox.threads, threadTid, (entry) => updateEntry(entry, from));
    updateThreadEntry(toMsgBox.threads, threadTid, (entry) => updateEntry(entry, to));

    await saveMsgBox(from, fromMsgBox);
    await saveMsgBox(to, toMsgBox);

    const normalizedThreadPath = normalizeThreadPath(threadInfo.path);
    const relativePointer = path
      .posix.join(normalizedThreadPath ?? '', fileName)
      .replace(/\\/g, '/');
    console.log(`[arkamsg] message ${fileName} enregistré (${relativePointer})`);

    if (!notifyDisabled) {
      if (!notifyAllowlist || notifyAllowlist.error) {
        // Notifications déjà neutralisées par absence d'allowlist valide.
      } else if (!isNotifyTargetAllowed(notifyAllowlist, to)) {
        console.log(
          `[arkamsg] notification auto ignorée pour ${to} (hors allow-list notifications).`
        );
      } else {
        runNotifyEnqueue({
          pointer: relativePointer,
          project: projectId,
          toAgent: to,
          provider,
          sessionPrefix,
          metadata: {
            subject,
            thread_tid: threadTid,
            from,
            to,
            type,
            status: messageData.status ?? null,
          },
        });
      }
    }
  }
}

function formatThreadLine(entry) {
  const status = entry.status ?? 'UNKNOWN';
  const updated = entry.updated_at ?? '';
  const summary = entry.summary ?? '';
  return `${entry.tid} [${status}] ${summary} (${updated})`;
}

async function handlePull(options) {
  const agent = options.agent;
  if (!agent) throw new Error('--agent obligatoire');
  const msgBox = await loadMsgBox(agent);
  const threads = Array.isArray(msgBox.threads) ? msgBox.threads : [];
  if (!threads.length) {
    console.log(`[arkamsg] Aucun fil pour ${agent}`);
    return;
  }
  const targetTid = options.thread === true ? null : options.thread;
  const showDetail = options.show === true || options.show === 'true';
  const sorted = [...threads].sort((a, b) => {
    const ad = new Date(a.updated_at ?? 0).getTime();
    const bd = new Date(b.updated_at ?? 0).getTime();
    return bd - ad;
  });

  if (targetTid) {
    const entry = sorted.find((item) => item.tid === targetTid);
    if (!entry) {
      console.error(`[arkamsg] Thread ${targetTid} introuvable pour ${agent}`);
      process.exitCode = 1;
      return;
    }
    console.log(formatThreadLine(entry));
    if (showDetail) {
      const messages = await readThreadMessages(entry.path);
      for (const message of messages) {
        console.log('---');
        console.log(`${message.data.type}${message.data.status ? ` (${message.data.status})` : ''} — ${message.file}`);
        console.log(`de ${message.data.from} → ${message.data.to}`);
        console.log(`sujet: ${message.data.sujet}`);
        console.log(message.data.message);
        if (message.data.actions_expected) {
          console.log(`actions_expected: ${message.data.actions_expected.join(', ')}`);
        }
      }
    }
    return;
  }

  for (const entry of sorted) {
    console.log(formatThreadLine(entry));
    if (showDetail) {
      const messages = await readThreadMessages(entry.path);
      const last = messages[messages.length - 1];
      if (last) {
        console.log(`  ↳ ${last.data.from} → ${last.data.to} :: ${last.data.sujet}`);
      }
    }
  }
}

async function main() {
  const { command, options } = parseArgs(process.argv);
  try {
    if (command === 'pull') {
      await handlePull(options);
    } else if (command === 'send') {
      await handleSend(options);
    } else {
      console.error(`Commande inconnue : ${command ?? '(vide)'}
Utilisation :
  arkamsg pull --agent <id> [--thread <tid>] [--show]
  arkamsg send --from <id> --to <id> --subject "..." --body "..." [options]`);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('[arkamsg]', error.message);
    process.exitCode = 1;
  }
}

await main();
