#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.UPLOAD_DIR || 'uploads');
const maxMb = Number(process.env.UPLOAD_MAX_MB || 5120);
if (!fs.existsSync(root)) fs.mkdirSync(root, { recursive: true });
const probe = path.join(root, `.write-test-${process.pid}`);
try { fs.writeFileSync(probe, `${Date.now()}\n`, { flag: 'wx' }); fs.unlinkSync(probe); }
catch { console.error(`Upload volume is not writable: ${root}`); process.exit(1); }
let bytes = 0;
const walk = (current) => {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) walk(fullPath); else bytes += fs.statSync(fullPath).size;
  }
};
walk(root);
const usedMb = bytes / (1024 * 1024);
console.log(`Upload volume: ${root}`);
console.log(`Used: ${usedMb.toFixed(2)} MB / configured limit: ${maxMb.toFixed(2)} MB`);
if (usedMb > maxMb) { console.error('Upload volume exceeds UPLOAD_MAX_MB.'); process.exit(1); }
