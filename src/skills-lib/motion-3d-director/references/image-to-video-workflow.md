# Image-to-Video Workflow — fluxo completo + prompts

Carregar quando o path escolhido for image-to-video ou hybrid motion. Cobre: quando escolher esse caminho, as 4 etapas (conceito do hero, escolha do asset base incluindo regras de uso de logo, prompt de imagem base, prompt de image-to-video), com templates e exemplos preenchidos para ambos os prompts.

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

