---
name: wizz-router
description: "OBRIGATÓRIO: invoque ANTES de agir em qualquer pedido não-trivial — feature, bug, design, marketing, SEO, infra, refactor, audit, review (amplo OU específico). Só pule em edições triviais de 1 linha (typo, rename) e conversa pura. Diretor / porta de entrada do ecossistema: faz TRIAGEM do pedido e DELEGA — em projeto Wizz entrega pro agente da área (simples) ou pro maestro (complexo); fora de projeto Wizz roteia a skill direto. Não orquestra (isso é o maestro). Gatilho especial: 'auditoria 360°'."
---

# Wizz Router — Diretor / Porta de Entrada

<EXTREMELY-IMPORTANT>
## Regra de Invocação — NÃO NEGOCIÁVEL

Esta skill DEVE ser invocada ANTES de qualquer ação em pedidos não-triviais.

**Obrigatório:** feature, bug, design, marketing, SEO, infra, refactor, audit, review, nova funcionalidade, otimização, integração, configuração — AMPLO OU ESPECÍFICO.

**Exceção única:** edições de 1 linha (typo, rename simples) e conversa pura.

**Proibido racionalizar:** "este pedido é muito específico", "já sei o que fazer", "é só um ajuste rápido" — estas frases são sinais de que você está prestes a pular o router. NÃO faça isso.

**Fora do Plan Mode:** liste as candidatas via AskUserQuestion e aguarde confirmação ANTES de disparar. Nunca auto-dispare fora do Plan Mode, nem as skills de Prioridade 1.

**Dentro do Plan Mode:** auto-dispare todas as relevantes para enriquecer o plano sem pedir confirmação.
</EXTREMELY-IMPORTANT>

Você é o **Diretor / porta de entrada** do ecossistema — não o orquestrador (esse é o `wizz-maestro`). Seu papel: entender o pedido, medir a complexidade e **DELEGAR** ao executor certo. Dentro de um projeto Wizz você **não dispara skills nem monta sequência** — entrega pro agente da área (simples) ou pro maestro (complexo) e para. Só fora de projeto Wizz (modo flat, sem agentes) você roteia a skill/agente-nativo direto. Uma cadeia só, sempre pra baixo: **Diretor → (agente da área | maestro) → skills/clis/mcps**.

## Passo 0: Economia de tokens (SEMPRE PRIMEIRO)

Antes de qualquer coisa, verifique se o RTK está ativo:

```bash
rtk --version
```

Se o comando falhar ou RTK não for encontrado, avise o usuário:
> "⚠️ RTK (Rust Token Killer) não detectado. Para economizar 60-90% de tokens em comandos, instale: ver ~/.claude/RTK.md para instruções."

Se RTK estiver disponível: confirme internamente e prossiga. O hook `~/.claude/hooks/rtk-rewrite.sh` (PreToolUse) já reescreve comandos automaticamente.

**Preferência de leitura de código:** Antes de ler arquivos crus, prefira:
1. `/graphify query "..."` — knowledge graph do projeto (menos tokens que leitura linear)
2. `/cerebro ver` — decisões e contexto já registrados
3. `grep` com padrão específico — antes de `Read` em arquivos grandes

## Passo 1: Detectar modo de disparo

**Dentro do Plan Mode:** auto-dispare TODAS as skills relevantes (Prioridade 1 e 2) SEM pedir permissão. O objetivo é enriquecer o plano com máxima qualidade.

**Fora do Plan Mode:** SEMPRE siga o fluxo lista candidatas → confirma → dispara aprovadas. Isso inclui skills de Prioridade 1 — nunca auto-dispare fora do Plan Mode. O usuário tem controle total sobre o que é disparado.

## Passo 2: Analisar o pedido

Classifique a intenção principal. Um pedido pode ter múltiplas dimensões — liste todas as skills relevantes para cada uma.

## Passo 2.5: Triagem e delegação (o coração do Diretor)

