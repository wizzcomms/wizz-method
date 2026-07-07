/**
 * Wizz Method Reference Validator
 *
 * Validates human-authored routing references that the generic skill validator
 * cannot see: menu prompts, router tables, agent aliases, and installed file
 * references.
 *
 * Usage:
 *   node tools/validate-method-refs.js
 *   node tools/validate-method-refs.js --strict
 */

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('yaml');
const { walkFiles: libWalkFiles } = require('./lib/walk');
const { parseFrontmatterYaml } = require('./lib/frontmatter');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const STRICT = process.argv.includes('--strict');

const SKIP_DIRS = new Set(['.git', 'node_modules', '.next', 'dist', 'build']);
const SCAN_EXTENSIONS = new Set(['.md', '.mdx', '.toml', '.yaml', '.yml']);

const SCAN_ROOTS = [
  'README.md',
  'docs',
  'skills-registry.yaml',
  'src/modules/wizz',
  'src/skills-lib/wizz-router',
  'src/skills-lib/decision-maker/SKILL.md',
];

// A9 (auditoria 2026-07-07): o scan acima cobria só 2 skills de skills-lib
// (decision-maker, wizz-router), deixando fantasmas de MCP/skill em outros
// SKILL.md (ex.: react-components, find-skills, ui-ux-pro-max) fora do
// alcance do validador. Varre o SKILL.md de toda skill de skills-lib —
// references/assets/evals continuam fora (ruído alto, sem ganho).
function collectSkillLibEntrypoints() {
  const dir = path.join(SRC_DIR, 'skills-lib');
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) continue;
    const skillMd = path.join(dir, entry.name, 'SKILL.md');
    if (fs.existsSync(skillMd)) files.push(skillMd);
  }
  return files;
}

const IGNORE_TOKENS = new Set(['all', 'any', 'bmm', 'core', 'darwin-arm64', 'gsd:map-codebase', 'superpowers:systematic-debugging']);

// M15 (auditoria 2026-07-07): a allowlist de tokens de CLI/MCP era uma lista
// hardcoded (VALID_NON_SKILL_TOKENS) unida aos ids do registry e nunca
// podada — uma CLI removida do registry continuava "válida" para sempre.
// Agora a allowlist deriva do registry em tempo real (collectRegistryIds
// escaneia clis/mcps de cada área + as seções cross-cutting, ver abaixo);
// esta lista extra fica mínima, só para tokens genuinamente citados no
// método que NÃO são um id de CLI/MCP do skills-registry.yaml — cada um
// comentado com o motivo, para não virar de novo uma lista que ninguém poda.
const EXTRA_TOOL_TOKENS = new Set([
  // Skill do harness externo (plugin do usuário) referenciada em prosa; não
  // faz parte deste repo nem do skills-registry.yaml, não há como derivá-la.
  'deep-research',
  // Nome do pacote npm por trás do MCP `meta-ads` (server.args na entrada
  // `meta-ads` do registry), citado por esse nome em docs/comentários — não
  // é o id do registry, é o nome do pacote que ele instala.
  'mcp-meta-ads',
  // Passo do fluxo interno do módulo wizz (README do módulo), não é
  // skill/CLI/MCP do registry.
  'wizz-init',
  // Nome do pacote npm do próprio framework, citado nos docs de instalação
  // (`npx wizz-method install`).
  'wizz-method',
]);

function walkFiles(root) {
  const fullRoot = path.join(PROJECT_ROOT, root);
  return libWalkFiles(fullRoot, { skipDirs: SKIP_DIRS, extensions: SCAN_EXTENSIONS });
}

function offsetToLine(content, offset) {
  return content.slice(0, offset).split('\n').length;
}

function rel(file) {
  return path.relative(PROJECT_ROOT, file);
}

function collectSkillIds() {
  const ids = new Set();
  const scan = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (!entry.isDirectory()) continue;

      const skillPath = path.join(full, 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        ids.add(entry.name);
        const fm = parseFrontmatterYaml(fs.readFileSync(skillPath, 'utf8'));
        if (fm && typeof fm.name === 'string') ids.add(fm.name);
      }
      scan(full);
    }
  };
  scan(SRC_DIR);
  return ids;
}

/**
 * Deriva a allowlist de skills/agents/tools a partir do skills-registry.yaml.
 * Aceita um `registry` já parseado (injeção para teste); por padrão lê e
 * parseia o skills-registry.yaml do repo, comportamento original.
 * @param {Object} [registry] - Registry já parseado (opcional, para teste)
 * @returns {{agents: Set<string>, skills: Set<string>, tools: Set<string>}}
 */
