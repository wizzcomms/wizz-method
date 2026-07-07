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

const IGNORE_TOKENS = new Set(['all', 'any', 'bmm', 'core', 'darwin-arm64', 'gsd:map-codebase', 'superpowers:systematic-debugging']);

const VALID_NON_SKILL_TOKENS = new Set([
  'arcads',
  'buttercut',
  'claude-video',
  'context7',
  'distribb',
  'exa',
  'graphify',
  'hyperframes',
  'magic',
  'meta-ads',
  'mcp-meta-ads',
  'rtk',
  'scrapling',
  'supabase',
  'voicebox',
  'wizz-init',
  'wizz-method',
]);

function walkFiles(root) {
  const fullRoot = path.join(PROJECT_ROOT, root);
  if (!fs.existsSync(fullRoot)) return [];
  const stat = fs.statSync(fullRoot);
  if (stat.isFile()) return [fullRoot];

  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && SCAN_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(full);
      }
    }
  };
  walk(fullRoot);
  return files;
}

function offsetToLine(content, offset) {
  return content.slice(0, offset).split('\n').length;
}

function rel(file) {
  return path.relative(PROJECT_ROOT, file);
}

function parseFrontmatter(content) {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith('---')) return null;
  const end = trimmed.indexOf('\n---\n', 3);
  if (end === -1) return null;
  try {
    return yaml.parse(trimmed.slice(3, end));
  } catch {
    return null;
  }
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
        const fm = parseFrontmatter(fs.readFileSync(skillPath, 'utf8'));
        if (fm && typeof fm.name === 'string') ids.add(fm.name);
      }
      scan(full);
    }
  };
  scan(SRC_DIR);
  return ids;
}

function collectRegistryIds() {
  const ids = {
    agents: new Set(),
    skills: new Set(),
    tools: new Set(VALID_NON_SKILL_TOKENS),
  };
  const registryPath = path.join(PROJECT_ROOT, 'skills-registry.yaml');
  if (!fs.existsSync(registryPath)) return ids;

  const registry = yaml.parse(fs.readFileSync(registryPath, 'utf8'));
  for (const area of Object.values(registry.areas || {})) {
    if (area && area.agent) ids.agents.add(area.agent);
    for (const skill of area.skills || []) if (skill.id) ids.skills.add(skill.id);
    for (const cli of area.clis || []) if (cli.id) ids.tools.add(cli.id);
    for (const mcp of area.mcps || []) if (mcp.id) ids.tools.add(mcp.id);
  }
  for (const section of ['utility', 'mcp_utility', 'cli_utility']) {
    for (const item of registry[section] || []) if (item.id) ids.tools.add(item.id);
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

  const files = SCAN_ROOTS.flatMap(walkFiles);
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

main();
