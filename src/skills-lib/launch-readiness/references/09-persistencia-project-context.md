# Passo 09 · Persistência no project-context.md

O resultado da auditoria não fica só na conversa: um resumo persiste no `project-context.md` do projeto, pra qualquer agente (ou humano) que abrir o projeto depois saber, sem re-perguntar, se ele já passou por uma auditoria de lançamento e como ficou.

## Localizar o arquivo

Mesmo padrão fail-open usado pelo router e pelo maestro: `grep -m1 '^stage:' {project-root}/**/project-context.md`.

- **Achou o arquivo:** siga pra "Gravar a seção" abaixo.
- **Não achou:** não bloqueie a entrega do diagnóstico por causa disso. Avise que não existe `project-context.md` pra persistir o resultado, ofereça rodar `wizz-generate-project-context` primeiro (cria o arquivo e o campo `stage:`), e entregue o diagnóstico normalmente mesmo sem persistir.

## Gravar a seção

A seção vive sob o cabeçalho `## Auditoria de Prontidão pra Lançamento`. Ela é SUBSTITUÍDA a cada nova rodada, não é um changelog acumulado: `project-context.md` existe pra ficar enxuto ("lean, LLM-optimized" é o objetivo declarado do próprio template), então o que importa pra um agente lendo depois é o estado ATUAL, não o histórico de rodadas antigas. Se encontrar uma seção com esse cabeçalho já existente, apague o conteúdo antigo e escreva o novo no lugar; não acumule.

Template exato da seção:

```markdown
## Auditoria de Prontidão pra Lançamento

Última rodada: {{YYYY-MM-DD}}. Resultado da skill `launch-readiness`; substitui a rodada anterior (não é histórico).

**Resumo:** 🔴 {{n_bloqueante}} bloqueante(s) · 🟠 {{n_alto}} alto(s) · 🟡 {{n_medio}} médio(s) · 🟢 {{n_ok}} ok

**Recomendação:** {{GO | GO COM RESSALVAS | NO-GO}}

**Bloqueantes abertos (🔴):**
- {{item 1, uma linha}}
- {{item 2, uma linha}}

_Sem bloqueante aberto, escreva "Nenhum bloqueante aberto." em vez da lista._

**Diagnóstico completo** (as 7 tabelas por área) foi entregue na sessão de {{YYYY-MM-DD}}; esta seção é o resumo persistido, não a íntegra.
```

Insira a seção depois de `## Estado do Projeto` e antes de `## Technology Stack & Versions`, seguindo a ordem já usada pelo template (`project-context-template.md`). Se o arquivo tiver uma ordem diferente por já ter sido editado à mão, insira logo após `## Estado do Projeto`.

## Atualizar o estágio (stage:)

O campo `stage:` no frontmatter (`prototype|mvp|production|maintenance`) reflete o momento real do projeto, e a auditoria pode revelar que ele está desatualizado:

- **Recomendação GO ou GO COM RESSALVAS, e o usuário confirma que vai lançar agora:** proponha atualizar `stage: mvp` → `stage: production` no frontmatter. Proponha, não edite sozinho: pergunte antes ("atualizo o stage do projeto pra `production`?"), porque esse campo direciona o comportamento de outros agentes (router, maestro) e mudar sem avisar é uma mutação silenciosa de configuração compartilhada.
- **Recomendação NO-GO:** não sugira mudar o `stage:`. O projeto continua no estágio que já estava.
- **Estágio já é `production`:** não mexa; a auditoria está sendo usada pra uma nova leva/feature, não pra estreia do projeto (ver gate de estágio no `SKILL.md`).

## Regra de corte

Não grave a seção com números inventados. O resumo tem que bater exatamente com a tabela final do passo 08 (fusão): mesma contagem, mesma recomendação. Se o passo 08 não rodou (ex.: usuário pediu só uma área isolada), não grave a seção completa: registre só o achado daquela área com a mesma data, deixando claro que não é uma rodada completa das 7 áreas.
