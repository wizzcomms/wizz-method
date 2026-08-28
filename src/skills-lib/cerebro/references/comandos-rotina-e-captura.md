# Comandos de Rotina e Captura: /dia, /dump, /decisao, /conteudo

Carregue este arquivo ao executar `/dia`, `/dump`, `/decisao` ou `/conteudo`. Antes de tudo, releia a REGRA DE OURO e a seção Vault no SKILL.md principal — esses comandos dependem delas.

## /dia

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

## /dump

**Objetivo:** captura rápida. Zero reads.

**Passos:**
1. Receber o conteúdo (do argumento ou perguntar em 1 mensagem)
2. Classificar: ideia / aprendizado / decisão / referência / conteúdo
3. Write direto no arquivo certo — sem ler nada antes
4. `grep -n "## Conteúdo em aberto\|## Aprendizados" "$VAULT/CEREBRO.md"` → achar linha para Edit de 1 linha
5. Confirmar em 1 linha

## /decisao

**Objetivo:** registrar decisão. 1 grep antes, nenhum Read.

**Passos:**
1. Receber descrição + alternativas + projeto (perguntar tudo de uma vez se não passado)
2. **Grep antes de gravar** (obrigatório, 1 bash call):

```bash
grep -ril "<2 ou 3 palavras do tema>" "$VAULT/_decisions/" | head -5
```

- Achou decisão sobre o mesmo tema: **não crie arquivo novo**. Abra o que existe e decida entre dois caminhos:
  - a decisão nova **substitui** a antiga → marque a antiga com `status: superseded` e `supersedida_por: <slug novo>`, e crie a nova com `supersede: <slug antigo>`
  - a decisão nova **detalha** a antiga → edite a antiga, não crie a segunda
- Não achou nada: siga para o passo 3.

3. Write direto em `_decisions/YYYY-MM-DD-[slug].md` (template abaixo)
4. `grep -n "## Decisões recentes" "$VAULT/CEREBRO.md"` → linha
5. Edit para inserir referência wiki-link logo abaixo dessa linha
6. Se há projeto: `grep -n "## Decisões" "$VAULT/projetos/$PROJ.md"` → Edit 1 linha

**Template `_decisions/YYYY-MM-DD-[slug].md`:**
```markdown
---
data: YYYY-MM-DD
projeto: [nome]
tema: [2 a 4 palavras-chave separadas por vírgula, é por elas que o grep acha]
status: ativa
supersede: [slug da decisão que esta substitui, ou omitir]
supersedida_por: [preenchido depois, quando outra decisão substituir esta]
---

# [Título]

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

## /conteudo

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
