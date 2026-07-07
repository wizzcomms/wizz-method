// sync-global.mjs — sincroniza o repo (fonte de verdade) com o ambiente global
// do Claude Code (~/.claude), matando o drift repo ↔ instalado.
//
// O que sincroniza:
//   1. Hooks:  tools/hooks/*.js e *.sh     → ~/.claude/hooks/
//      (o .sh hoje é só o rtk-rewrite.sh; modo executável preservado)
//   2. Skills: src/skills-lib/<id>/        → ~/.claude/skills/<id>/
//      (apenas skills que JÁ existem no global — não instala skills novas;
//       instalação é papel do installer/npx skills add)
//
// Uso: npm run sync:global [-- --dry-run]

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { hooksSrcDir, skillsSrcDir, listHookFiles, listSkillIds } from './lib/sync-targets.mjs';

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
const hooksSrc = hooksSrcDir(repoRoot);
const hooksDest = path.join(claudeDir, 'hooks');
let hookCount = 0;
if (fs.existsSync(hooksSrc) && fs.existsSync(hooksDest)) {
  for (const file of listHookFiles(repoRoot)) {
    const from = path.join(hooksSrc, file);
    const to = path.join(hooksDest, file);
    if (!dryRun) {
      fs.copyFileSync(from, to);
      // Preserve the source file's mode (in particular the executable bit
      // on .sh hooks — they are invoked directly by path in settings.json,
      // not via `bash file.sh`, so losing +x would silently break them).
      fs.chmodSync(to, fs.statSync(from).mode);
    }
    hookCount++;
    log(`hook  ${file} → ~/.claude/hooks/`);

    // rtk's own binary self-verifies rtk-rewrite.sh against a sidecar
    // checksum (~/.claude/hooks/.rtk-hook.sha256, format `<sha256>  rtk-rewrite.sh`,
    // shasum -c compatible) and refuses to rewrite anything if it drifts —
    // by design, to detect tampering. Since we intentionally maintain a
    // patched fork of this hook in the repo (multi-line fix + timeout,
    // 2026-07-07 audit C4/RT1), every sync must regenerate the sidecar from
    // the freshly-copied content, or rtk would flag our own legitimate patch
    // as tampering on the next command.
    if (file === 'rtk-rewrite.sh') {
      const sidecar = path.join(hooksDest, '.rtk-hook.sha256');
      if (!dryRun) {
        const digest = crypto.createHash('sha256').update(fs.readFileSync(to)).digest('hex');
        // rtk ships this sidecar read-only (0o444) as its own tamper guard.
        // Make it writable just long enough to regenerate, then restore the
        // same protection — never leave it world-writable.
        if (fs.existsSync(sidecar)) fs.chmodSync(sidecar, 0o644);
        fs.writeFileSync(sidecar, `${digest}  rtk-rewrite.sh\n`);
        fs.chmodSync(sidecar, 0o444);
      }
      log(`hook  .rtk-hook.sha256 → ~/.claude/hooks/ (regenerado a partir do rtk-rewrite.sh sincronizado)`);
    }
  }
}

// 2) Skills já instaladas no global
const skillsSrc = skillsSrcDir(repoRoot);
const skillsDest = path.join(claudeDir, 'skills');
let synced = 0;
const skipped = [];
if (fs.existsSync(skillsSrc) && fs.existsSync(skillsDest)) {
  for (const id of listSkillIds(repoRoot)) {
    const src = path.join(skillsSrc, id);
    const dest = path.join(skillsDest, id);
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