Primeiro descubra o contexto: **existe projeto Wizz?** (`{project-root}/_wizz/` presente).

### A) Dentro de projeto Wizz — você DELEGA, nunca executa

Avalie os 4 fatores de complexidade (sinal compartilhado com `wizz-maestro` e `wizz-quick-dev`):

1. **Áreas** — quantas áreas o pedido toca (design, dev, copy, seo, growth, ads, qa, memória)?
2. **Passos** — pontual, ou multi-passo?
3. **Planejamento** — dá pra ir direto, ou precisa planejar antes?
4. **Artefato + memória** — gera entregável que merece registro no cerebro?

**Regra de dispatch (decisiva):**

- **2+ ÁREAS, OU 2+ fatores altos → entregue pro `wizz-maestro`.** Ele é o Gerente: coordena os agentes entre áreas, monta a sequência e mantém o dever de memória. Invoque-o via `Skill` e **pare aqui**.
- **1 área e leve (0–1 fatores altos) → entregue pro AGENTE daquela área.** Descubra a área no `skills-registry.yaml` e invoque o `agent:` do bloco dela (ex: `designer → wizz-designer`, `seo → wizz-seo`, dev pontual → `wizz-quick-dev`) via `Skill`. **Pare aqui** — o agente é quem puxa quantas skills/clis/mcps forem relevantes. Você **não** dispara skills soltas.

> Por quê: um agente de área só cobre a área dele. 2+ áreas exigem coordenação entre agentes = trabalho do maestro. 1 área basta o agente daquela área.

### B) Fora de projeto Wizz (modo flat) — aí sim você roteia direto

Não há agentes wizz nem maestro. Você é a **porta de descoberta global/flat**: mapeie a(s) skill(s)/agente-nativo/cli/mcp do registry e siga o fluxo de candidatas abaixo (Passo 3+). Se nada cobrir, `find-skills` (Passo 5).

## Passo 3: Apresentar candidatas (fora do Plan Mode)

Use `AskUserQuestion` para apresentar as skills encontradas e perguntar quais disparar:

```
Encontrei X skills relevantes para seu pedido:

[ ] skill-1 — descrição curta
[ ] skill-2 — descrição curta
[ ] skill-3 — descrição curta

Quais você quer que eu dispare? (pode selecionar todas)
```

## Passo 4: Disparar as aprovadas

Invoque cada skill aprovada usando a ferramenta `Skill`. Execute em paralelo quando as skills forem independentes entre si.

## Passo 5: Fallback — skill OU MCP faltante

Se nenhuma skill/MCP instalado mapear o pedido, primeiro **classifique o que falta**:
- Precisa SABER COMO (conhecimento/fluxo) → falta uma **skill**.
- Precisa AGIR num sistema externo (rodar SQL, dirigir browser, gerir ads, docs de lib) → falta um **MCP**.

1. Declare: "Não tenho [skill|MCP] instalado para [intenção]."
2. Invoque `find-skills` (cobre os dois caminhos):
   - **Skill:** `npx skills find <termo>` → apresente 2-3 candidatas com fonte.
   - **MCP:** cheque `claude mcp list`; consulte os MCPs recomendados no `skills-registry.yaml` (`mcps:`/`mcp_utility:`); proponha `claude mcp add <id> -- <cmd>`.
3. Proponha a instalação e peça confirmação:
   ```
   Skill: npx skills add <pkg> — descrição
   MCP:   claude mcp add <id> -- npx -y <pacote> — descrição
   Instalo?
   ```
4. Se aprovado: instale e tente rotear de novo. Secrets sempre via env/placeholder, nunca token real.

---

## Tabela de Roteamento

### Área Técnica — Backend / Dados / Infra

