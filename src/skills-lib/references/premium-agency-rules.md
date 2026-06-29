# Premium Agency Design Rules (referência)

> **O que é isto:** documento de referência (não é uma skill acionável). Reúne as regras de design "$150k agency-tier" que antes viviam na skill `taste-soft` / `high-end-visual-design`. Foi rebaixado a referência porque é redundante com `impeccable` como skill invocável — o conteúdo continua útil como *fonte de regras*, não como ponto de entrada.
>
> **Quem usa:** `impeccable` e `huashu-design` importam estas regras quando entram em modo "high-end / Awwwards-tier". O agente `wizz-designer` aponta pra cá quando o pedido exige acabamento premium.

## 1. Diretriz central
- **Persona:** Vanguard UI Architect.
- **Objetivo:** engenheirar experiências nível agência $150k+, com profundidade háptica, ritmo espacial cinematográfico, micro-interações obsessivas e movimento fluido.
- **Mandato de variância:** NUNCA gerar o mesmo layout/estética duas vezes seguidas. Combinar arquétipos premium dinamicamente, sempre dentro da linguagem "Apple-esque / Linear-tier".

## 2. "Absolute Zero" (anti-padrões estritos)
Se o código gerado tiver QUALQUER um destes, o design falha:
- **Fontes banidas:** Inter, Roboto, Arial, Open Sans, Helvetica. (Assumir disponíveis: `Geist`, `Clash Display`, `PP Editorial New`, `Plus Jakarta Sans`.)
- **Ícones banidos:** Lucide grosso, FontAwesome, Material Icons. Usar só linhas ultra-finas (Phosphor Light, Remix Line).
- **Bordas/sombras banidas:** bordas 1px solid cinza genéricas; sombras escuras duras (`shadow-md`, `rgba(0,0,0,0.3)`).
- **Layouts banidos:** navbar sticky colada no topo edge-to-edge; grids Bootstrap 3-colunas simétricos sem whitespace massivo.
- **Movimento banido:** transições `linear` ou `ease-in-out`; mudanças de estado instantâneas sem interpolação.

## 3. Motor de variância criativa
Antes de codar, "rolar o dado" e escolher UMA combinação por contexto:

### A. Vibe & Textura (escolher 1)
1. **Ethereal Glass (SaaS / AI / Tech):** preto OLED (`#050505`), gradientes mesh radiais sutis, cards vantablack com `backdrop-blur-2xl` e hairlines white/10, tipografia Grotesk geométrica larga.
2. **Editorial Luxury (Lifestyle / Imobiliário / Agência):** cremes quentes (`#FDFBF7`), sage, espresso; serifa variável alto-contraste para títulos massivos; overlay sutil de noise/film-grain (`opacity-[0.03]`).
3. **Soft Structuralism (Consumer / Health / Portfolio):** fundos prata/branco; Grotesk bold massivo; componentes flutuantes com sombras ambientes ultra-difusas.

### B. Layout (escolher 1)
1. **Asymmetrical Bento:** grid masonry de cards variados. Mobile: cai pra coluna única (`grid-cols-1`, `gap-6`), todos os `col-span` viram `col-span-1`.
2. **Z-Axis Cascade:** cards físicos sobrepostos com profundidade e rotação sutil (`-2deg`/`3deg`). Mobile <768px: remover rotações e overlaps; empilhar vertical (evita conflito de touch-target).
3. **Editorial Split:** tipografia massiva à esquerda (`w-1/2`), conteúdo interativo à direita. Mobile: vira stack vertical full-width.

**Override mobile universal:** layouts assimétricos acima de `md:` DEVEM cair pra `w-full`, `px-4`, `py-8` abaixo de 768px. Nunca `h-screen` em seções full-height — usar `min-h-[100dvh]` (evita pulo de viewport no iOS Safari).

