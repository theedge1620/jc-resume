#!/usr/bin/env node
/* ------------------------------------------------------------------
   Upload everything in ./private to the private Supabase bucket,
   keeping the same paths (private/static/x.pdf → static/x.pdf).

   Needs the service_role key, which must NEVER be committed or put in
   the website. Provide it via environment variable or a git-ignored .env:

     PowerShell:  $env:SUPABASE_SERVICE_ROLE_KEY = "…"; node scripts/upload-private.mjs
     bash:        SUPABASE_SERVICE_ROLE_KEY=… node scripts/upload-private.mjs

   Options:  --dry-run   list what would be uploaded
------------------------------------------------------------------ */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'private');
const dryRun = process.argv.includes('--dry-run');

// Optional .env (KEY=value lines)
const envFile = path.join(root, '.env');
if (existsSync(envFile)) {
  for (const line of (await readFile(envFile, 'utf8')).split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

// Project URL + bucket come from the site's own config.js
const cfgText = await readFile(path.join(root, 'auth', 'config.js'), 'utf8');
const url = (process.env.SUPABASE_URL || cfgText.match(/url:\s*'([^']+)'/)?.[1] || '').replace(/\/$/, '');
const bucket = cfgText.match(/bucket:\s*'([^']+)'/)?.[1] || 'private-site';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url) throw new Error('Supabase URL not found in auth/config.js');
if (!key && !dryRun) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API → service_role).');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8',
  '.woff2': 'font/woff2', '.mp4': 'video/mp4',
};

async function* walk(dir) {
  for (const d of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) yield* walk(p);
    else if (!d.name.startsWith('.')) yield p;
  }
}

let ok = 0, failed = 0;
for await (const file of walk(srcDir)) {
  const key_ = path.relative(srcDir, file).split(path.sep).join('/');
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  if (dryRun) { console.log('would upload', key_, `(${type})`); continue; }
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${key_.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': type, 'x-upsert': 'true', 'Cache-Control': 'no-cache' },
    body: await readFile(file),
  });
  if (res.ok) { ok++; console.log('✓', key_); }
  else { failed++; console.error('✗', key_, res.status, await res.text()); }
}
if (!dryRun) console.log(`\n${ok} uploaded, ${failed} failed → bucket "${bucket}"`);
process.exitCode = failed ? 1 : 0;
