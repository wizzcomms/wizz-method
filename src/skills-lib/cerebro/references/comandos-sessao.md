# Comandos de Sessão: /iniciar, /ver, /salvar

Carregue este arquivo ao executar `/iniciar`, `/ver` ou `/salvar`. Antes de tudo, releia a REGRA DE OURO e a seção Vault no SKILL.md principal — esses comandos dependem delas.

## /iniciar

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

## /ver

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

## /salvar

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
- Isso captura: Última sessão, Onde parou, O que falta, tabela Sessões

**3. Construir as alterações na memória, depois aplicar (Edits atômicos)**

Em `projetos/[nome].md`, **sobrescrever** o bloco "Última sessão" que fica ACIMA da seção "Onde parou" (criar se não existir). Máximo 3 bullets, sempre o mesmo cabeçalho, sem empilhar blocos antigos:
```markdown
## Última sessão ([data])
- [o que foi feito]
- [o que travou, se travou]
- [próximo passo óbvio]
```

Substituir "Onde parou" e "O que falta" com o estado novo.

Adicionar 1 linha na tabela Sessões (append na última linha da tabela) — é ela que guarda o histórico, o bloco acima é só o detalhe da vez:
```markdown
| [data] | [resumo 1 linha] |
```

**4. Atualizar bloco do projeto em CEREBRO.md (1 Edit)**
- Usar grep do passo 1 para saber as linhas exatas
- Edit cirúrgico apenas nas linhas "Última sessão" e "Pendente"

**5. Atualizar CONTEXT.md (Edit cirúrgico — só campos alterados)**
- Nunca reescrever o arquivo inteiro
- Editar apenas: data no cabeçalho, pendências em "O que falta", commit hash se mudou

**6. Se houve decisão relevante:** criar arquivo em `_decisions/` (Write direto, sem Read prévio).
Aprendizado técnico (armadilha de stack, bug não óbvio, pegadinha de ambiente) **não vai para o vault**: vai para a auto-memória do agente, que é carregada sozinha no início de cada sessão. No vault ninguém lia.

**7. Higiene do índice (compactação)**
```bash
wc -l "$VAULT/CEREBRO.md"
```
- Se > 150 linhas: mover o conteúdo mais antigo/menos essencial (projeto ✅ concluído ou ❌ descontinuado com histórico longo, ou entradas de "Decisões recentes" além das ~15 mais novas) para `_index/cerebro-archive.md`, deixando no lugar só 1 linha de referência `[[_index/cerebro-archive]]`. Nunca apagar, só mover.
- Se ≤ 150 linhas: pular este passo.

```bash
grep -c "^| " "$VAULT/projetos/$PROJ.md"
```
- Tabela Sessões com mais de 15 linhas: mover as mais antigas para `_index/cerebro-archive.md`, sob `## Sessões antigas — [projeto]`, deixando as 15 mais novas no arquivo do projeto. Nunca apagar, só mover.

**8. Confirmar em 2 linhas** o que foi salvo.
