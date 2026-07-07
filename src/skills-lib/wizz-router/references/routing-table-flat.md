# Tabela de Roteamento — Modo Flat

Use esta tabela **só fora de projeto Wizz** (sem `_wizz/`), quando o router mapeia skills/CLIs/MCPs direto. Dentro de projeto Wizz a delegação é decidida pela regra de dispatch no SKILL.md (maestro vs agente de área) e esta tabela não é necessária.

## Área Técnica — Backend / Dados / Infra

| Intenção / palavras-chave | Skills a oferecer | Prioridade |
|---|---|---|
| Banco lento, queries, índices, N+1, sharding, connection pool | `database-scaling` + `supabase-postgres-best-practices` | 1 |
| Cache, Redis, filas, BullMQ, SQS, Kafka, job assíncrono | `caching-and-queues` | 1 |
| Kubernetes, auto-scaling, CDN, capacidade, SLO, load test | `infrastructure` | 1 |
| Cloud spend, custo de infra, right-sizing, AWS/GCP billing | `cloud-and-infra` | 1 |
| Auth, secrets, tokens, OAuth, JWT, Clerk, permissões | `auth-and-secrets` + `web-security` | 1 |
| Dependências, packages, vulnerabilidades, npm audit | `database-and-deps` | 2 |
| Segurança, XSS, CSRF, SQLi, IDOR, OWASP, rate limit, CORS, clickjacking, PII na resposta, enumeração de usuário, headers | `web-security` + `auth-and-secrets` | 1 |
| Desktop, Electron, contextIsolation, code signing | `desktop-security` | 2 |

## Área Técnica — Código e Qualidade

| Intenção / palavras-chave | Skills a oferecer | Prioridade |
|---|---|---|
| Revisar código, code review, qualidade, refatorar | `wizz-code-review` | 1 |
| Novo feature, bug fix, TDD, testes, cobertura | `wizz-quick-dev` ou `wizz-agent-dev` | 1 |
| Build quebrado, erros de TypeScript, lint, CI | `wizz-quick-dev` | 1 |
| Arquitetura, design de sistema, decisão técnica | `wizz-agent-architect` | 1 |
| Fluxo crítico, E2E, testes de ponta a ponta | `wizz-qa-generate-e2e-tests` + `agent-browser` | 2 |
| Dead code, limpeza, refactoring, knip | `wizz-code-review` + `wizz-quick-dev` | 2 |
| SQL, schema, migrations, Supabase, RLS, performance de queries | `supabase-postgres-best-practices` + `database-scaling` | 1 |
| Segunda opinião, revisão crítica adversarial | `adversarial-reviewer` | 2 |
| Plano técnico, breakdown de tasks, handoff de dev | `implementation-planner` | 2 |
| Novo projeto, iniciar app, ponto de partida, onboarding dev | `inicio-de-projeto` | 1 |
| Construir/melhorar agente ou produto de IA, escrever/revisar system prompt, persona/tom, guardrails, few-shot, chain-of-thought, orquestração multi-agente, avaliar saída de IA | `ai-product-design` | 1 |

## Área de Design e UI

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

## Área de Marketing / Growth

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
| Pesquisa de mercado, inteligência competitiva | `wizz-market-research` / `wizz-domain-research` | 2 |

## Contexto e Memória

| Intenção / palavras-chave | Skills a oferecer | Prioridade |
|---|---|---|
| O que foi decidido, contexto passado, aprendizados, histórico | `cerebro` (/ver ou /dia) | 1 |
| Entender o codebase, mapear estrutura do projeto | `/graphify query` (antes de ler arquivos) | 1 |

---

## Fallback — skill OU MCP faltante

Quando nenhuma skill/MCP instalado cobrir o pedido, **classifique o que falta** (skill = conhecimento/fluxo; MCP = acesso real a ferramenta/API):

**Falta uma SKILL:** informe → invoque `find-skills` → `npx skills find "<termo>"` → apresente 2-3 candidatas com fonte → proponha `npx skills add <pkg>` com confirmação → roteie de novo. Fontes: anthropics/skills, superpowers-marketplace, skill-codex, claude-mem, skills.sh. **Revise o SKILL.md e qualquer `scripts/` antes de instalar; prefira owners conhecidos.**

**Falta um MCP:** informe → `claude mcp list` → consulte `skills-registry.yaml` (`mcps:`/`mcp_utility:`, com `server` pronto) → proponha `claude mcp add <id> [-e VAR=$VAR] -- <command> [args]`. Secrets sempre via env/placeholder, nunca token real.

MCPs comuns: context7 (docs de libs), magic/21st (UI), supabase (Postgres), playwright (browser E2E), meta-ads (Meta), exa (pesquisa).

Para paid ads Meta, o MCP `mcp-meta-ads` dá acesso real à API Meta Marketing (campanhas, ad sets, ads, métricas, criativos). Combine com `paid-ads` + `ad-creative` + `analytics-tracking`. O `META_ACCESS_TOKEN` vem de env local: nunca exponha em logs ou código commitado.
