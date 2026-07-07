---
name: motion-3d-director
description: Direction system for premium motion, 3D, image-to-video, WebGL, shader, scroll animation, cinematic hero, React Three Fiber, Spline, Unicorn Studio. Use when a site needs 3D hero, video hero, image-to-video, WebGL, particles, shaders, advanced scroll, Signature 3D Experience, or when premium-landing-ui-researcher classifies the project as 3D High-End or Signature 3D. The skill decides between real-time 3D, image-to-video, hybrid motion, or premium 2D motion BEFORE implementation, then outputs prompts and a handoff for implementation-planner.
---

# Motion / 3D Director

Esta skill é responsável por **direção de motion, 3D, image-to-video, vídeo hero, WebGL, shaders, scroll effects, React Three Fiber, Spline, Unicorn Studio e performance visual**.

A primeira função dela não é implementar — é **decidir** o melhor caminho visual antes que qualquer linha de Three.js seja escrita.

---

## Objetivo

Entregar o melhor resultado visual possível com equilíbrio entre **impacto, performance, tempo de execução e valor percebido**.

A regra-mestre: **nunca assumir automaticamente que 3D precisa ser feito do zero em Three.js.** Antes de qualquer recomendação técnica, decidir entre quatro caminhos:

1. **3D real no navegador** (R3F/Three.js).
2. **Image-to-video / vídeo cinematográfico** (pré-renderizado, leve, controlado).
3. **Hybrid motion** (vídeo + UI animada — o caminho recomendado para a maioria dos sites high-end).
4. **Motion 2D premium** (Framer Motion + scroll effects, sem 3D).

A escolha é estratégica. Errar o path desperdiça orçamento, mata performance e empurra o site para "tech demo" em vez de "marca premium". Detalhe completo de cada path (quando usar, stack, exemplos) em `references/motion-paths.md` — carregar depois de saber qual path se aplica.

---

## Quando usar (primeiro passo: confirmar o gatilho)

Acionar quando o usuário disser ou o projeto indicar:

- "quero 3D" / "hero 3D" / "vídeo hero" / "image-to-video";
- "motion cinematográfico" / "scroll effects" / "WebGL" / "shader" / "partículas";
- "Spline" / "Unicorn Studio" / "React Three Fiber" / "Three.js";
- "site high-end" / "Signature 3D Experience";
- "quero causar uau" / "quero algo outro nível" / "quero um site premium com animações";
- "quero transformar imagem em vídeo" / "quero usar minha logo como hero";
- "não tenho imagem, mas quero algo 3D".

Também usar automaticamente quando `premium-landing-ui-researcher` classificar o projeto como:

- **3D High-End Site**;
- **3D High-End Site — modo Signature 3D Experience**.

## Skip when

Pular esta skill quando:

- O nível do projeto for **Basic Site** ou **Intermediate Site** — não há decisão de motion path a fazer; `premium-landing-ui-researcher` resolve sozinho com motion 2D leve.
- O nível for **Advanced Site** e o usuário não pediu nenhum elemento 3D/vídeo — Advanced opera bem com motion 2D premium e a decisão de path é trivial.
- O usuário ainda não tem brief (rodar `decision-maker` primeiro — sem feeling, hero object e three-second memory, qualquer direção de motion vira chute).

---

## Regra principal

Antes de recomendar qualquer implementação, decidir entre os quatro paths considerando:

- objetivo do site; público; nível visual (do `premium-landing-ui-researcher`); hero object (do brief); feeling (do brief); three-second memory (do brief);
- se existe logo; se existe imagem; se existe mockup; se existe produto;
- se precisa de interação real; performance mobile; tempo de implementação; impacto desejado; custo de manutenção.

A decisão vem **antes** de qualquer stack. Stack é consequência do path. **Carregue `references/motion-paths.md`** para o detalhe de cada um dos quatro paths antes de recomendar um.

---

## Signature 3D Experience

