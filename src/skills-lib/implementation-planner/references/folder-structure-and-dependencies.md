# Estrutura de pastas + dependências recomendadas

Carregar ao montar a estrutura de pastas padrão (com notas de quando remover cada diretório) e a lista de dependências recomendadas por categoria (base, UI, motion, 3D, dashboard, forms, analytics), instalando apenas o que o projeto usa.

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

