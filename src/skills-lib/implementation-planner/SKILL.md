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

Receber handoffs das skills upstream e produzir:

- Stack recomendada
- Dependências
- Estrutura de pastas
- Component map
- Motion map
- Asset map
- Plano de performance
- Plano de acessibilidade
- Plano de SEO
- Analytics/tracking
- Fases de implementação
- Checklist final
- Handoff prompt pronto para Claude Code / Codex / Cursor

---

## Quando usar

Acionar quando o usuário pedir:

- "como implementar isso?";
- "crie o plano técnico" / "me dá a arquitetura";
- "estrutura de pastas" / "quais dependências instalar?";
- "como mando para o Codex?" / "como faço no Claude Code?";
- "prepara o projeto" / "plano de implementação";
- "quero construir essa landing" / "quero transformar isso em código".

Também usar automaticamente quando a landing já tiver:

- estrutura definida;
- copy escrita;
- direção visual aprovada;
- componentes escolhidos;
- animações decididas;
- plano 3D/motion fechado (handoff de `motion-3d-director` em mãos);
- assets identificados;
- stack recomendada.

## Skip when

Pular esta skill quando:

- Ainda não há brief aprovado — rodar `decision-maker` primeiro.
- Ainda não há copy nem direção visual — rodar `premium-landing-ui-researcher` primeiro.
- O projeto é **3D High-End** ou **Signature 3D** mas o motion path ainda não foi decidido — rodar `motion-3d-director` primeiro. Implementar sem motion path leva a Three.js gratuito ou vídeo mal posicionado.
- O usuário quer só refinar copy, componentes, ou direção visual — voltar para a skill upstream correspondente.

Implementação sem decisões a montante produz código bonito que serve à ferramenta errada.

---

## Entrada esperada

A skill pode receber:

- brief visual (do `decision-maker`);
- estrutura da landing (do `premium-landing-ui-researcher`);
- copy;
- direção visual;
- componentes recomendados (do `ui-component-curator`);
- animações recomendadas;
- fontes / componentes;
- 3D plan (do `motion-3d-director`);
- image-to-video plan;
- dashboard plan, se SaaS;
- CTA plan;
- stack definida;
- restrições de performance;
- assets disponíveis;
- assets que ainda precisam ser criados.

Se faltar **informação crítica**, perguntar no máximo **5 coisas**. Se faltar detalhe menor, usar hipóteses coerentes e marcar como `[editável]`.

---

## Regra principal

**Não inventar decisões estratégicas que já foram tomadas por outras skills.** Seguir o handoff recebido.

Em caso de conflito entre decisões upstream, priorizar nesta ordem:

1. Brief visual (`decision-maker`).
2. Nível do site (`premium-landing-ui-researcher`).
3. Motion path (`motion-3d-director`).
4. Stack padrão.
5. Perguntar — se o conflito afetar implementação e nenhuma das fontes resolver.

**Exemplo crítico:**

- Se `motion-3d-director` escolheu **image-to-video**, **não** implementar R3F/Three.js para o hero. Usar `<video>` + Framer Motion para o overlay de copy/CTA.
- Se `motion-3d-director` escolheu **3D real**, planejar R3F com mobile fallback, dynamic import, e poster.

---

## Stack padrão

Se nenhuma stack for definida no handoff, usar:

- **Framework:** Next.js (App Router) + React + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Motion:** Framer Motion / Motion + React Bits
- **3D (opcional):** React Three Fiber + Three.js + Drei — apenas se motion path exigir
- **Charts (opcional):** Recharts — apenas para dashboards
- **Icons:** lucide-react
- **Fonts:** next/font
- **Deploy:** Vercel

---

## Tipos de implementação

Adaptar o plano para o tipo de projeto.

### 1. Landing page

Incluir: page structure; sections; component map; copy integration; CTA logic; animations; responsive layout; SEO; analytics; deploy.

### 2. Portfolio / Authority Site

Incluir: selected work; case cards; case deep-dive; capabilities; recognition; manifesto; editorial CTA; content placeholders; **anti-invention rule** (não inventar nomes de clientes, métricas ou case studies); MDX ou content config para cases.

### 3. SaaS Landing

Incluir: hero; product mockup; features; use cases; pricing (se necessário); testimonials; integrations; FAQ (se necessário); CTA; analytics.

### 4. SaaS Dashboard

Incluir: app layout; sidebar; topbar; KPI cards; charts; tables; settings; billing; user profile; empty states; loading states; error states; responsive behavior; Recharts; mock data.

### 5. 3D / Motion Site

Incluir: motion path; assets; hero implementation; video implementation; R3F implementation (se necessário); fallback mobile; performance plan; reduced motion; lazy load; asset compression.

---

## Motion Path Implementation Rules

