# Performance Plan

Carregar ao montar o plano de performance. Cobre: requisitos gerais para qualquer site, requisitos específicos para vídeo, requisitos específicos para 3D real, e os targets sugeridos (LCP/CLS/INP/Lighthouse).

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