function collectRegistryIds(registry) {
  const ids = {
    agents: new Set(),
    skills: new Set(),
    tools: new Set(EXTRA_TOOL_TOKENS),
  };

  let resolvedRegistry = registry;
  if (!resolvedRegistry) {
    const registryPath = path.join(PROJECT_ROOT, 'skills-registry.yaml');
    if (!fs.existsSync(registryPath)) return ids;
    resolvedRegistry = yaml.parse(fs.readFileSync(registryPath, 'utf8'));
  }

  for (const area of Object.values(resolvedRegistry.areas || {})) {
    if (area && area.agent) ids.agents.add(area.agent);
    for (const skill of area.skills || []) if (skill.id) ids.skills.add(skill.id);
    for (const cli of area.clis || []) if (cli.id) ids.tools.add(cli.id);
    for (const mcp of area.mcps || []) if (mcp.id) ids.tools.add(mcp.id);
  }
  for (const section of ['utility', 'mcp_utility', 'cli_utility']) {
    for (const item of resolvedRegistry[section] || []) if (item.id) ids.tools.add(item.id);
  }
  return ids;
}

function collectModuleAgents() {
  const agents = new Set();
  for (const moduleYaml of ['src/bmm-skills/module.yaml', 'src/modules/wizz/module.yaml']) {
    const full = path.join(PROJECT_ROOT, moduleYaml);
    if (!fs.existsSync(full)) continue;
    const doc = yaml.parse(fs.readFileSync(full, 'utf8'));
    for (const agent of doc.agents || []) if (agent.code) agents.add(agent.code);
  }
  return agents;
}

function isValidReference(token, valid) {
  if (!token || IGNORE_TOKENS.has(token)) return true;
  if (token.startsWith('/')) return true;
  if (token.includes(':')) return true;
  return valid.skills.has(token) || valid.agents.has(token) || valid.tools.has(token);
}

function addFinding(findings, file, line, token, detail) {
  findings.push({ file: rel(file), line, token, detail });
}

function extractRefs(file, content, valid) {
  const findings = [];
  const relativeFile = rel(file);
  const patterns = [
    {
      regex: /skill\s*=\s*"([^"]+)"/g,
      label: 'TOML skill reference',
    },
    {
      regex: /skill GLOBAL '([^']+)'/g,
      label: 'Skill GLOBAL prompt reference',
    },
    {
      regex: /agent:\s*([a-z][a-z0-9-]+)/g,
      label: 'registry agent reference',
    },
  ];

  for (const { regex, label } of patterns) {
    for (const match of content.matchAll(regex)) {
      if (relativeFile.startsWith('docs/') && label !== 'registry agent reference') continue;
      const token = match[1];
      if (!isValidReference(token, valid)) {
        addFinding(
          findings,
          file,
          offsetToLine(content, match.index),
          token,
          `${label} does not resolve to a shipped skill, agent, CLI, or MCP id.`,
        );
      }
    }
  }

  for (const match of content.matchAll(/`([a-z][a-z0-9]+(?:-[a-z0-9]+)+)`/g)) {
    const token = match[1];
    const lineStart = content.lastIndexOf('\n', match.index) + 1;
    const lineEnd = content.indexOf('\n', match.index);
    const line = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd);
    const shouldValidate =
      token.startsWith('wizz-') ||
      relativeFile.startsWith('src/modules/wizz/') ||
      relativeFile.startsWith('src/skills-lib/wizz-router/') ||
      relativeFile === 'src/skills-lib/decision-maker/SKILL.md';
    if (!shouldValidate) continue;
    if (!isValidReference(token, valid)) {
      addFinding(
        findings,
        file,
        offsetToLine(content, match.index),
        token,
        'Backticked method reference does not resolve to a shipped skill, agent, CLI, or MCP id.',
      );
    }
  }

  for (const match of content.matchAll(/\bfile:(src\/[^"'`,)\]\s]+)/g)) {
    addFinding(
      findings,
      file,
      offsetToLine(content, match.index),
      match[1],
      'Installed facts must not point at repo-source paths. Use {skill-root}/... or {project-root}/... instead.',
    );
  }

  return findings;
}

function main() {
  const skillIds = collectSkillIds();
  const registryIds = collectRegistryIds();
  const moduleAgents = collectModuleAgents();
  const valid = {
    skills: new Set([...skillIds, ...registryIds.skills]),
    agents: new Set([...registryIds.agents, ...moduleAgents]),
    tools: registryIds.tools,
  };

  const files = [...new Set([...SCAN_ROOTS.flatMap(walkFiles), ...collectSkillLibEntrypoints()])];
  const findings = [];
  for (const file of files) {
    findings.push(...extractRefs(file, fs.readFileSync(file, 'utf8'), valid));
  }

  if (findings.length === 0) {
    console.log('Wizz method references: OK');
    return;
  }

  console.log(`Wizz method references: ${findings.length} broken reference(s)`);
  for (const finding of findings) {
    console.log(`- ${finding.file}:${finding.line} ${finding.token} — ${finding.detail}`);
  }

  if (STRICT) process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { collectRegistryIds, isValidReference, EXTRA_TOOL_TOKENS };