A implementação **deve seguir o motion path escolhido** pelo `motion-3d-director`.

### Se o path for 3D real

**Usar:** React Three Fiber; Three.js; Drei; dynamic import; Suspense; poster fallback; reduced motion; dpr cap; pause offscreen.

**Planejar arquivos:**

- `components/three/HeroScene.tsx`
- `components/three/ParticleCluster.tsx`
- `components/three/ShaderBackground.tsx`
- `components/three/CanvasFallback.tsx`
- `lib/device/capability.ts`

### Se o path for image-to-video

**Não implementar R3F/Three.js para o hero principal.**

**Usar:** `<video>`; WebM; MP4 fallback; poster image; mobile video; reduced motion fallback; lazy loading quando possível; preload controlado; overlay HTML para copy/CTA.

**Planejar arquivos:**

- `public/video/hero-desktop.webm`
- `public/video/hero-desktop.mp4`
- `public/video/hero-mobile.webm`
- `public/video/hero-mobile.mp4`
- `public/images/hero-poster.webp`
- `components/media/HeroVideo.tsx`
- `components/media/ResponsiveVideo.tsx`
- `components/media/VideoFallback.tsx`

### Se o path for hybrid motion

**Combinar:**

- vídeo / image-to-video no hero;
- Framer Motion para texto e seções;
- React Bits para microinterações;
- hover effects;
- scroll effects;
- pequenos detalhes WebGL opcionais, se aprovados.

**Separação clara:** vídeo para atmosfera; HTML/CSS para conteúdo; Framer Motion para narrativa; WebGL só se necessário.

### Se o path for motion 2D premium

**Usar:** Framer Motion; React Bits; CSS transitions; SVG animation; clip-path reveal; parallax leve; magnetic buttons.

**Não usar Three.js.**

---

## Estrutura de pastas padrão

```
app/
  (site)/
    page.tsx
    layout.tsx
  api/
    contact/route.ts

components/
  sections/
    Hero.tsx
    Manifesto.tsx
    Approach.tsx
    SelectedWork.tsx
    CaseDeepDive.tsx
    Capabilities.tsx
    Recognition.tsx
    Conversation.tsx
    FAQ.tsx
    SiteFooter.tsx

  ui/
    Button.tsx
    GhostButton.tsx
    SectionHeader.tsx
    EditorialCard.tsx
    Marquee.tsx
    Badge.tsx
    MetricCard.tsx

  motion/
    TextReveal.tsx
    SectionFade.tsx
    MagneticButton.tsx
    ScrollProgress.tsx
    ParallaxLayer.tsx
    ImageReveal.tsx

  media/
    HeroVideo.tsx
    ResponsiveVideo.tsx
    VideoFallback.tsx

  three/
    HeroScene.tsx
    ParticleCluster.tsx
    ShaderBackground.tsx
    CanvasFallback.tsx

lib/
  motion/
    easing.ts
    variants.ts
  device/
    capability.ts
  analytics/
    events.ts
  seo/
    metadata.ts
  content/
    cases.ts
    site.ts

public/
  images/
  video/
  posters/
  logos/
```

**Ajustar de acordo com o projeto:**

- Se não houver 3D real, **remover** `components/three/`.
- Se não houver vídeo, **remover** `components/media/`.
- Se não houver portfolio, **remover** `lib/content/cases.ts`.

---

## Dependências recomendadas

Instalar **apenas o que o projeto usa**.

**Base:**

```bash
npm install next react react-dom typescript
```

**UI:**

```bash
npm install tailwindcss lucide-react clsx tailwind-merge
```

**Motion:**

```bash
npm install framer-motion
# ou, se o projeto usar Motion:
npm install motion
```

**3D real (apenas se necessário):**

```bash
npm install three @react-three/fiber @react-three/drei
```

**Dashboard (apenas se necessário):**

```bash
npm install recharts
```

**Forms / validation (se necessário):**

```bash
npm install react-hook-form zod
```

**Analytics (se necessário):**

```bash
npm install @vercel/analytics @vercel/speed-insights
```

---

## Component Map

Sempre criar um mapa de componentes.

**Exemplo:**

```
## Component Map

### Hero
File: components/sections/Hero.tsx
Uses:
- TextReveal
- MagneticButton
- HeroVideo or HeroScene
- SectionFade

### SelectedWork
File: components/sections/SelectedWork.tsx
Uses:
- EditorialCard
- ImageReveal
- case data from lib/content/cases.ts

### Conversation
File: components/sections/Conversation.tsx
Uses:
- GhostButton
- SectionHeader
- Analytics event
```

---

## Motion Map

Sempre criar mapa de animações.

**Exemplo:**

