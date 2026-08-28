# Hooks (fonte de verdade)

Os hooks do Claude Code usados pelo Wizz Method vivem AQUI e são instalados em
`~/.claude/hooks/` via `npm run sync:global`. Nunca edite a cópia global direto:
ela é substituída no próximo sync.

| Hook                            | Evento             | O que faz                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wizz-router-enforce.js`        | UserPromptSubmit   | Gate `isTrivial()` + injeção curta: em projeto Wizz (`_wizz/`) manda delegar direto ao maestro/agente da área (sem router); fora, manda pro `wizz-router`.                                                                                                                                                                                                                                                                          |
| `session-rules.js`              | SessionStart       | Duas coisas num processo só: injeta as regras de comunicação 1x por sessão (antes era por prompt) e resolve a FEATURE ATIVA sozinho (branch git > `_wizz/bmm/config.yaml` > nada), para ninguém precisar invocar `wizz-set-feature`. Branch de tronco e de release não viram feature; sem feature a linha não é emitida (custo zero). A feature também é o `tema` da memória. |
| `security-defensive-context.js` | PreToolUse (Skill) | Metodologia defensiva/escopada ao invocar skills de segurança. Genérico por projeto (v2).                                                                                                                                                                                                                                                                                                                                           |
| `rtk-rewrite.sh`                | PreToolUse (Bash)  | Reescreve comandos de shell via `rtk rewrite` (token economy). Fork local do hook gerado pelo instalador upstream do rtk, com 2 patches (auditoria 2026-07-07, C4/RT1): reescrita linha a linha em comando multi-linha (o binário só reescrevia a 1ª linha) e timeout interno por linha (`RTK_HOOK_TIMEOUT`, default 3s) que não depende do `timeout`/`gtimeout` do GNU coreutils. Requer `rtk` + `jq` no PATH; fail-open em ambos. |

Removidos em 2026-07 (arquivados em `~/.claude/hooks-archive/`):
`no-narration-enforce.js` (absorvido pelo session-rules) e `vault-reminder.js`.

Testes: `npm run test:hooks` (isTrivial + contexto por modo), `npm run test:feature-context` (resolução da feature ativa: tronco não vira feature, branch ganha do config, silêncio quando não há feature) e `node test/test-rtk-hook.js` (rewrite básico + multi-linha do `rtk-rewrite.sh`, smoke test que exercita o binário `rtk` real quando disponível).
Evals de roteamento: `node evals/routing/run-routing-eval.mjs [--llm]`.

Drift repo ↔ global: `npm run sync:check` compara hash de cada hook (e skill) entre o repo e `~/.claude`, sem escrever nada — é lembrete (fail-open), não gate; roda no fim do `npm test`. Achou drift? `npm run sync:global` atualiza `~/.claude`.
