# Comandos de Sessão: /iniciar, /ver, /salvar

Carregue este arquivo ao executar `/iniciar`, `/ver` ou `/salvar`. Antes de tudo, releia a REGRA DE OURO e a seção Vault no SKILL.md principal — esses comandos dependem delas.

## O bloco Estado

Todo arquivo em `projetos/` começa com um bloco `## Estado` de no **máximo 12 linhas**, logo abaixo do título. Ele é sobrescrito a cada `/salvar` e é a única coisa que o `/ver` precisa ler.

```markdown
## Estado
- **Fase:** [em que ponto o projeto está, 1 linha]
- **Stack:** [1 linha]
- **Onde parou:** [1 linha]
- **Próximo passo:** [1 linha, a primeira coisa a fazer ao voltar]
- **Bloqueio:** [1 linha, ou "nenhum"]
- **Última sessão:** [YYYY-MM-DD] — [1 linha]
```

Por que 12 linhas: o `/ver` vira 1 Read de 14 linhas em vez de um tail de 60. E o bloco fica no topo, onde qualquer humano abrindo a nota também lê primeiro.

O que **não** entra no bloco: histórico, decisão, aprendizado, lista longa de pendências. Histórico é a tabela `Sessões`; decisão é `_decisions/`; aprendizado é a auto-memória do agente; a lista completa de pendências é a seção `O que falta`.

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

## Estado
- **Fase:** [fase]
- **Stack:** [stack]
- **Onde parou:** [1 linha]
- **Próximo passo:** [1 linha]
- **Bloqueio:** nenhum
- **Última sessão:** [data] — [1 linha]

## Preferências
- Organização: [resposta]
- Info essencial: [resposta]
- Estilo: [resposta]
- Modo: [registro / sugestivo]

## Contexto
[o que o bloco Estado não cabe: stack detalhada, restrições, links]

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

**Objetivo:** mostrar estado atual rápido. Máximo: 1 Read de 14 linhas.

**Passos:**

1. Read `projetos/[nome].md` com `limit=14` (o bloco Estado está no topo)
2. Devolver o bloco quase como está, sem reescrever

**Arquivo antigo, sem bloco Estado no topo:** cai no caminho lento uma única vez — `wc -l` e Read das últimas 60 linhas — e ao devolver, ofereça criar o bloco. Aceito, o próximo `/ver` volta a custar 1 Read curto.

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

**2. Ler o topo e o fim do arquivo do projeto (2 Reads curtos)**

- topo: `limit=14` → bloco Estado
- fim: `offset = (total_linhas - 40)`, `limit = 40` → O que falta e tabela Sessões

**3. Construir as alterações na memória, depois aplicar (Edits atômicos)**

Em `projetos/[nome].md`:

- **Sobrescrever o bloco `## Estado`** inteiro, mantendo os mesmos 6 campos e o teto de 12 linhas. Não empilhar bloco novo: o histórico é a tabela.
- Atualizar a seção `O que falta` (marcar o que saiu, acrescentar o que entrou).
- Acrescentar 1 linha ao fim da tabela `Sessões`:

```markdown
| [data] | [resumo 1 linha] |
```

Arquivo sem bloco `## Estado`: criar agora, logo abaixo do título, com o que a sessão apurou.

**4. Atualizar bloco do projeto em CEREBRO.md (1 Edit)**

- Usar grep do passo 1 para saber as linhas exatas
- Edit cirúrgico apenas nas linhas "Última sessão" e "Pendente"

**5. Se houve decisão relevante:** criar arquivo em `_decisions/` (ver `comandos-rotina-e-captura.md` para o frontmatter e a regra de grep-antes-de-gravar).
Aprendizado técnico (armadilha de stack, bug não óbvio, pegadinha de ambiente) **não vai para o vault**: vai para a auto-memória do agente. No vault ninguém lia. No Claude Code ela carrega sozinha no início da sessão; em Codex, OpenCode e Gemini o caminho de leitura é o `/memoria` (ver `comandos-pesquisa-e-memoria.md`).

**6. Higiene do índice (compactação)**

```bash
wc -l "$VAULT/CEREBRO.md"
```

- Se > 150 linhas: mover o conteúdo mais antigo/menos essencial (projeto ✅ concluído ou ❌ descontinuado com histórico longo, ou entradas de "Decisões recentes" além das ~15 mais novas) para `_index/cerebro-archive.md`, deixando no lugar só 1 linha de referência `[[_index/cerebro-archive]]`. Nunca apagar, só mover.
- Se ≤ 150 linhas: pular este passo.

```bash
grep -c "^| " "$VAULT/projetos/$PROJ.md"
```

- Tabela Sessões com mais de 15 linhas: mover as mais antigas para `_index/cerebro-archive.md`, sob `## Sessões antigas — [projeto]`, deixando as 15 mais novas no arquivo do projeto. Nunca apagar, só mover.

**7. Confirmar em 2 linhas** o que foi salvo.
