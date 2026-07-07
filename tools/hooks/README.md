# Hooks (fonte de verdade)

Os hooks do Claude Code usados pelo Wizz Method vivem AQUI e são instalados em
`~/.claude/hooks/` via `npm run sync:global`. Nunca edite a cópia global direto:
ela é substituída no próximo sync.

| Hook                            | Evento             | O que faz                                                                                                                                                  |
| ------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wizz-router-enforce.js`        | UserPromptSubmit   | Gate `isTrivial()` + injeção curta: em projeto Wizz (`_wizz/`) manda delegar direto ao maestro/agente da área (sem router); fora, manda pro `wizz-router`. |
| `session-rules.js`              | SessionStart       | Injeta as regras de comunicação 1x por sessão (antes era por prompt).                                                                                      |
| `security-defensive-context.js` | PreToolUse (Skill) | Metodologia defensiva/escopada ao invocar skills de segurança. Genérico por projeto (v2).                                                                  |

Removidos em 2026-07 (arquivados em `~/.claude/hooks-archive/`):
`no-narration-enforce.js` (absorvido pelo session-rules) e `vault-reminder.js`.

Testes: `npm run test:hooks` (isTrivial + contexto por modo).
Evals de roteamento: `node evals/routing/run-routing-eval.mjs [--llm]`.
