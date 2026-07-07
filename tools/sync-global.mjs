// sync-global.mjs — sincroniza o repo (fonte de verdade) com o ambiente global
// do Claude Code (~/.claude), matando o drift repo ↔ instalado.
//
// O que sincroniza:
//   1. Hooks:  tools/hooks/*.js            → ~/.claude/hooks/
//   2. Skills: src/skills-lib/<id>/        → ~/.claude/skills/<id>/
//      (apenas skills que JÁ existem no global — não instala skills novas;
//       instalação é papel do installer/npx skills add)
//
// Uso: npm run sync:global [-- --dry-run]

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const claudeDir = path.join(os.homedir(), '.claude');
const dryRun = process.argv.includes('--dry-run');

function log(msg) {
  console.log(msg);
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(from, to);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to);
    }
  }
}

function copyDirReplacing(src, dest) {
  if (!dryRun) {
    fs.rmSync(dest, { recursive: true, force: true });
    copyDirRecursive(src, dest);
  }
}

// 1) Hooks
const hooksSrc = path.join(repoRoot, 'tools', 'hooks');
const hooksDest = path.join(claudeDir, 'hooks');
let hookCount = 0;
if (fs.existsSync(hooksSrc) && fs.existsSync(hooksDest)) {
  for (const file of fs.readdirSync(hooksSrc).filter((f) => f.endsWith('.js'))) {
    const from = path.join(hooksSrc, file);
    const to = path.join(hooksDest, file);
    if (!dryRun) fs.copyFileSync(from, to);
    hookCount++;
    log(`hook  ${file} → ~/.claude/hooks/`);
  }
}

// 2) Skills já instaladas no global
const skillsSrc = path.join(repoRoot, 'src', 'skills-lib');
const skillsDest = path.join(claudeDir, 'skills');
let synced = 0;
const skipped = [];
if (fs.existsSync(skillsSrc) && fs.existsSync(skillsDest)) {
  for (const id of fs.readdirSync(skillsSrc)) {
    const src = path.join(skillsSrc, id);
    const dest = path.join(skillsDest, id);
    if (!fs.statSync(src).isDirectory()) continue;
    if (!fs.existsSync(path.join(src, 'SKILL.md'))) continue; // references/ etc.
    if (!fs.existsSync(dest)) {
      skipped.push(id);
      continue;
    }
    copyDirReplacing(src, dest);
    synced++;
    log(`skill ${id} → ~/.claude/skills/${id}/`);
  }
}

log('');
log(`${dryRun ? '[dry-run] ' : ''}${hookCount} hook(s), ${synced} skill(s) sincronizada(s).`);
if (skipped.length > 0) {
  log(`Não instaladas no global (puladas): ${skipped.join(', ')}`);
}