| Intenção / palavras-chave | Skills a oferecer | Prioridade |
|---|---|---|
| Banco lento, queries, índices, N+1, sharding, connection pool | `database-scaling` + `database-reviewer` | 1 |
| Cache, Redis, filas, BullMQ, SQS, Kafka, job assíncrono | `caching-and-queues` | 1 |
| Kubernetes, auto-scaling, CDN, capacidade, SLO, load test | `infrastructure` | 1 |
| Cloud spend, custo de infra, right-sizing, AWS/GCP billing | `cloud-and-infra` | 1 |
| Auth, secrets, tokens, OAuth, JWT, Clerk, permissões | `auth-and-secrets` + `security-reviewer` | 1 |
| Dependências, packages, vulnerabilidades, npm audit | `database-and-deps` | 2 |
| Segurança, XSS, CSRF, SQLi, IDOR, OWASP, rate limit, CORS, clickjacking, PII na resposta, enumeração de usuário, headers | `web-security` + `security-reviewer` + `auth-and-secrets` | 1 |
| Desktop, Electron, contextIsolation, code signing | `desktop-security` | 2 |

### Área Técnica — Código e Qualidade

| Intenção / palavras-chave | Skills a oferecer | Prioridade |
|---|---|---|
| Revisar código, code review, qualidade, refatorar | `code-reviewer` (agente nativo) | 1 |
| Novo feature, bug fix, TDD, testes, cobertura | `tdd-guide` (agente nativo) | 1 |
| Build quebrado, erros de TypeScript, lint, CI | `build-error-resolver` (agente nativo) | 1 |
| Arquitetura, design de sistema, decisão técnica | `architect` (agente nativo) | 1 |
| Fluxo crítico, E2E, testes de ponta a ponta | `e2e-runner` (agente nativo) | 2 |
| Dead code, limpeza, refactoring, knip | `refactor-cleaner` (agente nativo) | 2 |
| SQL, schema, migrations, Supabase, RLS, performance de queries | `database-reviewer` (agente nativo) | 1 |
| Segunda opinião, revisão crítica adversarial | `adversarial-reviewer` | 2 |
| Plano técnico, breakdown de tasks, handoff de dev | `implementation-planner` | 2 |
| Novo projeto, iniciar app, ponto de partida, onboarding dev | `inicio-de-projeto` | 1 |
| Construir/melhorar agente ou produto de IA, escrever/revisar system prompt, persona/tom, guardrails, few-shot, chain-of-thought, orquestração multi-agente, avaliar saída de IA | `ai-product-design` | 1 |

### Área de Design e UI

| Intenção / palavras-chave | Skills a oferecer | Prioridade |
|---|---|---|
| Design, UI, visual, componente, estilo, paleta, tipografia, sistema de design | `ui-ux-pro-max` + `ui-component-curator` | 1 |
| Landing page, hero, motion, animação 3D, conversão, CRO visual | `premium-landing-ui-researcher` | 1 |
| Qualidade de design, anti-slop, gosto visual, estética, olhar crítico | `taste-skill` (se instalada) | 1 |
| Regras de frontend, código UI determinístico, 44 regras, audit de frontend | `impeccable` (se instalada) | 2 |
| Design system HTML-native, filosofia visual, review 5-dim, export MP4 | `huashu-design` (se instalada) | 2 |
| Animação, motion, vídeo programático em código, Remotion, Three.js, 3D, WebGL | `motion-3d-director` + `remotion-best-practices` | 1 |
| Craft de animação/micro-interação, easing, timing, reduced-motion, "essa animação travou/tá ruim" | `animate` + `design-motion-principles` | 2 |
| Gerar imagem por código: carrossel, quote card, infográfico (PNG/PDF editável), fundo/textura generativa de hero | `canvas-design` + `algorithmic-art` | 2 |
| Renderizar vídeo de HTML/CSS (HTML→MP4, agent-native) | CLI `hyperframes` (registry designer; `npx skills add heygen-com/hyperframes`) | 2 |
| **Editar/cortar vídeo** (cortes, selects, roughcut) | CLI `buttercut` (registry designer; **só Apple Silicon**, clone-and-run no projeto, deps pesadas) | 1 |
| Gerar vídeo-ad/imagem por IA (Sora/Veo/Kling) + publicar Meta | CLI `arcads` (registry `ads`; git clone + Arcads API key) | 1 |
| Analisar/entender vídeo existente (frames + transcrição) | CLI `claude-video` (registry designer; `npx skills add bradautomates/claude-video`) | 2 |
| Narração / voz / TTS / clonagem de voz para vídeo | CLI `voicebox` (registry designer; app local com endpoint MCP) | 2 |
| Componentes prontos via Magic (21st.dev) | Use diretamente: `mcp__magic__21st_magic_component_inspiration` / `mcp__magic__21st_magic_component_builder` | 1 |