```
## Motion Map

### Hero
- headline: word reveal, stagger 60ms
- subheadline: fade up after headline
- CTA: magnetic hover
- visual: video loop or 3D scene

### Sections
- section enter: fade + slide up
- cards: stagger children
- images: clip-path reveal

### Reduced Motion
- disable parallax
- disable magnetic cursor
- use opacity-only transitions
```

---

## Asset Map

Sempre criar mapa de assets.

**Exemplo:**

```
## Asset Map

### Hero
- hero-desktop.webm
- hero-desktop.mp4
- hero-mobile.webm
- hero-poster.webp

### Logos
- client-logo-01.svg
- client-logo-02.svg

### Cases
- case-01-cover.webp
- case-02-cover.webp
```

Marcar assets faltantes como `[needed]` ou `[editável]`.

---

## Performance Plan

### Para qualquer site

- otimizar imagens;
- usar `next/image`;
- usar `next/font`;
- evitar JS desnecessário;
- lazy load abaixo da dobra;
- reduzir bundle inicial;
- usar semantic HTML;
- evitar layout shift;
- usar contrastes AA;
- respeitar `prefers-reduced-motion`.

### Para vídeo

- WebM + MP4 fallback;
- poster image;
- preload controlado;
- vídeo `muted playsInline loop`;
- mobile crop separado;
- compressão forte;
- não bloquear LCP;
- fallback poster em reduced motion.

### Para 3D real

- dynamic import com `ssr: false`;
- Suspense fallback;
- dpr cap;
- redução de partículas mobile;
- pause offscreen;
- dispose de geometria/material;
- evitar shadow pesado;
- limitar luzes;
- fallback poster;
- `prefers-reduced-motion`.

### Targets

- LCP < 2.5s desktop;
- LCP < 3.5s mobile;
- CLS < 0.1;
- INP < 200ms;
- Lighthouse Performance 90+ quando possível.

---

## Accessibility Plan

Incluir: semantic HTML; contraste AA; focus states; aria-labels onde necessário; navegação por teclado; reduced motion; texto alternativo em imagens; evitar conteúdo importante somente em vídeo/3D; CTA acessível; links descritivos.

---

## SEO Plan

Incluir: title; meta description; Open Graph; Twitter card; canonical; structured data (se fizer sentido); headings claros; sitemap/robots (se aplicável); alt text; performance.

---

## Analytics / Tracking

Se o site tiver CTA, incluir eventos.

**Exemplos:**

```
cta_click
whatsapp_click
calendly_click
email_click
case_open
pricing_view
hero_video_play
form_submit
```

**Para WhatsApp:** tracking no clique; mensagem pré-preenchida; UTM se necessário.

---

## Implementation Phases

Sempre dividir em fases.

**Fase 1 — Foundation**

- setup do projeto;
- Tailwind;
- shadcn;
- tokens;
- typography;
- layout;
- componentes base.

**Fase 2 — Static Landing**

- seções principais;
- copy;
- responsive layout;
- imagens;
- CTA;
- SEO inicial.

**Fase 3 — Motion**

- text reveal;
- section transitions;
- hovers;
- magnetic CTA;
- parallax;
- microinterações.

**Fase 4 — 3D / Video** (se aplicável)

- video hero ou R3F;
- fallback;
- performance;
- reduced motion;
- mobile assets.

**Fase 5 — Polish**

- QA visual;
- accessibility;
- performance;
- analytics;
- deploy;
- bug fixes.

---

## Output obrigatório

A resposta da skill deve sempre incluir:

1. Resumo técnico
2. Stack recomendada
3. Dependências
4. Estrutura de pastas
5. Component map
6. Motion map
7. Asset map
8. Plano de performance
9. Plano de acessibilidade
10. Plano de SEO
11. Analytics / tracking
12. Fases de implementação
13. Checklist final
14. Handoff para Claude Code / Codex

---

## Handoff para Claude Code / Codex

Sempre terminar com um prompt pronto para desenvolvimento.

**Template:**

```
You are a senior frontend engineer.

Build this project using the implementation plan below.

Requirements:
- Follow the defined stack.
- Do not add unnecessary dependencies.
- Respect the motion path.
- If the motion path is image-to-video, do not implement Three.js for the hero.
- If the motion path is 3D real, implement R3F with mobile fallback.
- Use semantic HTML.
- Respect prefers-reduced-motion.
- Keep performance budget in mind.
- Build components according to the component map.
- Use the provided file structure.
- Mark missing assets as TODO.
- Do not invent client names, metrics or case study data.

Implementation plan:
[paste plan]
```

---

## Regra final

A `implementation-planner` **não decide gosto visual**. Ela transforma decisões já tomadas em arquitetura clara, implementável e performática.

O melhor plano técnico é aquele que:

- reduz risco;
- preserva a direção visual;
- evita dependências inúteis;
- mantém performance;
- facilita manutenção;
- deixa claro o que o dev / AI precisa construir.
