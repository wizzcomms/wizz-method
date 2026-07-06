## Source Access Strategy

Priorizar fontes gratuitas, open source, públicas, registry-based ou fornecidas pelo usuário.

Não depender de fontes pagas como parte central do fluxo.

Fluxo recomendado de pesquisa:

1. 21st.dev via MCP/API (`mcp__magic__*`), quando disponível;
2. v0.app community (WebFetch, catálogo de referência, sem API key);
3. repositórios open source autorizados: cache central em `~/.claude/design-sources/`;
4. registries shadcn públicos;
5. fontes de taste/motion (Reference Sources);
6. fontes visuais abertas (Visual Inspiration Sources);
7. referências enviadas pelo usuário;
8. hipóteses estratégicas coerentes, quando não houver acesso externo.

## 21st.dev / Magic MCP

Esta skill deve usar 21st.dev diretamente quando MCP/API estiver disponível.

Não depender de outra skill para usar 21st.dev. Quando útil, a skill `ui-component-curator` pode ser invocada como caminho alternativo para análise prévia do projeto e curadoria visual.

O 21st.dev é fonte prioritária para: component search, UI inspiration search, SVG icon search, Magic MCP, UI generation, component variations, landing page components, SaaS dashboard components, buttons, cards, hero sections, pricing sections, testimonials, AI chat components, text e navigation components, animated components.

Quando o ambiente tiver Magic MCP disponível, usar as ferramentas MCP do 21st.dev diretamente:

- `mcp__magic__21st_magic_component_inspiration`: buscar padrões e referências de seções (hero, pricing, testimonials, features);
- `mcp__magic__21st_magic_component_builder`: gerar/instalar o componente alinhado ao stack;
- `mcp__magic__21st_magic_component_refiner`: refinar componentes existentes;
- `mcp__magic__logo_search`: logos de marcas (integrações, prova social, parceiros).

Fluxo recomendado:

1. Analisar o projeto.
2. Identificar o nível do site.
3. Definir quais componentes a página precisa.
4. Pesquisar no 21st.dev por componentes compatíveis com objetivo, tom e stack.
5. Priorizar componentes compatíveis com Next.js, React, TypeScript, Tailwind CSS, shadcn/ui e Framer Motion/Motion.
6. Combinar resultados do 21st.dev com:
   - React Bits para animações;
   - Cult UI para componentes shadcn;
   - Ali Imam para shaders e efeitos visuais;
   - Watermelon UI para SaaS/product UI;
   - StyleUI para templates;
   - Design Motion Principles para regras de movimento;
   - Taste Skill e Impeccable para qualidade visual.

Se o Magic MCP ou API do 21st.dev não estiver disponível: não inventar resultados específicos, informar que o 21st.dev não está conectado, continuar usando as outras fontes disponíveis, pedir ao usuário para conectar o MCP/API se quiser busca direta no 21st.dev.

## v0.app: catálogo de referência

O v0 é usado **exclusivamente como catálogo de referência** (não como gerador). O MCP `v0-platform-mcp` foi removido do ecossistema: para geração de UI, use o **Magic MCP (21st.dev)**.

**Fluxo de catálogo (3 passos):**

1. **Buscar templates via WebFetch em `https://v0.app/community?q=<termo>`.** Funciona para queries como `liquid+glass`, `portfolio+dark`, `bento+grid`, `case+study`, `hero+webgl`.

   Exemplo:
   ```
   url: https://v0.app/community?q=liquid+glass
   prompt: List all templates returned. For each: title, author, URL, brief description.
   ```

2. **Apresentar 5-10 links curados** com título, autor, link absoluto e o que cada um oferece.

3. **Usuário abre os templates no navegador**, copia o JSX e salva em `modelos lp/<nome>/`. A skill inspeciona a pasta local e adapta à marca.

**Caveat:** WebFetch lê a lista de busca, mas não o código do template individual (renderizado por JS client-side). Por isso o passo 3 é manual. Não tente extrair código de template via WebFetch diretamente.

**Alternativa opt-in:** usar **agent-browser** pra abrir o template no browser real e extrair código/screenshot. Mais tokens: só vale quando o template é crítico e o usuário não quer copiar manual. **Não usar Playwright.**

**Overlap com modelos locais:** muitos templates populares do v0 já podem estar na pasta `modelos lp/` do usuário. Inspecionar a pasta local primeiro antes de chamar WebFetch.

## Authorized Component / Code Inspection Sources

Estas fontes podem ser clonadas temporariamente, com permissão do usuário, para inspecionar componentes, exemplos ou registries.

### React Bits

```text
https://github.com/DavidHDev/react-bits.git
```

Usar para: animações React, text effects, animated backgrounds, scroll effects, hover effects, cards animados, microinterações, loaders, hero animations, partículas, efeitos de cursor, detalhes visuais interativos.

Priorizar componentes open source. Não recomendar nem listar componentes React Bits Pro como dependência obrigatória.

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

Se a estrutura do repositório estiver incerta: inspecionar docs primeiro, pedir confirmação antes de clonar, não assumir nomes de componentes sem verificar.

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

### Skiper UI

Skiper UI **não deve ser clonado**.

Usar o comando público:

```bash
npx shadcn add @skiper-ui/skiper40
```

Usar somente componentes públicos/gratuitos, a menos que o usuário confirme acesso premium.

Usar para: uncommon shadcn components, efeitos visuais diferenciados, seções premium, animações avançadas, componentes menos genéricos.

Evitar: depender de componentes premium sem autorização; assumir acesso pago.

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

**Não clonar nada automaticamente.**

Se precisar clonar uma fonte de componentes ou referência, perguntar antes.

Ordem preferida:

1. usar source map conhecido;
2. usar docs públicas;
3. usar web/search se disponível;
4. usar registry URL se disponível;
5. pedir permissão antes de clonar;
6. clonar apenas em pasta temporária ou claramente nomeada.

Clonar apenas em pasta temporária, como:

```text
.design-sources-temp/
```

Nunca clonar diretamente dentro da estrutura principal do app.

A skill pode clonar temporariamente apenas repositórios das listas `Authorized Component / Code Inspection Sources` e `Authorized Reference Inspection Sources`.

Usar repositórios clonados somente para: pesquisa, inspeção, descoberta de componentes, exemplos, orientação de implementação.

Não manter repositórios clonados como dependência do projeto sem confirmação explícita.

## Paid Source Policy

Não depender de fontes pagas no fluxo principal.

Remover dependência obrigatória de:

- Mobbin pago;
- ScreensDesign pago;
- React Bits Pro;
- Cult UI Pro;
- Skiper UI premium;
- Spline pago;
- Unicorn Studio pago;
- v0 pago como obrigação.

Usar ferramentas pagas apenas se:

- o usuário confirmar acesso;
- a credencial estiver disponível;
- o projeto explicitamente exigir;
- a fonte for opcional.

Sempre preferir: open source, registry público, GitHub, docs públicas, screenshots do usuário, referências fornecidas.

Não burlar paywall, login, licenças, limites de plano ou proteções de sites. Se houver dúvida sobre licença, avisar e sugerir alternativa open source.