## 4. Micro-estética háptica
### A. Double-Bezel (Doppelrand / arquitetura aninhada)
Cards/imagens nunca direto no fundo. Parecem hardware usinado (placa de vidro em bandeja de alumínio):
- **Outer Shell:** wrapper com fundo sutil (`bg-black/5` ou `bg-white/5`), borda hairline (`ring-1 ring-black/5`), padding (`p-1.5`/`p-2`), raio grande (`rounded-[2rem]`).
- **Inner Core:** container interno com fundo próprio, highlight interno (`shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]`) e raio menor calculado (`rounded-[calc(2rem-0.375rem)]`) para curvas concêntricas.

### B. Botões "ilha" / CTA aninhado
- Pills totalmente arredondados (`rounded-full`, `px-6 py-3`).
- **Button-in-Button:** ícone de seta (`↗`) nunca nu — fica num wrapper circular próprio (`w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center`), flush com o padding direito.

### C. Ritmo espacial & tensão
- **Macro-whitespace:** dobrar o padding padrão. Seções `py-24` a `py-40`.
- **Eyebrow tags:** preceder H1/H2 com badge minúsculo (`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium`).

## 5. Coreografia de movimento (dinâmica fluida)
Sem transições default. Simular massa e física de mola. Cubic-beziers custom (ex: `transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]`).
- **Fluid Island Nav:** navbar é pill de vidro flutuante destacada do topo (`mt-6 mx-auto w-max rounded-full`). Hamburger faz morph fluido pra 'X'. Menu abre como overlay screen-filling com `backdrop-blur-3xl`. Links revelam em staggered mask (`translate-y-12 opacity-0` → `translate-y-0 opacity-100`, delays escalonados).
- **Magnetic hover:** `group` + `active:scale-[0.98]`; ícone interno translada diagonal (`group-hover:translate-x-1 group-hover:-translate-y-[1px]`) e escala (`scale-105`).
- **Scroll interpolation:** entrada com fade-up pesado (`translate-y-16 blur-md opacity-0` → `translate-y-0 blur-0 opacity-100`, 800ms+). Usar `IntersectionObserver`/`whileInView`, nunca `window.addEventListener('scroll')`.

## 6. Guardrails de performance
- **GPU-safe:** nunca animar `top/left/width/height`. Só `transform` e `opacity`. `will-change` com parcimônia.
- **Blur:** `backdrop-blur` só em fixed/sticky (navbar, overlay). Nunca em containers que rolam.
- **Grain/noise:** só em pseudo-elementos `fixed` `pointer-events-none` (`inset:0; z-index:50`).
- **Z-index disciplinado:** sem `z-[9999]` arbitrário. Reservar pra camadas sistêmicas (nav, modal, overlay, tooltip).

## 7. Protocolo de execução
1. **[SILENT]** rolar o motor de variância (seção 3) por contexto.
2. **[SCAFFOLD]** textura de fundo, escala de whitespace, tipografia massiva.
3. **[ARCHITECT]** DOM com Double-Bezel em todos os cards/inputs/grids; squircle exagerado (`rounded-[2rem]`).
4. **[CHOREOGRAPH]** cubic-bezier custom, reveals escalonados, button-in-button hover.
5. **[OUTPUT]** React/Tailwind/HTML pixel-perfect; sem fallbacks genéricos.

## 8. Checklist pré-output
- [ ] Nenhuma fonte/ícone/borda/sombra/layout/motion banido da seção 2
- [ ] Vibe + Layout archetype conscientemente escolhidos (seção 3)
- [ ] Cards/containers com Double-Bezel (outer shell + inner core)
- [ ] CTAs com Button-in-Button onde aplicável
- [ ] Padding de seção no mínimo `py-24`
- [ ] Transições com cubic-bezier custom (sem `linear`/`ease-in-out`)
- [ ] Animações de entrada em scroll presentes
- [ ] Colapsa pra coluna única abaixo de 768px (`w-full`, `px-4`)
- [ ] Só `transform`/`opacity` animados
- [ ] `backdrop-blur` só em fixed/sticky
- [ ] Impressão geral lê como "build de agência $150k", não "template com fontes bonitas"
