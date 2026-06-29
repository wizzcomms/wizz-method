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

A escolha é estratégica. Errar o path desperdiça orçamento, mata performance e empurra o site para "tech demo" em vez de "marca premium".

---

## Quando usar

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

- objetivo do site;
- público;
- nível visual (do `premium-landing-ui-researcher`);
- hero object (do brief);
- feeling (do brief);
- three-second memory (do brief);
- se existe logo;
- se existe imagem;
- se existe mockup;
- se existe produto;
- se precisa de interação real;
- performance mobile;
- tempo de implementação;
- impacto desejado;
- custo de manutenção.

A decisão vem **antes** de qualquer stack. Stack é consequência do path.

---

## Motion Paths

### 1. 3D real no navegador

Usar quando precisa de **interação real**.

**Usar se:**

- o objeto precisa reagir ao mouse;
- a câmera precisa mudar com scroll;
- há partículas interativas;
- há shader em tempo real;
- há configurador 3D;
- há produto 3D manipulável;
- há cena que responde ao usuário;
- o 3D é parte funcional da experiência;
- o hero object precisa existir como WebGL real.

**Stack recomendada:**

- React Three Fiber;
- Three.js;
- Drei;
- GLSL / shaders;
- Framer Motion ou Motion para integração com scroll;
- GSAP apenas se necessário.

**Exemplos:** objeto 3D que segue o cursor; esfera de partículas mouse-reactive; câmera que avança no scroll; wireframe terrain em tempo real; produto 3D configurável; background WebGL interativo.

**Evitar se:**

- o visual pode ser pré-renderizado;
- a interação é só decorativa;
- o público usa muito mobile;
- performance é prioridade máxima;
- o efeito pode ser resolvido com vídeo;
- o prazo é curto.

---

### 2. Image-to-video / vídeo cinematográfico

Usar quando o objetivo é **visual premium cinematográfico sem precisar de interação real**.

Este caminho costuma ser **melhor que Three.js** para sites high-end, porque entrega visual caro, leve e controlado.

**Usar se:**

- o hero precisa parecer caro;
- o visual pode ser pré-renderizado;
- a cena não precisa reagir ao usuário;
- mobile performance importa;
- a marca precisa de impacto visual;
- o asset pode ser um vídeo em loop;
- o usuário tem logo, imagem, símbolo ou mockup;
- ou o usuário não tem nada, mas a skill pode criar um objeto signature abstrato.

**Fluxo:**

1. Definir conceito do hero.
2. Criar imagem base.
3. Transformar imagem em vídeo.
4. Exportar WebM/MP4/poster.
5. Implementar no site com overlay de copy e CTA.

**Melhor para:** site de agência; marca pessoal premium; site de autoridade; portfolio cinematográfico; AI product; luxury SaaS; high-ticket service; manifesto visual.

---

### 3. Hybrid motion

Usar quando o melhor resultado mistura **vídeo/image-to-video com UI animada**.

**Usar quando:**

- o hero pode ser vídeo;
- a interface precisa de microinterações;
- o site precisa parecer vivo;
- 3D real seria pesado demais;
- o usuário quer "uau" mas não precisa de interação 3D real.

**Combinar:**

- vídeo hero ou image-to-video;
- Framer Motion;
- React Bits;
- microinterações;
- scroll effects;
- text reveal;
- cards com hover 3D leve;
- shader sutil opcional;
- poster mobile.

**Melhor para:** Signature 3D Experience; agência premium; landing de alto valor; portfolio; hero cinematográfico; sites onde performance é importante.

**Regra:** para a maioria dos sites high-end, **Hybrid motion é o caminho recomendado** — a menos que exista motivo claro para 3D real.

---

### 4. Motion 2D premium

Usar quando 3D é exagero ou não aumenta conversão.

**Inclui:** text reveal; parallax; masked typography; image reveal; hover cards; SVG motion; scroll storytelling; magnetic buttons; animated mockups; cinematic section transitions; gradient background animado; background noise; reveal por seção; staggered animations.

**Usar quando:**

