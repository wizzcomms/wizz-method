---
name: cerebro
description: >
  Sistema de memória persistente entre sessões de AI. Use esta skill sempre que o usuário digitar
  /iniciar, /salvar, /ver, /dia, /dump, /decisao, /conteudo, /prospect ou /sync. Também ative quando o
  usuário mencionar "cerebro", "atualizar o cerebro", "salvar sessão", "resumo do projeto",
  "estado atual", "registrar decisão", "ideia de conteúdo", "pesquisar prospect" ou "sincronizar vault".
  Esta skill mantém CEREBRO.md como índice central e arquivos por projeto — é a memória do
  usuário entre Claude Code, Codex e qualquer outro agente.
  CONTEXT.md no repo é o espelho do vault para agentes cloud (Codex). Fluxo: Codex atualiza
  CONTEXT.md → usuário roda /sync no Claude Code → vault atualizado.
  Use quando o usuário digitar um desses comandos de barra ou mencionar memória, sessão,
  decisão, ideia de conteúdo, prospect ou sincronização do cérebro.
---

# Cérebro — Sistema de Memória Persistente

## Grupos de comandos

```
Sessão:    /iniciar  /salvar  /ver
Rotina:    /dia
Captura:   /dump  /decisao  /conteudo
Pesquisa:  /prospect
Sync:      /sync
```

## REGRA DE OURO — Mínimo de tokens em toda operação

**Nunca leia um arquivo grande inteiro. Sempre grep primeiro, depois Read com offset+limit.** Isso vale para TODO comando abaixo, mesmo quando o arquivo de referência específico do comando não repetir a regra.

```
# Padrão obrigatório antes de qualquer Read:
grep -n "padrão" arquivo.md          # → encontra linhas relevantes
wc -l arquivo.md                     # → total de linhas
Read offset=(linha-5) limit=15       # → lê só o trecho necessário
```

**Orçamento por comando:**
| Comando  | Reads máximos | Edits máximos |
|----------|--------------|---------------|
| /salvar  | 2            | 3             |
| /ver     | 1            | 0             |
| /dia     | 1 por projeto ativo | 0    |
| /dump    | 0            | 1             |
| /decisao | 0            | 2             |
| /sync    | 2            | 3             |

**Regras de leitura por arquivo:**
- `CEREBRO.md` — **nunca Read completo**. Grep para achar o bloco do projeto (5–8 linhas), Edit direto.
- `projetos/[nome].md` — Read das **últimas 80 linhas** (tail). Sessões e estado atual ficam no final.
- `CONTEXT.md` — Edit cirúrgico nos campos alterados. Nunca reescrever completo.
- `_decisions/`, `_content/` — Write direto, sem ler arquivo existente.

## Vault

Vault padrão conhecido: `~/Documents/projects/Obsidian Vault/`

**Como descobrir:**
1. Tentar `~/Documents/projects/Obsidian Vault/CEREBRO.md` — se existir, usar.
2. Se não: `find ~ -name "CEREBRO.md" -maxdepth 6 2>/dev/null | head -1`
3. Se ainda não: perguntar ao usuário.

**Nunca use Read no CEREBRO.md inteiro para achar o vault path** — use grep:
```bash
grep -m1 "^vault:" "/caminho/CEREBRO.md"
```

## Estrutura do vault

```
[Vault]/
  CEREBRO.md              ← índice central (identidade + projetos ativos — manter < 150 linhas úteis)
  _index/
    cerebro-archive.md    ← excedente do CEREBRO.md movido na compactação do /salvar (grep, nunca Read completo)
  _knowledge/
    about-me.md
    goals.md
  _decisions/             ← YYYY-MM-DD-[slug].md
                            (não existe mais `_learnings/`: era escrito e nunca
                             lido por nenhum comando, e foi removido em 2026-08-28.
                             Armadilha de stack e bug não óbvio vão para a
                             auto-memória do agente, que carrega sozinha.)
  _content/               ← YYYY-MM-DD-[slug].md
  _prospects/             ← YYYY-MM-DD-[slug].md
  projetos/
    [nome].md             ← estado atual do projeto (estrutura: cabeçalho + stack + Última sessão + Onde parou + O que falta + Sessões)
```

**Regra de links:** sempre wiki-links `[[arquivo]]` dentro do vault. CONTEXT.md usa Markdown puro.

## Comandos (load on demand)

Cada comando tem seu procedimento passo-a-passo completo em um arquivo de referência. Carregue só o arquivo do grupo do comando que o usuário disparou:

- `references/comandos-sessao.md` — `/iniciar` (configurar projeto novo), `/ver` (estado atual rápido), `/salvar` (fechar sessão) com passos, orçamento de tokens e templates completos.
- `references/comandos-rotina-e-captura.md` — `/dia` (briefing do dia), `/dump` (captura rápida), `/decisao` (registrar decisão), `/conteudo` (ideia de conteúdo) com passos e templates completos.
- `references/comandos-pesquisa-e-sync.md` — `/prospect` (pesquisar prospect) e `/sync` (espelhar CONTEXT.md → vault) com passos e templates completos.

## Regras gerais

- Wiki-links `[[arquivo]]` dentro do vault. Markdown puro no CONTEXT.md.
- Datas absolutas no formato `YYYY-MM-DD`, nunca relativas ("ontem", "semana passada"). Fatos voláteis (versão publicada, estado de release, etc.) levam prefixo `em YYYY-MM-DD:` no texto; na releitura, o agente trata como snapshot daquele momento, não como fato atual.
- Nunca apagar histórico — só acrescentar.
- Narrativa de sessão mora no arquivo do projeto: bloco `Última sessão` (sobrescrito) + 1 linha na tabela `Sessões`. Não existe mais `_index/sessions.md`: era escrito e nunca lido por nenhum comando, e saiu em 2026-08-28.
- Resumos: 1 linha por item.
- CEREBRO.md deve ficar sempre < 150 linhas úteis — mover tabelas longas para `_index/`.
