## Default Stack

Se o usuário não especificar stack, assumir:

- Next.js;
- React;
- TypeScript;
- Tailwind CSS;
- shadcn/ui;
- Framer Motion ou Motion;
- GSAP (com ScrollTrigger/SplitText, 100% gratuito desde a v3.13) para scroll storytelling e timelines cinematográficas;
- anime.js v4 para microinterações imperativas leves e SVG motion;
- React Bits;
- React Three Fiber para projetos 3D;
- Three.js para WebGL avançado;
- lucide-react para ícones;
- Recharts ou Bklit UI (charts shadcn) para dashboards SaaS.

Se o projeto for simples, reduzir stack e evitar complexidade desnecessária.

## Default Visual Direction

Se o usuário não informar direção de marca, sugerir 2 ou 3 caminhos e pedir confirmação.

### 1. Premium Tech Minimalist

Usar para: SaaS, AI tools, produtos digitais, consultorias modernas, serviços B2B.

Características: limpo, moderno, estratégico, tipografia forte, motion sutil, CTAs claros, alta conversão, visual profissional.

### 2. Cinematic Futuristic

Usar para: tecnologia, IA, inovação, Web3, produtos high-ticket, marcas digitais avançadas.

Características: fundo escuro, glow controlado, partículas, WebGL, 3D, scroll storytelling, gradientes dinâmicos, sensação premium/futurista.

### 3. Sophisticated Editorial

Usar para: consultorias, agências, criadores premium, luxo, arquitetura, branding, serviços autorais.

Características: tipografia refinada, muito espaço negativo, layout assimétrico, movimento discreto, sensação editorial, visual sofisticado.

Não forçar uma direção sem confirmar se a marca for ambígua.

### Paletas sugeridas

Quando o usuário não fornecer paleta, escolher baseado no negócio:

- Tech / IA / SaaS: preto, azul profundo, ciano, branco, cinza frio.
- Luxo / consultoria premium: off-white, preto, grafite, dourado suave, bege.
- Saúde / bem-estar: verde profundo, areia, branco, azul suave.
- Educação / infoproduto premium: marinho, branco, amarelo elegante, cinza.
- Produto low ticket com percepção premium: fundo escuro ou claro editorial, cor de destaque forte e contida.

### Tipografia

Preferir:

- títulos: Space Grotesk, Sora, Manrope, Plus Jakarta Sans, Neue Montreal, Inter Tight;
- corpo: Inter, SF Pro, Geist, Manrope;
- detalhes técnicos: JetBrains Mono, Geist Mono, IBM Plex Mono.

## Animation Selection Rules

Escolher animações com base em: tom da marca, ticket da oferta, maturidade do público, objetivo da página, nível de consciência do público, performance mobile, clareza da mensagem, valor percebido, confiança, conversão.

Não usar animação apenas porque é bonita.

A animação deve: guiar atenção, reforçar hierarquia, aumentar desejo, comunicar qualidade, melhorar compreensão, tornar a experiência memorável.

Evitar:

- excesso de movimento;
- animações lentas demais;
- animações sem propósito;
- scroll hijacking agressivo;
- efeitos que atrapalham leitura;
- WebGL pesado sem fallback;
- neon exagerado em marca que pede sofisticação.

Antes de qualquer animação, respeitar:

- `prefers-reduced-motion`: desativar ou simplificar todos os efeitos quando a preferência do sistema indicar isso.
- **Fallback mobile**: reduzir partículas, Three.js e efeitos pesados em dispositivos de baixo desempenho.
- Lazy load de componentes 3D.
- Usar fallback estático quando necessário.
- Priorizar LCP, CLS e legibilidade.

### Animation Types to Research

Quando o projeto pedir motion ou visual premium, pesquisar e recomendar:

scroll effects, parallax, 3D hero animation, WebGL background, particle effects, shader effects, hover 3D, animated cards, text reveal, typewriter, magnetic buttons, gradient animations, floating objects, cinematic transitions, masked typography, image reveal, product mockup animation, CTA animation, dashboard microinteractions, loading states, onboarding animations, pricing section motion, testimonial carousel motion, background noise/texture, glassmorphism interactions.

### 3D / WebGL Sources

Usar Spline, Unicorn Studio, Three.js e React Three Fiber quando o projeto exigir experiência visual avançada.

Usar para: hero 3D, WebGL backgrounds, motion assets, interactive objects, product visualization, particle systems, cinematic scenes, mouse-reactive visuals, shader effects, scroll-driven 3D.

Se for 3D High-End ou modo Signature 3D, sempre sugerir: efeito principal desktop, fallback mobile, estratégia de performance, redução de partículas, lazy loading, `prefers-reduced-motion`, canvas otimizado, alternativa estática para mobile fraco.

Não usar 3D pesado em projetos Basic.

### Checklist de seleção de componentes

Antes de escolher um componente ou animação, responder internamente:

- Ele melhora clareza, desejo, credibilidade ou conversão?
- Ele combina com o público?
- Ele combina com a oferta?
- Ele é viável no stack atual?
- Ele prejudica performance mobile?
- Ele depende de biblioteca paga?
- Ele é acessível?
- Ele pode ser mantido pelo projeto?
- Existe alternativa mais simples?

Se a resposta for fraca, não usar.