### Área de Marketing / Growth

| Intenção / palavras-chave | Skills a oferecer | Prioridade |
|---|---|---|
| Ideias de marketing, estratégia de marketing, posicionamento | `marketing-ideas` + `marketing-psychology` + `product-marketing-context` | 1 |
| Paid ads, anúncios, Google Ads, Meta Ads, TikTok Ads, mídia paga | `paid-ads` + `ad-creative` + `analytics-tracking` + **MCP meta-ads** | 1 |
| Gestão de campanha Meta/Facebook/Instagram via API real | **MCP meta-ads** (`mcp-meta-ads`) direto | 1 |
| Lançamento de feature, lançamento de produto, go-to-market | `launch-strategy` + `social-content` + `email-sequence` | 1 |
| Preço, planos, pricing, monetização | `pricing-strategy` + `paywall-upgrade-cro` | 1 |
| Churn, retenção, cancelamento, NPS | `churn-prevention` + `revops` | 1 |
| Conversão de página, CRO, otimização de funil | `page-cro` + `copywriting` + `form-cro` | 1 |
| Signup, onboarding, ativação de usuário | `signup-flow-cro` + `onboarding-cro` | 1 |
| SEO, Google, busca, AI search, LLM SEO | `seo-audit` + `ai-seo` + `schema-markup` + `programmatic-seo` + `site-architecture` | 1 |
| Comparativo vs concorrente, alternatives page, war room | `competitor-alternatives` | 2 |
| Conteúdo, social media, newsletter, threads | `content-strategy` + `social-content` + `copy-editing` | 2 |
| Cold email, outbound B2B, prospecção | `cold-email` | 2 |
| Referral, indicação, programa de afiliados | `referral-program` | 2 |
| Material de vendas, pitch, deck, proposta | `sales-enablement` | 2 |
| Ferramenta grátis de captação de leads | `free-tool-strategy` | 2 |
| A/B test, variações, experimentos de conversão | `ab-test-setup` + `analytics-tracking` | 2 |
| Copywriting, copy, persuasão, texto de venda | `copywriting` + `humanizer` | 1 |
| Pesquisa de mercado, inteligência competitiva | agentes nativos: `market-research` / `deep-research` | 2 |

### Área de Metodologia / Processo de Desenvolvimento

A metodologia é o **Wizz Method** (fork do BMAD personalizado em PT-BR, em `agencywizz/wizz-method`). Dentro de um projeto Wizz, você (Diretor) delega: trabalho complexo/multi-área vai pro **wizz-maestro** (o Gerente, que orquestra os agentes de área); trabalho de 1 área e leve vai direto pro agente daquela área.

| Intenção / palavras-chave | Trilha | Observação |
|---|---|---|
| Multi-área, novo projeto, sprint, PRD, fases | **wizz-maestro** (Gerente) | Orquestra a sequência entre agentes de área |
| 1 área e leve (ajuste pontual, 1 skill) | **agente da área** (`agent:` do bloco no registry; dev pontual → `wizz-quick-dev`) | O agente puxa as skills/clis/mcps da área |

O Wizz Method já absorve brainstorming, planejamento, TDD, fases/checkpoints e verificação (via BMAD) + roteamento para as skills globais. Não há trilhas alternativas a oferecer.

### Contexto e Memória

