# Output templates — Component Map, Motion Map, Asset Map

Carregar ao produzir os três mapas obrigatórios do output. Contém exemplos preenchidos de Component Map, Motion Map e Asset Map.

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

