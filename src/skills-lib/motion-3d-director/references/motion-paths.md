# Motion Paths — os quatro caminhos em detalhe

Carregar depois de decidir qual dos quatro paths (3D real, image-to-video, hybrid motion, motion 2D premium) melhor se encaixa — este arquivo detalha quando usar cada um, stack recomendada, exemplos e quando evitar.

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
- GSAP (ScrollTrigger) quando o scroll orquestra a cena — 100% gratuito desde a v3.13, todos os plugins incluídos.

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

**Stack recomendada:** Framer Motion/Motion para UI React declarativa; GSAP + ScrollTrigger/SplitText para scroll storytelling, pinning e text reveal avançado (gratuito desde a v3.13); anime.js v4 para stagger, SVG motion e microinterações imperativas leves (~10kb core, MIT).

**Usar quando:**

- o projeto é Advanced Site;
- o público não precisa de 3D;
- performance é prioridade;
- a estética pede sofisticação discreta;
- o 3D pareceria gratuito;
- a marca precisa parecer premium, não tech demo.

---
