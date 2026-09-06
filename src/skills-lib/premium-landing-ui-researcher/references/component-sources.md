## Source Access Strategy

Priorizar fontes gratuitas, open source, públicas, registry-based ou fornecidas pelo usuário.

Não depender de fontes pagas como parte central do fluxo.

Fluxo de pesquisa (fontes públicas primeiro; registrar evidências conforme [source-first-protocol](source-first-protocol.md)):

1. referências enviadas pelo usuário (`modelos lp/`, prints, links);
2. repositórios open source autorizados: cache central em `~/.claude/design-sources/` (React Bits, Cult UI, Ali Imam, Watermelon, StyleUI) + Skiper UI via shadcn + Componentry (componentry.dev, gratuito, React animado);
3. registries shadcn públicos;
4. fontes de taste/motion (Impeccable, Taste Skill, Design Motion Principles, MotionSites, Vibe Code Components, Refero Styles com DESIGN.md gratuito);
5. fontes visuais abertas (Landing Love, Godly, Design Spells, Mobbin, Refero, ScreensDesign, DesignVault, Spline, Unicorn Studio);
6. hipóteses estratégicas coerentes, quando não houver acesso externo.

## Evidências de mineração

Para cada recomendação, abra a demo e o código/registry do item exato. Registre busca, URL/path, revisão ou data, licença, dependências, compatibilidade e motivo de seleção ou rejeição. Não invente nomes de arquivos nem use a homepage de um catálogo como prova de que um componente foi encontrado.

Use o browser disponível para verificar animações e estados quando possível. Se a fonte estiver indisponível, registre isso e continue pelas outras fontes. Inspiração visual e código reutilizável têm critérios de evidência diferentes.

**Overlap com modelos locais:** inspecionar a pasta `modelos lp/` do usuário primeiro; o que já foi minerado e salvo localmente não precisa de rede.

## Authorized Component / Code Inspection Sources

Estas fontes são candidatas à pesquisa; verifique disponibilidade e licença do item escolhido. Siga a Clone Policy abaixo para inspecionar componentes, exemplos ou registries.

### React Bits

```text
https://github.com/DavidHDev/react-bits.git
```

Usar para: animações React, text effects, animated backgrounds, scroll effects, hover effects, cards animados, microinterações, loaders, hero animations, partículas, efeitos de cursor, detalhes visuais interativos.

