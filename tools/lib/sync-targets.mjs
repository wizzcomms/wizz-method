// sync-targets.mjs — fonte única da lista de sincronização repo → ~/.claude.
//
// Usado por tools/sync-global.mjs (escreve: repo → ~/.claude) e
// tools/sync-check.mjs (só lê: compara hash repo vs ~/.claude, sem escrever).
// Mudou o que sincroniza? Mude só aqui — os dois scripts leem a mesma lista,
// então não podem driftar entre si (essa era exatamente a lacuna que gerou
// a tarefa 2.7 da auditoria: o M10 aponta sync manual e esquecível).
//
// O que sincroniza hoje:
//   1. Hooks:  tools/hooks/*.js e *.sh     → ~/.claude/hooks/
//   2. Skills: src/skills-lib/<id>/        → ~/.claude/skills/<id>/
//      (apenas skills que JÁ existem no destino — sync-global não instala
//       skill nova, e sync-check só compara o que já está instalado)

import fs from 'node:fs';
import path from 'node:path';

/** Diretório de origem dos hooks, dentro do repo. */
export function hooksSrcDir(repoRoot) {
  return path.join(repoRoot, 'tools', 'hooks');
}

/** Diretório de origem das skills, dentro do repo. */
export function skillsSrcDir(repoRoot) {
  return path.join(repoRoot, 'src', 'skills-lib');
}

/**
 * Lista os arquivos de hook na origem (tools/hooks/*.js e *.sh).
 * Retorna nomes de arquivo (não paths completos).
 */
export function listHookFiles(repoRoot) {
  const src = hooksSrcDir(repoRoot);
  if (!fs.existsSync(src)) return [];
  return fs.readdirSync(src).filter((f) => f.endsWith('.js') || f.endsWith('.sh'));
}

/**
 * Lista os ids de skill na origem (src/skills-lib/<id>/ com SKILL.md —
 * exclui pastas auxiliares como references/ que não são skills em si).
 */
export function listSkillIds(repoRoot) {
  const src = skillsSrcDir(repoRoot);
  if (!fs.existsSync(src)) return [];
  return fs.readdirSync(src).filter((id) => {
    const dir = path.join(src, id);
    return fs.statSync(dir).isDirectory() && fs.existsSync(path.join(dir, 'SKILL.md'));
  });
}
