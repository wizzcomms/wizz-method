---
name: implementation-planner
description: Technical implementation planning for premium websites, landing pages, portfolio sites, SaaS dashboards, animated interfaces, 3D heroes, image-to-video, motion-heavy React/Next.js builds. Use when the user has approved strategy/copy/motion and needs architecture, stack, dependencies, file structure, component map, motion map, asset map, performance plan, accessibility, SEO, analytics, Vercel deployment, or a handoff prompt for Claude Code, Codex, or Cursor. Turns approved decisions into an implementable plan without changing creative direction.
---

# Implementation Planner

Esta skill **transforma estratégia, brief, landing, componentes, motion, 3D, vídeos e assets em um plano técnico** pronto para Claude Code, Codex, Cursor ou desenvolvimento manual.

Ela é o **último elo** do pipeline. Vem depois de:

1. `decision-maker` — brief visual
2. `premium-landing-ui-researcher` — estratégia, copy, estrutura, motion ladder
3. `ui-component-curator` — componentes, fontes, refs
4. `motion-3d-director` — motion path, prompts de imagem/vídeo, performance plan

A regra-mestre desta skill: **não decide gosto visual.** Recebe decisões já tomadas e produz arquitetura técnica clara, implementável e performática.

---

## Objetivo

Receber handoffs das skills upstream e produzir: stack recomendada, dependências, estrutura de pastas, component map, motion map, asset map, plano de performance, plano de acessibilidade, plano de SEO, analytics/tracking, fases de implementação, checklist final, e handoff prompt pronto para Claude Code / Codex / Cursor.

---

## Quando usar (primeiro passo: confirmar o gatilho)

Acionar quando o usuário pedir:

- "como implementar isso?";
- "crie o plano técnico" / "me dá a arquitetura";
- "estrutura de pastas" / "quais dependências instalar?";
- "como mando para o Codex?" / "como faço no Claude Code?";
- "prepara o projeto" / "plano de implementação";
- "quero construir essa landing" / "quero transformar isso em código".

Também usar automaticamente quando a landing já tiver: estrutura definida; copy escrita; direção visual aprovada; componentes escolhidos; animações decididas; plano 3D/motion fechado (handoff de `motion-3d-director` em mãos); assets identificados; stack recomendada.

## Skip when

Pular esta skill quando:

- Ainda não há brief aprovado — rodar `decision-maker` primeiro.
- Ainda não há copy nem direção visual — rodar `premium-landing-ui-researcher` primeiro.
- O projeto é **3D High-End** ou **Signature 3D** mas o motion path ainda não foi decidido — rodar `motion-3d-director` primeiro. Implementar sem motion path leva a Three.js gratuito ou vídeo mal posicionado.
- O usuário quer só refinar copy, componentes, ou direção visual — voltar para a skill upstream correspondente.

Implementação sem decisões a montante produz código bonito que serve à ferramenta errada.

---

## Entrada esperada

A skill pode receber: brief visual (do `decision-maker`); estrutura da landing (do `premium-landing-ui-researcher`); copy; direção visual; componentes recomendados (do `ui-component-curator`); animações recomendadas; fontes/componentes; 3D plan (do `motion-3d-director`); image-to-video plan; dashboard plan, se SaaS; CTA plan; stack definida; restrições de performance; assets disponíveis; assets que ainda precisam ser criados.

Se faltar **informação crítica**, perguntar no máximo **5 coisas**. Se faltar detalhe menor, usar hipóteses coerentes e marcar como `[editável]`.

---

## Regra principal

**Não inventar decisões estratégicas que já foram tomadas por outras skills.** Seguir o handoff recebido.

Em caso de conflito entre decisões upstream, priorizar nesta ordem:

1. Brief visual (`decision-maker`).
2. Nível do site (`premium-landing-ui-researcher`).
3. Motion path (`motion-3d-director`) — regras completas em `references/motion-path-implementation.md`.
4. Stack padrão.
5. Perguntar — se o conflito afetar implementação e nenhuma das fontes resolver.

**Exemplo crítico:** se `motion-3d-director` escolheu **image-to-video**, **não** implementar R3F/Three.js para o hero — usar `<video>` + Framer Motion para o overlay. Se escolheu **3D real**, planejar R3F com mobile fallback, dynamic import, e poster.

---

## Stack padrão

Se nenhuma stack for definida no handoff, usar: **Framework** Next.js (App Router) + React + TypeScript; **Styling** Tailwind CSS + shadcn/ui; **Motion** Framer Motion/Motion + React Bits; **3D (opcional)** React Three Fiber + Three.js + Drei, apenas se motion path exigir; **Charts (opcional)** Recharts, apenas para dashboards; **Icons** lucide-react; **Fonts** next/font; **Deploy** Vercel.

Estrutura de pastas padrão e lista completa de dependências por categoria em `references/folder-structure-and-dependencies.md`.

---

## Accessibility Plan

Incluir: semantic HTML; contraste AA; focus states; aria-labels onde necessário; navegação por teclado; reduced motion; texto alternativo em imagens; evitar conteúdo importante somente em vídeo/3D; CTA acessível; links descritivos.

## SEO Plan

Incluir: title; meta description; Open Graph; Twitter card; canonical; structured data (se fizer sentido); headings claros; sitemap/robots (se aplicável); alt text; performance.

## Analytics / Tracking

Se o site tiver CTA, incluir eventos (`cta_click`, `whatsapp_click`, `calendly_click`, `email_click`, `case_open`, `pricing_view`, `hero_video_play`, `form_submit`). Para WhatsApp: tracking no clique, mensagem pré-preenchida, UTM se necessário.

---

## Output obrigatório

A resposta da skill deve sempre incluir: resumo técnico; stack recomendada; dependências; estrutura de pastas; component map; motion map; asset map; plano de performance; plano de acessibilidade; plano de SEO; analytics/tracking; fases de implementação; checklist final; handoff para Claude Code/Codex. Ver reference map abaixo para onde carregar o template de cada item.

---

## Regra final

A `implementation-planner` **não decide gosto visual**. Ela transforma decisões já tomadas em arquitetura clara, implementável e performática.

O melhor plano técnico é aquele que: reduz risco; preserva a direção visual; evita dependências inúteis; mantém performance; facilita manutenção; deixa claro o que o dev/AI precisa construir.

---

## Reference map — carregar cada arquivo quando necessário

- `references/implementation-types.md` — o que incluir por tipo de projeto (Landing page, Portfolio/Authority Site, SaaS Landing, SaaS Dashboard, 3D/Motion Site). **Carregar ao identificar o tipo de projeto.**
- `references/motion-path-implementation.md` — regras e arquivos a planejar para cada um dos 4 motion paths. **Carregar sempre que houver decisão de motion-3d-director a seguir.**
- `references/folder-structure-and-dependencies.md` — estrutura de pastas padrão + dependências recomendadas por categoria. **Carregar ao montar stack/estrutura.**
- `references/output-templates.md` — exemplos preenchidos de Component Map, Motion Map e Asset Map. **Carregar ao produzir esses três mapas.**
- `references/performance-plan.md` — requisitos de performance (geral, vídeo, 3D) + targets. **Carregar ao montar o plano de performance.**
- `references/implementation-phases.md` — template das 5 fases padrão. **Carregar ao dividir o plano em fases.**
- `references/handoff-template.md` — template exato do prompt de handoff para Claude Code/Codex. **Carregar ao fechar o plano.**

Nenhum conteúdo foi perdido nessa divisão — cada regra, exemplo e template acima vive integralmente no seu arquivo `references/`.
