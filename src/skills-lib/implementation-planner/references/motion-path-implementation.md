# Motion Path Implementation Rules

Carregar sempre — a implementação deve seguir o motion path escolhido pelo motion-3d-director. Cobre as regras e arquivos a planejar para cada um dos 4 paths: 3D real, image-to-video, hybrid motion, motion 2D premium.

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
