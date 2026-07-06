## Handoff para motion-3d-director

Quando o nível for **3D High-End** ou **Signature 3D Experience**, a landing strategist (esta skill) deve enviar para o `motion-3d-director`:

- brief visual;
- feeling;
- hero object;
- three-second memory;
- color logic;
- typography logic;
- spatial logic;
- objetivo do site;
- público;
- nível escolhido (3D High-End ou Signature 3D);
- se existe logo;
- se existe imagem;
- se existe mockup;
- se existe produto;
- se precisa ser interativo;
- restrições de performance;
- caminho esperado (3D real, image-to-video, hybrid ou motion 2D).

O `motion-3d-director` deve retornar:

- diagnóstico de motion;
- caminho recomendado;
- assets necessários;
- prompt de imagem;
- prompt de vídeo;
- plano de implementação;
- fallback mobile;
- performance notes;
- o que evitar.

Os termos `feeling`, `hero object`, `three-second memory`, `color logic`, `typography logic` e `spatial logic` vêm do brief produzido pela skill `decision-maker` (seis decisões + três lógicas). Se o usuário ainda não tem brief, sugerir rodar `decision-maker` primeiro: handoffs para 3D sem brief produzem genérico.

---

## Handoff para implementation-planner

A `implementation-planner` deve receber:

- nível de motion (1–5);
- motion budget correspondente;
- componentes a usar;
- animações a implementar;
- plano 3D/video (vindo do motion-3d-director, se aplicável);
- assets;
- stack (Next.js, Tailwind, shadcn/ui, Framer Motion, GSAP, R3F, etc.);
- performance constraints (Core Web Vitals, mobile fallback, reduced-motion).

Regra crítica: **não implementar R3F/Three.js se o `motion-3d-director` decidir image-to-video ou hybrid sem 3D real.** A escolha de caminho do diretor de motion é decisiva: o planner executa, não re-decide.

---

