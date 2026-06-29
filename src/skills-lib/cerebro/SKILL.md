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

---

## REGRA DE OURO — Mínimo de tokens em toda operação

**Nunca leia um arquivo grande inteiro. Sempre grep primeiro, depois Read com offset+limit.**

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
- `_decisions/`, `_learnings/`, `_content/` — Write direto, sem ler arquivo existente.

---

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

---

## Estrutura do vault

```
[Vault]/
  CEREBRO.md              ← índice central (identidade + projetos ativos — manter < 150 linhas úteis)
  _index/
    sessions.md           ← log histórico de sessões (append-only, nunca lido)
  _knowledge/
    about-me.md
    goals.md
  _decisions/             ← YYYY-MM-DD-[slug].md
  _learnings/             ← YYYY-MM-DD-[slug].md
  _content/               ← YYYY-MM-DD-[slug].md
  _prospects/             ← YYYY-MM-DD-[slug].md
  projetos/
    [nome].md             ← estado atual do projeto (estrutura: cabeçalho + stack + Hoje + Onde parou + O que falta + Sessões)
```

**Regra de links:** sempre wiki-links `[[arquivo]]` dentro do vault. CONTEXT.md usa Markdown puro.

---

## Comandos

---

### /salvar

**Objetivo:** fechar sessão, persistir o que aconteceu. Máximo de tokens: ~800 input + edits.

**Passos (executar em ordem, sem desvios):**

**1. Localizar projeto e bloco no CEREBRO.md (1 bash call)**
```bash
VAULT=~/Documents/projects/Obsidian\ Vault
PROJ=construcao   # inferir do diretório atual ou contexto
grep -n "### \|Última sessão\|Pendente" "$VAULT/CEREBRO.md" | grep -A2 -i "$PROJ"
wc -l "$VAULT/projetos/$PROJ.md"
```

**2. Ler apenas o final do arquivo do projeto (1 Read)**
- `offset = (total_linhas - 80)`, `limit = 80`
- Isso captura: Hoje atual, Onde parou, O que falta, tabela Sessões

**3. Construir as alterações na memória, depois aplicar (Edits atômicos)**

Em `projetos/[nome].md`, sempre adicionar ACIMA da seção "Onde parou" existente:
```markdown
## Hoje ([data] — [sessão])
- [item 1]
- [item 2]
```

Substituir "Onde parou" e "O que falta" com o estado novo.

Adicionar linha na tabela Sessões (append na última linha da tabela).

**4. Atualizar bloco do projeto em CEREBRO.md (1 Edit)**
- Usar grep do passo 1 para saber as linhas exatas
- Edit cirúrgico apenas nas linhas "Última sessão" e "Pendente"

**5. Atualizar CONTEXT.md (Edit cirúrgico — só campos alterados)**
- Nunca reescrever o arquivo inteiro
- Editar apenas: data no cabeçalho, pendências em "O que falta", commit hash se mudou

**6. Append em `_index/sessions.md` (1 Edit ou Write se não existir)**
```markdown
| [data] | [projeto] | [resumo 1 linha] |
```

**7. Se houve decisão ou aprendizado relevante:** criar arquivo em `_decisions/` ou `_learnings/` (Write direto, sem Read prévio).

**8. Confirmar em 2 linhas** o que foi salvo.

---

### /ver

**Objetivo:** mostrar estado atual rápido. Máximo: 1 Read.

**Passos:**
1. `wc -l "$VAULT/projetos/$PROJ.md"` → total de linhas
2. Read com `offset=(n-60)`, `limit=60` → pega Onde parou + O que falta + Sessões
3. Retornar em formato condensado:

```
## [Projeto] — [data última sessão]
Stack: [1 linha]
Onde parou: [bullets]
O que falta: [checkboxes]
Última sessão: [1 linha]
```

---

### /dia

**Objetivo:** briefing de início do dia. Ler apenas o essencial de cada projeto ativo.

**Passos:**
1. `grep -A4 "### " "$VAULT/CEREBRO.md"` → lista todos os blocos de projeto (nome + última sessão + pendente)
2. Para cada projeto com status ativo (🟢🟡): tail-read de 30 linhas (`offset=n-30`)
3. Montar briefing consolidado
4. Não ler `_knowledge/goals.md` a menos que o usuário peça explicitamente

**Formato de saída:**
```
## Briefing — [data]

**[Projeto]** — [emoji status]
↳ Última sessão: [data] — [resumo]
↳ Pendente: [items]

**Foco sugerido:** [1-2 linhas]
```

---

### /dump

**Objetivo:** captura rápida. Zero reads.

**Passos:**
1. Receber o conteúdo (do argumento ou perguntar em 1 mensagem)
2. Classificar: ideia / aprendizado / decisão / referência / conteúdo
3. Write direto no arquivo certo — sem ler nada antes
4. `grep -n "## Conteúdo em aberto\|## Aprendizados" "$VAULT/CEREBRO.md"` → achar linha para Edit de 1 linha
5. Confirmar em 1 linha

---

### /decisao

**Objetivo:** registrar decisão. Zero reads de arquivos existentes.

