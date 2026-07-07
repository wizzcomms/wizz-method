// sync-check.mjs — compara hashes entre o repo (fonte de verdade) e a
// instalação global do Claude Code (~/.claude), SEM escrever nada.
//
// Espelha a MESMA lista de sincronização de tools/sync-global.mjs, lida de
// tools/lib/sync-targets.mjs (fonte única, ver comentário lá): hooks
// tools/hooks/*.js|*.sh → ~/.claude/hooks/, skills src/skills-lib/<id>/ →
// ~/.claude/skills/<id>/.
//
// Fail-open por design (auditoria 2026-07-07, M10: "um check leve... que
// compara hashes repo vs global e avisa"). Isto é um LEMBRETE, não um gate:
// sempre sai com exit 0, mesmo com drift — nunca bloqueia commit/build.
// Nunca escreve em ~/.claude (nem no sidecar rtk .rtk-hook.sha256, que é
// fail-closed e gerenciado só pelo sync-global — ver comentário lá).
//
// Uso: npm run sync:check
//      node tools/sync-check.mjs --claude-dir /caminho/alternativo   (testes)

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { hooksSrcDir, skillsSrcDir, listHookFiles, listSkillIds } from './lib/sync-targets.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseClaudeDir(argv) {
  const idx = argv.indexOf('--claude-dir');
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  return path.join(os.homedir(), '.claude');
}

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

// Hash recursivo e determinístico de um diretório: concatena
// "path-relativo:hash-do-conteúdo" de cada arquivo (ordenado) e hasheia o
// resultado. Pega qualquer alteração de conteúdo, arquivo novo ou removido
// dentro da pasta da skill.
function hashDir(dirPath) {
  const entries = [];
  function walk(current, rel) {
    const items = fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of items) {
      const abs = path.join(current, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(abs, relPath);
      } else if (entry.isFile()) {
        entries.push(`${relPath}:${hashFile(abs)}`);
      }
    }
  }
  walk(dirPath, '');
  return crypto.createHash('sha256').update(entries.join('\n')).digest('hex');
}

function checkHooks(claudeDir) {
  const hooksSrc = hooksSrcDir(repoRoot);
  const hooksDest = path.join(claudeDir, 'hooks');
  return listHookFiles(repoRoot).map((file) => {
    const from = path.join(hooksSrc, file);
    const to = path.join(hooksDest, file);
    if (!fs.existsSync(to)) return { kind: 'hook', name: file, status: 'not-installed' };
    const status = hashFile(from) === hashFile(to) ? 'ok' : 'drift';
    return { kind: 'hook', name: file, status };
  });
}

function checkSkills(claudeDir) {
  const skillsSrc = skillsSrcDir(repoRoot);
  const skillsDest = path.join(claudeDir, 'skills');
  return listSkillIds(repoRoot).map((id) => {
    const from = path.join(skillsSrc, id);
    const to = path.join(skillsDest, id);
    if (!fs.existsSync(to)) return { kind: 'skill', name: id, status: 'not-installed' };
    const status = hashDir(from) === hashDir(to) ? 'ok' : 'drift';
    return { kind: 'skill', name: id, status };
  });
}

/**
 * Roda o check completo (hooks + skills) contra `claudeDir` e devolve a
 * lista de resultados, sem imprimir nada nem escrever em disco. Exportada
 * separada do `main()` de CLI para permitir teste programático.
 */
export function runSyncCheck(claudeDir) {
  return [...checkHooks(claudeDir), ...checkSkills(claudeDir)];
}

function main() {
  const claudeDir = parseClaudeDir(process.argv.slice(2));
  const results = runSyncCheck(claudeDir);

  const drift = results.filter((r) => r.status === 'drift');
  const notInstalled = results.filter((r) => r.status === 'not-installed');
  const ok = results.filter((r) => r.status === 'ok');

  console.log(`sync:check — comparando ${repoRoot} vs ${claudeDir}\n`);
  for (const r of drift) {
    console.log(`  ⚠ DRIFT         ${r.kind} ${r.name} — repo e ~/.claude divergem`);
  }
  for (const r of notInstalled) {
    console.log(`  · não instalado ${r.kind} ${r.name} — não existe em ${claudeDir}, ignorado`);
  }
  console.log(`\n${ok.length} em sync, ${drift.length} com drift, ${notInstalled.length} não instalada(s) (ignoradas).`);

  if (drift.length > 0) {
    console.log('\nAviso (não bloqueia): o repo é a fonte de verdade. Rode "npm run sync:global" para atualizar ~/.claude.');
  }

  // Fail-open por decisão da auditoria (M10): isto é lembrete, não gate —
  // nunca falha o build/commit por drift.
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
