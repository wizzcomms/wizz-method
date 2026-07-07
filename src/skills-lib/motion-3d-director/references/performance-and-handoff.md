# Performance requirements + handoff template

Carregar ao fechar o output desta skill: a lista completa de requisitos de performance (fallback mobile, lazy load, Core Web Vitals) e o template exato do bloco de handoff para implementation-planner.

## Performance Requirements

Todo plano 3D, vídeo ou motion avançado deve incluir:

- fallback mobile; poster image; `prefers-reduced-motion`; lazy load; dynamic import; compressão WebM/MP4; WebP/AVIF; redução de partículas; limite de shaders; Core Web Vitals respeitados; pause offscreen; mobile crop; desktop/video split.

**Targets sugeridos:** LCP < 2.5s desktop; LCP < 3.5s mobile 4G; CLS < 0.1; INP < 200ms; bundle inicial controlado; 3D/vídeo fora do critical path quando possível.

## Handoff para implementation-planner

Ao final, sempre entregar um bloco assim:

```
## Handoff para implementation-planner

Motion path escolhido:
[3D real / image-to-video / hybrid motion / motion 2D premium]

Assets necessários:
- [asset 1]
- [asset 2]

Arquivos esperados:
- hero.webm
- hero.mp4
- hero-poster.webp
- hero-mobile.webm
- hero-mobile-poster.webp

Stack recomendada:
- Next.js
- React
- TypeScript
- Tailwind
- Framer Motion
- React Three Fiber, se necessário
- Three.js, se necessário

Implementation notes:
- [notas]

Performance constraints:
- [notas]

Fallback:
- [notas]
```