**Passos:**
1. Receber descrição + alternativas + projeto (perguntar tudo de uma vez se não passado)
2. Write direto em `_decisions/YYYY-MM-DD-[slug].md` (template abaixo)
3. `grep -n "## Decisões recentes" "$VAULT/CEREBRO.md"` → linha
4. Edit para inserir referência wiki-link logo abaixo dessa linha
5. Se há projeto: `grep -n "## Decisões" "$VAULT/projetos/$PROJ.md"` → Edit 1 linha

**Template `_decisions/YYYY-MM-DD-[slug].md`:**
```markdown
# [Título]
> Data: [data] | Projeto: [[projetos/nome]] | Status: ativa

## Decisão
[1-2 linhas]

## Contexto
[por que foi necessária]

## Alternativas
- [A] — descartada: [motivo]
- [B] — descartada: [motivo]

## Raciocínio
[por que esta]

## Consequências
[o que muda]
```

---

### /conteudo

**Objetivo:** capturar ideia de conteúdo. Zero reads.

**Passos:**
1. Receber ideia + plataforma + formato + gancho + CTA (perguntar tudo de uma vez)
2. Write direto em `_content/YYYY-MM-DD-[slug].md`
3. `grep -n "## Conteúdo em aberto" "$VAULT/CEREBRO.md"` → Edit 1 linha abaixo

**Template `_content/YYYY-MM-DD-[slug].md`:**
```markdown
# [Título]
> Data: [data] | Plataforma: [plataforma] | Status: ideia

## Ideia
[1-3 linhas]

## Formato / Gancho / CTA
- Formato: [tipo]
- Gancho: [o que torna diferente]
- CTA: [ação / objetivo]

## Rascunho
[espaço livre]
```

---

### /prospect

**Objetivo:** pesquisar e registrar prospect.

**Passos:**
1. Receber nome/empresa + objetivo (tudo de uma vez)
2. Pesquisar via web search (setor, presença digital, dores, oportunidades)
3. Write direto em `_prospects/YYYY-MM-DD-[slug].md`
4. Resumo executivo para o usuário (não precisa estar no arquivo)

**Template `_prospects/YYYY-MM-DD-[slug].md`:**
```markdown
# [Nome / Empresa]
> Data: [data] | Objetivo: [tipo] | Status: pesquisado

## Perfil
- Setor / Tamanho / Produto / Público-alvo

## Presença digital
- Site / Redes / Ads ativos

## Oportunidade e ângulo de abordagem
[o que oferecer e como entrar]

## Próximo passo
- [ ] [ação]
```

---

### /sync

**Objetivo:** espelhar CONTEXT.md → vault após sessão no Codex.

**Passos:**
1. Read `CONTEXT.md` no diretório atual (arquivo pequeno — OK ler completo)
2. `wc -l "$VAULT/projetos/$PROJ.md"` → tail Read das últimas 60 linhas
3. Identificar diferenças em: estado atual, pendências, decisões
4. Edit cirúrgico em `projetos/[nome].md` (só seções alteradas)
5. `grep -n "Última sessão\|Pendente" "$VAULT/CEREBRO.md" | grep -i "$PROJ"` → Edit linha
6. Append linha em `_index/sessions.md`
7. Confirmar em 2 linhas

---

### /iniciar

**Objetivo:** configurar projeto novo. Só cria arquivos — não lê nada além do CEREBRO.md mínimo.

**Passos:**
1. Descobrir vault (ver seção Vault)
2. `grep -c "$PROJ" "$VAULT/CEREBRO.md"` → verificar se projeto já existe (0 = novo)
3. Se novo: entrevistar em 1 mensagem (organização, info essencial, estilo, modo)
4. Write `projetos/[nome].md` com template
5. `grep -n "## Projetos" "$VAULT/CEREBRO.md"` → Edit para inserir entrada
6. Confirmar

**Template `projetos/[nome].md`:**
```markdown
# [Nome] — Estado Atual
> Atualizado: [data]

## Preferências
- Organização: [resposta]
- Info essencial: [resposta]
- Estilo: [resposta]
- Modo: [registro / sugestivo]

## Stack
[breve descrição]

## Onde parou
-

## O que falta
- [ ]

## Sessões
| Data | Resumo |
|------|--------|
|      |        |
```

**Template bloco em CEREBRO.md:**
```markdown
### [Nome] [emoji]
- **Stack:** [stack]
- **Última sessão:** [data] — [resumo]
- **Pendente:** [pendências]
- **Estado atual:** [[projetos/nome]]
```

---

## Regras gerais

- Wiki-links `[[arquivo]]` dentro do vault. Markdown puro no CONTEXT.md.
- Datas absolutas (ex: "Apr 23 2026") — nunca relativas.
- Nunca apagar histórico — só acrescentar.
- Log histórico de sessões vai em `_index/sessions.md`, não no CEREBRO.md — mantém o CEREBRO.md curto.
- Resumos: 1 linha por item.
- CEREBRO.md deve ficar sempre < 150 linhas úteis — mover tabelas longas para `_index/`.