- o projeto é Advanced Site;
- o público não precisa de 3D;
- performance é prioridade;
- a estética pede sofisticação discreta;
- o 3D pareceria gratuito;
- a marca precisa parecer premium, não tech demo.

---

## Image-to-Video Workflow

Usar este workflow quando o projeto precisa de visual cinematográfico high-end **sem interação 3D em tempo real**.

### Quando escolher image-to-video

Escolher quando:

- o hero precisa parecer caro;
- a cena pode ser pré-renderizada;
- o site precisa performar bem;
- o usuário quer forte impacto visual;
- o 3D real seria overkill;
- o hero é mais atmosférico do que interativo;
- o usuário quer transformar uma imagem em vídeo;
- o usuário tem logo, mockup, imagem ou produto visual;
- ou o usuário ainda não tem imagem, mas a marca precisa de um objeto signature.

### Etapa 1 — Definir conceito do hero

Definir: hero object; feeling; three-second memory; câmera; iluminação; atmosfera; color logic; duração; loop behavior; formato desktop; formato mobile.

Se faltar imagem, perguntar:

> Você tem logo, símbolo, imagem, produto, print, mockup ou dashboard que possa virar hero visual?

Se o usuário disser não:

> Vou criar uma direção de hero visual abstrato baseado na marca, no feeling e no hero object definidos no brief.

### Etapa 2 — Escolher asset base

Opções: logo da marca; símbolo da marca; produto; dashboard; mockup; print de interface; objeto abstrato signature; monólito; cluster de partículas; cena atmosférica; imagem gerada por prompt.

**Uso da logo.** A logo pode ser usada como base visual, mas **não automaticamente**.

Usar logo quando: tem símbolo forte; é simples; é reconhecível; pode virar objeto 3D; reforça a marca; tem geometria interessante; o site é de autoridade/portfolio; o objetivo é memorabilidade de marca.

Não usar logo quando: é tipográfica demais; é genérica; não tem símbolo forte; fica institucional demais; o hero object do brief é mais forte; distorcer a logo prejudicaria a marca.

Se usar logo: criar versão 3D / vidro / metal / cristal / partículas; manter legibilidade; não distorcer a marca; usar luz cinematográfica; animar com câmera lenta; exportar vídeo/poster.

**Quando não há logo nem imagem forte**, propor: objeto signature abstrato; monólito futurista; esfera de partículas; cluster cristalino; forma de vidro escuro; dashboard cinematográfico fictício; cena atmosférica; símbolo conceitual baseado no feeling.

Nunca travar por falta de imagem.

### Etapa 3 — Prompt para imagem base

Sempre entregar um prompt de imagem base quando recomendar image-to-video ou hybrid motion.

**Template:**

```
Create a cinematic hero image for a premium [type of business] website.

Subject:
[Describe the hero object. If no object exists, create an abstract signature object based on the brand feeling.]

Mood:
[Feeling from the brief], premium, controlled, intentional, cinematic, not generic.

Composition:
Large negative space, object centered or slightly off-center, editorial layout, deep atmosphere, suitable for website hero overlay.

Color:
[Color logic], restrained accent color, no random palette.

Lighting:
Cinematic rim light, soft shadows, atmospheric depth, controlled highlights.

Style:
[Reference style: Apple Vision Pro / Linear / Anthropic / editorial tech / luxury / etc.]

Avoid:
Cheap sci-fi, excessive glow, clutter, random symbols, text, people, fake UI, oversaturated neon.

Output:
4K, clean composition, suitable for image-to-video animation and website hero.
```

**Exemplo preenchido:**

```
Create a cinematic hero image for a premium technology studio website.

Subject:
A floating abstract signature object inspired by the brand identity, made of dark glass and subtle metallic edges.

Mood:
Cinematic, precise, expensive, restrained, futuristic but editorial.

Composition:
Object centered, slightly tilted, large negative space, dark off-black background, subtle cyan rim light, soft atmospheric depth, no text, no people.

Lighting:
Soft rim light, cold cyan highlights, deep shadows, subtle volumetric glow.

Style:
Apple Vision Pro meets Linear meets high-end editorial technology.

Output:
4K, clean background, suitable for image-to-video animation.
```

