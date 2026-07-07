/**
 * security-defensive-context.js
 *
 * Fonte de verdade: wizz-method/tools/hooks/. Instalar via `npm run sync:global`.
 *
 * Hook PreToolUse: quando o usuário invoca uma skill de segurança, injeta
 * instruções de metodologia que orientam o modelo a trabalhar de forma
 * defensiva, escopada e por dimensão — evitando o padrão de varredura ampla
 * que aciona os safeguards de cibersegurança da Anthropic.
 *
 * v2 (2026-07): contexto genérico por projeto (a v1 hardcodava o stack do MeJu
 * e injetava esse contexto em QUALQUER projeto).
 *
 * IMPORTANTE: guia o COMPORTAMENTO DO MODELO (abordagem + metodologia). Não
 * desativa nem bypassa o safeguard da Anthropic — isso é impossível por hook.
 */

const SECURITY_SKILLS = new Set([
  // Skills globais instaladas em ~/.claude/skills/
  'web-security',
  'desktop-security',
  // Skills providas por plugins (nomes canônicos verificados)
  'security-review',
  'security-reviewer',
  'security-scan',
  // code-review em variantes de plugin e direto
  'code-review',
  'code-review:code-review',
]);

const DEFENSIVE_CONTEXT =
  'Metodologia de revisao de seguranca (defensiva, escopada):\n\n' +
  '1. ESCOPO: trabalhe por arquivo ou dimensao concreta de cada vez (ex: validacao ' +
  'de entrada num handler, politicas de acesso do banco, headers HTTP). Nunca ' +
  'varredura ampla de todo o codebase num turno unico.\n\n' +
  '2. FOCO DEFENSIVO: o objetivo e hardening do codigo do proprio projeto. Cada ' +
  'achado deve mapear para uma linha/arquivo real e propor a correcao aplicada localmente.\n\n' +
  '3. DIMENSOES PRIORITARIAS (adapte ao stack do projeto atual): (a) auth/sessao; ' +
  '(b) validacao/allowlist de entrada em handlers de escrita; (c) autorizacao no ' +
  'banco (RLS/policies) e funcoes privilegiadas; (d) privacidade LGPD/GDPR — PII, ' +
  'consentimento, retencao; (e) secrets — nada hardcoded em settings/migrations/logs; ' +
  '(f) superficie publica — rate-limit, headers de seguranca, CORS.\n\n' +
  '4. OUTPUT: achados por severidade (CRITICO / ALTO / MEDIO / BAIXO), com arquivo + ' +
  'linha + codigo corrigido sugerido. Nao gerar relatorio ofensivo nem exploits.';

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(raw);
    const toolName = payload.tool_name || '';
    const skillName = (payload.tool_input && payload.tool_input.skill) || '';

    if (toolName === 'Skill' && SECURITY_SKILLS.has(skillName)) {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            additionalContext: DEFENSIVE_CONTEXT,
          },
        }),
      );
    }
    // Para qualquer outra skill/tool: sai silenciosamente sem output
  } catch {
    // Parse error: sai silenciosamente, nao bloqueia nada
  }
  process.exit(0);
});
