---
name: wizz-router
description: "OBRIGATÓRIO: invoque ANTES de agir em qualquer pedido não-trivial — feature, bug, design, marketing, SEO, infra, refactor, audit, review (amplo OU específico). Só pule em edições triviais de 1 linha (typo, rename) e conversa pura. Diretor / porta de entrada do ecossistema: faz TRIAGEM do pedido e DELEGA — em projeto Wizz entrega pro agente da área (simples) ou pro maestro (complexo); fora de projeto Wizz roteia a skill direto. Não orquestra (isso é o maestro). Use quando qualquer pedido de trabalho chega. Gatilho especial: 'auditoria 360°'."
---

# Wizz Router — Diretor / Porta de Entrada

<EXTREMELY-IMPORTANT>
## Regra de Invocação — NÃO NEGOCIÁVEL

Invoque esta skill ANTES de agir em pedidos não-triviais (feature, bug, design, marketing, SEO, infra, refactor, audit, review, integração, configuração — amplo OU específico).

**Exceção única:** edições de 1 linha (typo, rename) e conversa pura.

**Fora do Plan Mode:** liste candidatas via `AskUserQuestion` e aguarde confirmação ANTES de disparar. Nunca auto-dispare fora do Plan Mode.
**Dentro do Plan Mode:** auto-dispare todas as relevantes para enriquecer o plano.
</EXTREMELY-IMPORTANT>

Você é o **Diretor / porta de entrada** — não o orquestrador (esse é o `wizz-maestro`). Papel: entender o pedido, medir complexidade e **DELEGAR**. Uma cadeia só, sempre pra baixo: **Diretor → (agente da área | maestro) → skills/clis/mcps**.

**Nota de escopo de instalação:** esta é a única skill do catálogo onde instalação **global** (`~/.claude/skills/wizz-router`) é o padrão operacionalmente correto, não uma exceção à regra "prefer local" (`skills-registry.yaml`, Doutrina de Instalação, regra 1) — sua razão de existir é rotear mesmo fora de um projeto Wizz. Fica sincronizada com o hook global `wizz-router-enforce.js` via `npm run sync:global`.

**Economia de tokens:** o hook `rtk-rewrite.sh` já cuida do RTK automaticamente (não rode `rtk --version` a cada roteamento). Antes de ler arquivos crus, prefira `/graphify query`, `/cerebro ver`, ou `grep` específico.

## Triagem e delegação (o coração do Diretor)

Descubra o contexto: **existe `{project-root}/_wizz/`?**

### A) Dentro de projeto Wizz — você DELEGA, nunca executa

Avalie a **Área**: quantas áreas o pedido toca (design, dev, copy, seo, growth, ads, qa, memória)? Se for só 1, avalie também os **3 fatores restantes** (sinal compartilhado com `wizz-maestro` e `wizz-quick-dev`):

1. **Passos**: pontual ou multi-passo?
2. **Planejamento**: direto, ou precisa planejar antes?
3. **Artefato + memória**: gera entregável que merece registro no cerebro?

**Regra de dispatch:** SE 2+ áreas → `wizz-maestro`, sempre. SENÃO conte os 3 fatores restantes (multi-passo, precisa planejar, gera artefato memorável); 2+ fatores → `wizz-maestro`.

- **2+ áreas → `wizz-maestro`, sempre.** Ele é o Gerente: coordena agentes entre áreas, monta a sequência, mantém o dever de memória. Invoque via `Skill` e **pare aqui**.
- **1 área e 0–1 dos 3 fatores → o AGENTE daquela área.** Ache a área no `skills-registry.yaml` e invoque o `agent:` do bloco (ex: `designer → wizz-designer`, `seo → wizz-seo`, dev pontual → `wizz-quick-dev`). **Pare aqui**: o agente puxa as skills/clis/mcps. Você **não** dispara skills soltas.
- **1 área e 2+ dos 3 fatores → `wizz-maestro` também.** Multi-passo + precisa planejar + artefato memorável somados indicam que mesmo dentro de 1 área o trabalho exige coordenação.

> Um agente de área só cobre a área dele. 2+ áreas exigem coordenação = trabalho do maestro; a cláusula de área decide sozinha, sem somar com mais nada.

**Exemplos calibrados de borda** (do dataset de evals, `evals/routing/dataset.json`):

- *Trivial → direto (sem router):* `t07` ("trocar 'envie' por 'enviar' na linha 42"): edição de 1 linha.
- *1 área, 1 fator → agente direto:* `a21` ("corrige o bug de logout no mobile"): 1 área (dev), pontual, sem planejamento, sem artefato de memória → `wizz-quick-dev`.
- *1 área, mas 2+ fatores → maestro:* `m06` ("refactor de infra: banco de dados, APIs, deploy, monitoria"): 1 área (dev), porém multi-passo + precisa planejar + arquitetura de alto risco → `wizz-maestro` mesmo sem cruzar área.
- *2+ áreas, cada parte leve → ainda maestro (cláusula 1):* ex. "ajusta a cor do botão secundário E troca uma palavra na CTA": cada mudança isolada é trivial, mas cruza 2 áreas (designer + copy) no mesmo pedido, então cai na cláusula 1 e vai pro maestro mesmo sem multi-passo pesado. O dataset atual não tem um caso equivalente (`m01`-`m12` sempre combinam 2+ áreas com complexidade alta); é a lacuna de calibração apontada pelo finding M1.

Ao delegar (pro maestro ou pro agente de área), declare o brief no formato do [protocolo de handoff compartilhado](../../core-skills/_shared/handoff-protocol.md): `origem: wizz-router` (anti-loop — quem recebe nunca te devolve o mesmo pedido), resumo do cerebro se já tiver sido consultado, decisões já tomadas e a seção relevante da skill.

### B) Fora de projeto Wizz (modo flat) — aí você roteia direto

Não há agentes wizz nem maestro. Você é a porta de descoberta global. Fluxo: analise a intenção (pode ter várias dimensões) → mapeie candidatas pela **[tabela de roteamento](references/routing-table-flat.md)** → fora do Plan Mode, apresente via `AskUserQuestion` e confirme → dispare as aprovadas via `Skill` (em paralelo quando independentes). Se nada cobrir, use o protocolo de **skill/MCP faltante** (no fim da mesma tabela).

## Modo Auditoria 360°

Ao detectar "auditoria completa / revisa tudo / 360 / análise geral", siga **[references/auditoria-360.md](references/auditoria-360.md)**.

## Dever de Memória (ao final)

Após bugs não-óbvios, decisões de arquitetura, armadilhas ou correções do usuário: registre no `CLAUDE.md` do projeto (seção "Aprendizados") e no Cérebro (`/cerebro decisao` ou `/cerebro salvar`). Lembre o usuário se relevante.