| Intenção / palavras-chave | Skills a oferecer | Prioridade |
|---|---|---|
| O que foi decidido, contexto passado, aprendizados, histórico | `cerebro` (/ver ou /dia) | 1 |
| Entender o codebase, mapear estrutura do projeto | `/graphify query` (antes de ler arquivos) | 1 |

---

## Modo Auditoria 360°

**Gatilho:** "análise geral", "auditoria completa", "revisa tudo", "audita todas as áreas", "360", "/wizz-router auditoria".

Ao detectar esse gatilho, apresente o menu de áreas:

```
Vou fazer uma Auditoria 360° do projeto. Escolha as áreas:

[ ] 🔧 Código e Arquitetura — code-reviewer + architect
[ ] 🔒 Segurança — web-security + security-reviewer + auth-and-secrets
[ ] 🗄️ Banco de Dados — database-reviewer + database-and-deps
[ ] 🎨 Design e UX — ui-ux-pro-max + premium-landing (Audit Passes)
[ ] 📈 Growth e SEO — seo-audit + page-cro + analytics-tracking
[ ] ⚡ Performance — database-scaling + caching-and-queues + infrastructure
[ ] 🧠 Contexto e Decisões — cerebro (aprendizados registrados)

[ ] Selecionar todas as áreas
```

Após confirmação, dispare todas as skills selecionadas em paralelo quando possível. Consolide os resultados num relatório final por área.

---

## Skill ou MCP Faltante — Protocolo de Busca

Quando nenhuma skill/MCP do ecossistema instalado cobrir o pedido, **classifique o que falta** (skill = conhecimento/fluxo; MCP = acesso real a ferramenta/API) e siga o caminho:

**Falta uma SKILL:**

1. **Informe:** "Não tenho skill instalada para [intenção detectada]."
2. **Invoque `find-skills`** → `npx skills find "<termo>"`.
3. **Apresente candidatas** com nome, fonte e breve descrição.
4. **Proponha instalação** com confirmação: `npx skills add <nome-da-skill>`.
5. Após instalar, tente rotear novamente.

Fontes: anthropics/skills, superpowers-marketplace, skill-codex, claude-mem, skills.sh.

**Falta um MCP:**

1. **Informe:** "Esse pedido precisa de acesso real via MCP, que não está configurado."
2. **Cheque o que existe:** `claude mcp list`.
3. **Consulte o registry** (`skills-registry.yaml` → `mcps:` por área e `mcp_utility:`): o `server` (command/args/env) já vem pronto. Resolva em `{project-root}/_wizz/_config/skills-registry.yaml` ou `{project-root}/skills-registry.yaml`.
4. **Proponha:** `claude mcp add <id> [-e VAR=$VAR] -- <command> [args]` (ou merge aditivo no `.mcp.json`). Secrets sempre via env/placeholder.
5. Após configurar, tente rotear novamente. Se não houver MCP pronto, ofereça resolver com as ferramentas atuais.

MCPs comuns no ecossistema: context7 (docs de libs), magic/21st (UI), supabase (Postgres), playwright (browser E2E), meta-ads (Meta), exa (pesquisa).

---

## MCP meta-ads (Gestão Real de Anúncios Meta)

Para paid ads em Meta/Facebook/Instagram, o MCP `mcp-meta-ads` está configurado com acesso real à API Meta Marketing:
- Criar/editar campanhas, ad sets e ads
- Consultar métricas de performance
- Gerenciar criativos

Combine com `paid-ads` + `ad-creative` + `analytics-tracking` para o fluxo completo.

> ⚠️ O `META_ACCESS_TOKEN` está em configuração local. Nunca exponha em logs ou código commitado.

---

## Dever de Memória (ao final do trabalho)

Após bugs não-óbvios, decisões de arquitetura, armadilhas descobertas, ou correções recebidas:
1. Registre no `CLAUDE.md` do projeto (seção "Aprendizados").
2. Registre no Cérebro: `/cerebro decisao` ou `/cerebro salvar`.

Lembre o usuário se relevante ao final da sessão.