### Etapa 4 — Prompt para image-to-video

Sempre entregar um prompt de vídeo.

**Template:**

```
Animate this image into a cinematic website hero loop.

Motion:
[Describe camera motion: slow push-in, orbit, parallax, drift, light movement.]

Camera:
[Static / slow push-in / slight orbit / dolly / parallax depth.]

Lighting:
[Subtle light movement, rim light, atmosphere.]

Duration:
[4–8 seconds.]

Loop:
Seamless loop. End frame should match the start frame in position, lighting and atmosphere.

Mood:
[Feeling], premium, calm, controlled, intentional.

Avoid:
Fast movement, shaky camera, excessive particles, explosions, cheap sci-fi, random objects, text, logo distortion.

Output:
WebM and MP4, desktop crop, mobile crop, poster frame included.
```

**Exemplo preenchido:**

```
Animate this image into a cinematic website hero loop.

Motion:
Slow camera push-in, slight orbit to the right, subtle parallax depth, soft light movement across the object, minimal particle drift in the background.

Duration:
6 seconds.

Loop:
Seamless loop. End frame should match the start frame in position and lighting.

Mood:
Premium, calm, controlled, futuristic, editorial.

Avoid:
Fast movement, shaky camera, excessive particles, dramatic explosions, cheap sci-fi effects, text, logos changing shape.

Output:
WebM and MP4, 16:9 desktop crop and 9:16 mobile crop, poster frame included.
```

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
- prompts de imagem e vídeo;
- performance plan completo;
- handoff para `implementation-planner`.

---

## Performance Requirements

Todo plano 3D, vídeo ou motion avançado deve incluir:

- fallback mobile;
- poster image;
- `prefers-reduced-motion`;
- lazy load;
- dynamic import;
- compressão WebM/MP4;
- WebP/AVIF;
- redução de partículas;
- limite de shaders;
- Core Web Vitals respeitados;
- pause offscreen;
- mobile crop;
- desktop/video split.

**Targets sugeridos:**

- LCP < 2.5s desktop;
- LCP < 3.5s mobile 4G;
- CLS < 0.1;
- INP < 200ms;
- bundle inicial controlado;
- 3D/vídeo fora do critical path quando possível.

---

## Output obrigatório

Quando esta skill for acionada, entregar:

1. **Diagnóstico de motion** — leitura do brief, nível, contexto.
2. **Nível visual** — confirmar (3D High-End ou Signature 3D).
3. **Caminho recomendado** — 3D real / image-to-video / hybrid motion / motion 2D premium.
4. **Justificativa** — por que esse path para esse projeto.
5. **Asset base recomendado** — logo / imagem / vídeo / mockup / símbolo abstrato / objeto signature / prompt visual.
6. **O que o usuário precisa enviar** — assets faltantes ou decisões pendentes.
7. **Prompt para imagem base** — preenchido com base no brief.
8. **Prompt para vídeo / image-to-video** — preenchido.
9. **Direção de câmera, luz, duração, loop behavior**.
10. **Plano de implementação no site** — onde entra, como, com qual fallback.
11. **Fallback mobile**.
12. **Performance notes** (Core Web Vitals, lazy load, reduced motion).
13. **O que evitar** (web3 template, neon, sci-fi barato, 3D gratuito).
14. **Handoff para `implementation-planner`** (template abaixo).

---

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

---

## Regra final

O objetivo é **resultado premium, não complexidade gratuita**. Sempre escolher o caminho que entrega mais impacto com menos risco.

**Ordem de preferência quando não houver necessidade de interação real:**

1. Hybrid motion
2. Image-to-video
3. Motion 2D premium
4. 3D real

3D real só quando a interação justifica. Se o objeto não precisa reagir ao usuário, 3D real é desperdício de orçamento, performance e tempo — e o vídeo cinematográfico costuma parecer mais caro.
