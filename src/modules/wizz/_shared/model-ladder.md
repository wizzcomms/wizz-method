# Escada de Modelos

Os nomes `wizz-exec-haiku`/`wizz-exec-sonnet`/`wizz-exec-opus` são nomes de DEGRAU, não do modelo subjacente: em outras plataformas o modelo por trás muda, o nome do degrau fica.

## Tabela de degraus

| Degrau | Subagente | Uso | Claude Code | Codex | OpenCode | Gemini CLI |
|---|---|---|---|---|---|---|
| Mecânico | `wizz-exec-haiku` | varredura, rename, diff repetitivo, mudança 100% especificada | haiku | gpt-5.6-luna (effort low) | anthropic/claude-haiku-4-5 | gemini-3-flash-preview |
| Padrão | `wizz-exec-sonnet` | feature pequena/média definida, bug com causa conhecida, testes | sonnet | gpt-5.6-terra (effort medium) | anthropic/claude-sonnet-5 | gemini-3-flash-preview |
| Forte | `wizz-exec-opus` | bug sem causa clara, refactor cruzando módulos, decisão técnica local | opus | gpt-5.6 (effort high) | anthropic/claude-opus-5 | gemini-3-pro-preview |
| Sessão | `wizz-exec-review` | review de diff, arbitragem, arquitetura local | inherit | sem model (usa `default_subagent_model`) | sem model (herda a sessão) | sem model (herda a sessão) |

## Regras

1. Despacho inicial: o menor degrau que qualifica.
2. Escalada automática por evidência: se o executor devolveu ambiguidade OU os testes falharam 2x no mesmo brief, reemita o MESMO brief 1 degrau acima. Máximo 1 escalada; depois o trabalho volta para a sessão principal.
3. Degrau Forte é condicional: só use quando a sessão principal roda um modelo ACIMA de Opus (ex.: Fable). Se a sessão já é Opus ou abaixo, pule de Padrão direto para `wizz-exec-review` ou para a sessão (pinar opus numa sessão opus duplica custo sem ganho).
4. Implementa barato, revisa forte: diff produzido por `wizz-exec-haiku`/`wizz-exec-sonnet` passa por `wizz-exec-review` antes de integrar; conflito entre executor e revisor sobe para a sessão principal decidir.
5. Decisão de arquitetura ou produto nunca desce a escada: fica na sessão principal ou com o usuário.

Nota final: modelos da tabela conferidos em 2026-08-20 nas docs oficiais de cada plataforma. Se seu plano usar outros modelos, edite os arquivos instalados (`.claude/agents/`, `.codex/agents/`, `.opencode/agents/`, `.gemini/agents/`).