Verificar a licença do item/revisão: em 2026-09-06 o [LICENSE.md](https://github.com/DavidHDev/react-bits/blob/0e69e737242df1d257b4e5e399b01ae1d7901375/LICENSE.md) declara MIT + Commons Clause. Código público não equivale a MIT sem restrições adicionais. Não recomendar nem listar componentes React Bits Pro como dependência obrigatória.

### Cult UI

Usar docs, GitHub ou registry público quando disponível:

```text
https://www.cult-ui.com/docs
https://github.com/nolly-studio/cult-ui
```

Usar para: componentes shadcn, hero sections, botões sofisticados, cards animados, marketing sections, componentes com visual premium, componentes para landing pages.

Usar apenas recursos públicos/open source, salvo confirmação de acesso pago.

### Ali Imam

```text
https://github.com/aliimam-in/aliimam.git
```

Usar para: shaders, liquid wave, pixel grid, ripple shader, border glow, bento layouts, typewriter effects, canvas-based effects, efeitos visuais experimentais.

Se a estrutura do repositório estiver incerta: inspecionar docs primeiro e não assumir nomes de componentes sem verificar.

### Watermelon UI

```text
https://github.com/WatermelonCorp/watermellon-registry.git
```

Usar para: SaaS components, dashboards, product UI, cards, app sections, UI blocks, interfaces de produto, layouts funcionais, componentes de startup.

### StyleUI

```text
https://github.com/heyfabrika/styleui.git
```

Usar para: templates, landing page layouts, páginas prontas, seções instaláveis, fundamentos rápidos de layout, páginas base.

### Componentry

- Site: https://componentry.dev/ (gratuito, open source, Vercel OSS Program)
- Componentes React já animados (styling + animação resolvidos), copy-paste
- Fonte GRATUITA prioritária pra micro-interação/animação de componente antes de qualquer fonte paga
- **MCP oficial** (https://componentry.dev/docs/mcp): via MCP do shadcn — `pnpm dlx shadcn@latest mcp init` + registry `"@componentry": "https://componentry.fun/r/{name}.json"` no `components.json`; o agente instala componentes/animações direto, sem copy-paste manual

### Animmaster Lib

- Site: https://animmasterlib.dev/ — **fonte PAGA** (300 componentes animados PRO, HTML/CSS/JS/React/Next)
- Só usar com acesso/custo autorizado, quando as fontes públicas não cobrirem
- O que o usuário já comprou/baixou dela vale como recurso local (inspecionar em `modelos lp/`)

### Bklit UI

- Site: https://bklit.com/ · GitHub: https://github.com/bklit/bklit-ui (MIT, gratuito, open source)
- Charts e componentes utilitários React/TypeScript/Tailwind via registry shadcn (~15 tipos: área, barras, linha, pizza, radar, Sankey, candlestick, choropleth, gauge)
- **Não clonar**: instalar direto pelo registry — `npx shadcn@latest add @bklit/<chart>` (ex: `@bklit/line-chart`)
- Fonte prioritária para: dashboards SaaS, data viz, seções de métricas/estatísticas na landing, gráficos animados premium (complementa/substitui Recharts cru)
- O Bklit Studio (playground) é proprietário; os componentes em si são MIT

### Skiper UI

Skiper UI **não deve ser clonado**.

Usar o comando público:

```bash
npx shadcn add @skiper-ui/skiper40
```

Usar somente componentes públicos/gratuitos, a menos que o usuário confirme acesso premium.

Usar para: uncommon shadcn components, efeitos visuais diferenciados, seções premium, animações avançadas, componentes menos genéricos.

Evitar: depender de componentes premium sem autorização; assumir acesso pago.

## Animation Engine Libraries (libs de código, via npm)

Motores de animação instaláveis como dependência npm normal (não são registries de componentes; não precisam de clone — os repos podem ser inspecionados para exemplos/demos).

### GSAP

- GitHub: https://github.com/greensock/GSAP.git · Docs: https://gsap.com/docs/
- **100% gratuito desde a v3.13** (aquisição pela Webflow, 2025), incluindo todos os plugins antes pagos: ScrollTrigger, ScrollSmoother, SplitText, MorphSVG, DrawSVG, etc. Instalar: `npm i gsap` (+ `@gsap/react` para o hook `useGSAP`)
- Usar para: scroll storytelling e animações scroll-driven complexas (ScrollTrigger), timelines longas e sequenciadas, text reveal por caractere/palavra (SplitText), morph de SVG, animações fora do ciclo do React, sites high-end estilo Awwwards
- Preferir GSAP sobre Framer Motion quando: a animação é orquestrada por scroll com pinning/scrub, a timeline tem muitos passos encadeados, ou o efeito anima elementos fora de componentes React

### anime.js

- GitHub: https://github.com/juliangarnier/anime.git · Docs: https://animejs.com/ (MIT, gratuito)
- v4: API modular e tree-shakeable (~10kb core), timelines, stagger, springs, draggable, scroll observer, SVG (draw/morph/motion path), WAAPI. Instalar: `npm i animejs`
- Usar para: microinterações e animações leves quando GSAP seria peso demais, stagger/grid animations, animação de SVG, contadores/números animados, projetos sem React ou fora do ecossistema Motion
- Regra de escolha: Framer Motion/Motion para UI React declarativa → anime.js para efeitos leves imperativos → GSAP para scroll orquestrado e timelines cinematográficas

## Authorized Reference Inspection Sources

Estas fontes podem ser inspecionadas ou consultadas para princípios, critérios de qualidade, motion e taste, mas **não devem ser tratadas como dependências de projeto**.

### Impeccable

```text
https://github.com/pbakaus/impeccable.git
```

Usar para: visual taste, spacing, hierarchy, composição visual, design fluency, evitar UI amadora, melhorar refinamento visual.

Impeccable não é fonte de componentes. É fonte de julgamento visual.

### Taste Skill

```text
https://github.com/Leonxlnx/taste-skill.git
```

Usar como camada anti-generic frontend.

Aplicar para: evitar UI genérica de IA, melhorar hierarquia, melhorar spacing, melhorar composição, deixar a interface mais premium, corrigir visual "template", revisar se o design parece feito por especialista.

Sempre aplicar quando a landing parecer genérica, o projeto for avançado ou high-end, o usuário pedir qualidade premium, o site precisar parecer caro.

### Design Motion Principles

```text
https://github.com/kylezantos/design-motion-principles.git
```

Usar para: easing, timing, scroll motion, reveal logic, microinteraction rules, motion hierarchy, duração de animações, entrada e saída de elementos, evitar animação caótica, consistência de movimento.

### MotionSites

```text
https://github.com/aayushsoam/motionsites.ai.git
```

Classificação: referência visual, referência de motion, biblioteca de prompts/ideias, fonte de inspiração para hero, scroll storytelling e animações.

**Não tratar MotionSites como fonte principal de componentes instaláveis.** Se houver repositório disponível, pode ser inspecionado apenas para pesquisa de referências e padrões, não como dependência do projeto.

Usar para: motion references, animated landing ideas, hero prompts, scroll storytelling, cinematic web sections, exemplos de movimento, direção de animação.

### Vibe Code Components

```text
https://vibecodecomponents.com/
```

Classificação: referência visual, fonte de prompts, inspiração de componentes, vibe coding reference.

**Não tratar como fonte garantida de código instalável**, a menos que o conteúdo acessível confirme isso.

Usar para: vibe coding references, prompt ideas, component inspiration, UI patterns, visual exploration, ideias de seções, direção visual rápida, componentes modernos.

> **Regra importante:** MotionSites e Vibe Code Components podem aparecer em `Reference Sources` e `Visual Inspiration Sources`, mas não devem ser tratadas como fontes primárias de implementação igual React Bits, Cult UI, Watermelon ou StyleUI.

## Visual Inspiration Sources

Estas são fontes visuais para a skill usar quando precisar de direção visual, inspiração, estilo, animação, composição e UX. Não devem ser tratadas como fonte garantida de código.

### 1. Landing Love

URL: `https://www.landing.love/`

Melhor para pesquisar: landing pages animadas, scroll effects, WebGL, GSAP, Framer, Webflow, páginas com vídeo de navegação, storytelling visual, motion em páginas reais.

Quando usar: projeto precisa de inspiração de landing page animada, usuário quer algo moderno/dinâmico, skill precisa entender ritmo de scroll e transições.

### 2. Godly

URL: `https://godly.website/`

Melhor para pesquisar: sites premium, composição visual, tipografia, direção de arte, layout editorial, estética high-end, referências de marcas digitais.

Quando usar: projeto precisa parecer sofisticado, direção visual está fraca, site precisa parecer caro e não genérico.

### 3. Design Spells

URL: `https://www.designspells.com/`

Melhor para pesquisar: microinterações, detalhes de UI, easter eggs, pequenas animações, momentos de encantamento, interação fina.

Quando usar: site já estruturado mas precisa de detalhes memoráveis, projeto precisa de acabamento visual, experiência precisa parecer mais viva.

### 4. Spline

URL: `https://spline.design/`

Melhor para pesquisar: cenas 3D, hero 3D, objetos interativos, product visuals, embeds 3D, experiências espaciais.

Quando usar: projeto 3D High-End, modo Signature 3D, marca tech/futurista, produto que ganha valor com visual 3D.

Trabalhar dentro do plano gratuito do Spline. Respeitar limites de exportação, watermark e número de cenas. Não pressupor licença paga.

### 5. Unicorn Studio

URL: `https://www.unicorn.studio/`

Melhor para pesquisar: WebGL backgrounds, motion assets, efeitos no-code, shaders visuais, fundos interativos, efeitos de partículas.

Quando usar: site precisa de impacto visual, projeto quer WebGL sem implementar tudo manualmente, skill precisa sugerir background animado ou efeito atmosférico.

Trabalhar dentro do plano gratuito. Respeitar limites e marca d'água. Não pressupor licença paga.

### 6b. Refero

- https://refero.design/ — inspiração UI/UX de apps e sites reais, por tela e por fluxo
- Usar como Mobbin: referência visual de padrões reais, não fonte de código
- **Refero Styles** (https://styles.refero.design/, gratuito em beta): biblioteca de `DESIGN.md` extraídos de sites reais — paleta, tipografia, spacing, motion e padrões de componente num único markdown. Buscar por marca/mood/cor, copiar o DESIGN.md e colar no contexto do agente. Pra direção visual concreta, priorizar sobre inspiração visual pura (screenshot)

### 6. Mobbin

URL: `https://mobbin.com/`

Melhor para pesquisar: UX real, fluxos de apps, onboarding, pricing pages, dashboards, mobile UI, padrões de produto.

Regra: Mobbin pode exigir login/pagamento. Usar apenas se houver acesso, previews públicos ou referências enviadas pelo usuário. Não depender de Mobbin no fluxo principal.

### 7. ScreensDesign / DesignVault

URLs: `https://screensdesign.com/` · `https://designvault.io/`

Melhor para pesquisar: onboarding mobile, paywalls, app screens, subscription flows, telas com foco em conversão, UX de apps.

Regra: pode exigir plano/pagamento para uso completo. Usar apenas quando houver acesso ou como referência visual pública.

### Fontes que o usuário pode fornecer manualmente

- **Prints, screenshots, vídeos, Figma, Behance, Dribbble, sites concorrentes**: tratar como fonte de prioridade alta. A referência do usuário vale mais que catálogo genérico.
- **Componentes ou trechos de código que o usuário cole no chat**: tratar como base autoritativa para estilo, padrão e direção.
- **Bibliotecas premium que o usuário declarar ter acesso** (React Bits Pro, Cult UI Pro, Skiper UI premium, Mobbin, ScreensDesign Pro, etc.): a skill **não pressupõe esse acesso**, mas se o usuário confirmar, pode usar.

### Visual Inspiration Rules

Usar fontes visuais apenas como inspiração, não como fonte garantida de código.

Usar para: direção visual, padrões de layout, ritmo de seções, microinterações, animações, composição, atmosfera, inspiração de scroll, linguagem visual, UX real, onboarding, paywalls, dashboards, pricing pages.

Não prometer código pronto quando a fonte for apenas visual. Não copiar visualmente um site inteiro de referência. Usar referências para criar uma solução original, adaptada ao projeto.

## Clone Policy

Siga a fase de cache de [source-first-protocol](source-first-protocol.md). Prefira arquivos públicos, docs e registry; clone em diretório isolado apenas quando necessário à pesquisa autorizada. Confira origem, revisão e alterações locais antes de atualizar um cache. Nunca sobrescreva trabalho local nem execute scripts do repo para apenas inspecionar código.

Use somente os componentes necessários; preserve licença e atribuições. O clone de pesquisa não vira dependência permanente do app.

## Paid Source Policy

Não depender de fontes pagas no fluxo principal.

Remover dependência obrigatória de:

- Mobbin pago;
- ScreensDesign pago;
- React Bits Pro;
- Cult UI Pro;
- Skiper UI premium;
- Spline pago;
- Unicorn Studio pago.

Usar ferramentas pagas apenas se:

- o usuário confirmar acesso;
- a credencial estiver disponível;
- o projeto explicitamente exigir;
- a fonte for opcional.

Sempre preferir: open source, registry público, GitHub, docs públicas, screenshots do usuário, referências fornecidas.

Não burlar paywall, login, licenças, limites de plano ou proteções de sites. Se houver dúvida sobre licença, avisar e sugerir alternativa open source.
