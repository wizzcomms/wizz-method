// session-rules.js — SessionStart hook
//
// Fonte de verdade: wizz-method/tools/hooks/. Instalar via `npm run sync:global`.
//
// Injeta as regras de comunicação UMA vez por sessão (antes: no-narration-enforce
// repetia ~80 tokens em TODO prompt via UserPromptSubmit). Mesmo conteúdo, custo
// fixo por sessão em vez de custo por prompt.

const RULES =
  'REGRA DE COMUNICAÇÃO (permanente, não-negociável): não narrar o passo a passo ' +
  'enquanto trabalha; pausar e perguntar SÓ em decisão do usuário ou risco ' +
  'irreversível; fechar SEMPRE com resumo curto em tópicos, linguagem simples, ' +
  'sem jargão; sem em-dashes; comunicação enxuta por default, expandir só sob demanda.';

let input = '';
const stdinTimeout = setTimeout(() => finish(), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  finish();
});

function finish() {
  try {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: RULES,
        },
      }),
    );
  } catch {
    // nunca bloquear
  }
  process.exit(0);
}