Quando o projeto for **3D High-End Site — modo Signature 3D Experience**, esta skill deve buscar o maior nível de impacto visual possível sem perder performance.

Objetivo:

> Uau. Isso não é uma landing comum.

Deve parecer: autoral; raro; cinematográfico; técnico; premium; sofisticado; memorável; impossível de confundir com template.

**Motion Budget e Signature Motion Checklist (Hero / Scroll / Background / Components) vivem em `premium-landing-ui-researcher`** — seção `## Motion & Interaction Complexity Ladder`. Não duplicar aqui. Consultar lá ao montar o plano do site e usar como entrada para a decisão de path desta skill.

O que **esta skill** decide para Signature 3D:

- qual dos quatro paths usar (na maioria dos casos: **Hybrid motion**);
- qual o asset base (logo? objeto signature abstrato? cena atmosférica?);
- prompts de imagem e vídeo — ver `references/image-to-video-workflow.md`;
- performance plan completo;
- handoff para `implementation-planner`.

---

## Performance Requirements + Handoff

Todo plano 3D, vídeo ou motion avançado precisa de fallback mobile, poster image, `prefers-reduced-motion`, lazy load e respeitar Core Web Vitals. Ao final, sempre entregar o bloco de handoff para `implementation-planner` (motion path, assets, arquivos esperados, stack, notas). Lista completa de requisitos + targets (LCP/CLS/INP) + template exato do handoff em `references/performance-and-handoff.md`.

---

## Output obrigatório

Quando esta skill for acionada, entregar:

1. **Diagnóstico de motion** — leitura do brief, nível, contexto.
2. **Nível visual** — confirmar (3D High-End ou Signature 3D).
3. **Caminho recomendado** — 3D real / image-to-video / hybrid motion / motion 2D premium.
4. **Justificativa** — por que esse path para esse projeto.
5. **Asset base recomendado** — logo / imagem / vídeo / mockup / símbolo abstrato / objeto signature / prompt visual.
6. **O que o usuário precisa enviar** — assets faltantes ou decisões pendentes.
7. **Prompt para imagem base** — preenchido com base no brief (template em `references/image-to-video-workflow.md`).
8. **Prompt para vídeo / image-to-video** — preenchido (template em `references/image-to-video-workflow.md`).
9. **Direção de câmera, luz, duração, loop behavior**.
10. **Plano de implementação no site** — onde entra, como, com qual fallback.
11. **Fallback mobile**.
12. **Performance notes** (Core Web Vitals, lazy load, reduced motion).
13. **O que evitar** (web3 template, neon, sci-fi barato, 3D gratuito).
14. **Handoff para `implementation-planner`** (template em `references/performance-and-handoff.md`).

---

## Regra final

O objetivo é **resultado premium, não complexidade gratuita**. Sempre escolher o caminho que entrega mais impacto com menos risco.

**Ordem de preferência quando não houver necessidade de interação real:**

1. Hybrid motion
2. Image-to-video
3. Motion 2D premium
4. 3D real

3D real só quando a interação justifica. Se o objeto não precisa reagir ao usuário, 3D real é desperdício de orçamento, performance e tempo — e o vídeo cinematográfico costuma parecer mais caro.

---

## Reference map — carregar cada arquivo quando necessário

- `references/motion-paths.md` — os quatro paths em detalhe: quando usar, stack recomendada, exemplos, quando evitar. **Carregar antes de recomendar um path.**
- `references/image-to-video-workflow.md` — fluxo completo (4 etapas) + templates de prompt (imagem base e image-to-video) com exemplos preenchidos. **Carregar quando o path escolhido for image-to-video ou hybrid motion.**
- `references/performance-and-handoff.md` — lista completa de requisitos de performance + targets, e o template exato do bloco de handoff. **Carregar ao fechar o output desta skill.**

Nenhum conteúdo foi perdido nessa divisão — cada regra, exemplo e template acima vive integralmente no seu arquivo `references/`.
