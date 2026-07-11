<EXTREMELY-IMPORTANT>

## Source-First Mandate (read this FIRST, every time)

**Esta skill existe porque escrever shaders, animações, hovers e componentes do zero NÃO é o caminho.** O caminho é **curar componentes, animações e shaders maduros de bibliotecas profissionais** (modelos lp do usuário, React Bits, Cult UI, Ali Imam, Watermelon, StyleUI, Skiper UI e, como fonte PAGA complementar, 21st.dev) e **adaptar à marca**.

Se você se pegar pensando "vou escrever um shader perlin do zero" ou "vou criar uma esfera de partículas no R3F na mão" ou "vou desenhar um SVG de carousel": **PARE**. Isso é o anti-pattern que essa skill foi feita pra prevenir.

### Anti-pattern (NUNCA fazer)

- ❌ Escrever um shader GLSL custom sem antes ter inspecionado Ali Imam, paper.design refs, 21st.dev e o conteúdo do usuário em `/modelos lp/`
- ❌ Reinventar text reveal / magnetic / scroll-driven animation sem antes ter inspecionado React Bits e os modelos do usuário
- ❌ Criar hero 3D na mão sem antes ter buscado em 21st.dev via Magic MCP e gerado variações em v0
- ❌ Criar carousel/slider sem antes ter verificado se Embla, shadcn/ui ou 21st.dev têm componente pronto compatível com o stack
- ❌ Desenhar mockup SVG de produto inteiro sem antes ter pedido autorização pro usuário capturar screenshot real ou usar agent-browser no projeto live
- ❌ "Fazer tudo na mão pra ir mais rápido": isso quebra o propósito da skill

### Required pattern (SEMPRE fazer)

Antes de escrever qualquer linha de código de UI, executar o **Source-First Protocol** (definido abaixo). A regra absoluta é:

> **Inspecione fontes reais → ofereça opções ao usuário → adapte à marca. Nunca recrie o que já existe maduro.**

Se você não consegue ou não está autorizado a invocar uma fonte (MCP offline, sem permissão pra clone, sem rede), **declare isso explicitamente ao usuário** antes de cair pro fallback de criar do zero. O usuário deve poder dizer "ok, então vamos clonar Ali Imam agora" ou "tudo bem, faça na mão dessa vez". Nunca cair pro fallback silenciosamente.

</EXTREMELY-IMPORTANT>

## Source-First Protocol

Este é o protocolo executável dos checkpoints 6, 7 e 8 do Mandatory Process. Seguir nesta ordem, declarando ao usuário o que está fazendo em cada fase.

### Fase 1: Inventário interno (sem dependência externa)

Antes de qualquer rede ou MCP, inspecionar o que o usuário já tem:

1. **Pasta `modelos lp/` (ou equivalente)**: rodar `find ~ -maxdepth 6 -type d -iname "modelos*lp*"` para localizar. Listar subpastas, ler package.json e README.md de cada projeto promissor. Identificar quais já tem Lenis, GSAP, R3F, OGL, Embla, Framer Motion, shaders prontos.
2. **Projeto atual do usuário**: se houver, listar dependências instaladas (`cat package.json`) e componentes/utilities existentes que podem ser reaproveitados.
3. **Cérebro / vault do usuário**: usar grep nos arquivos do vault (`projetos/`, `_learnings/`) para achar padrões técnicos já documentados em projetos anteriores.

Saída desta fase: lista de **componentes, libs e padrões reaproveitáveis** com path absoluto.

### Fase 2: Busca nos repos de referência (cache central primeiro) — FASE PADRÃO

Para cada efeito visual ainda não resolvido pela fase 1, inspecionar o **cache central de design** em `~/.claude/design-sources/` antes de qualquer clone. Só clonar se o repo não estiver em cache ou estiver desatualizado.

**Mapa de decisão "preciso disso → fonte":**

| Preciso de... | Cache central | Atualizar cache se necessário |
|---|---|---|
| Shader líquido / liquid wave / ripple / pixel grid / efeito experimental WebGL | `~/.claude/design-sources/aliimam/` | `git -C ~/.claude/design-sources/aliimam pull` |
| Text reveal / particle effects / hover effects / animated cards / scroll effects React | `~/.claude/design-sources/react-bits/` | `git -C ~/.claude/design-sources/react-bits pull` |
| Hero sections shadcn premium / marketing sections / botões sofisticados / cards animados | `~/.claude/design-sources/cult-ui/` | `git -C ~/.claude/design-sources/cult-ui pull` |
| SaaS components / dashboards / product UI blocks | `~/.claude/design-sources/watermelon/` | `git -C ~/.claude/design-sources/watermelon pull` |
| Templates / landing layouts prontos / páginas base | `~/.claude/design-sources/styleui/` | `git -C ~/.claude/design-sources/styleui pull` |
| Componentes shadcn premium específicos | **Skiper UI** | `npx shadcn add @skiper-ui/skiperXX` (sem clone, instala direto) |

**Fluxo de uso do cache:**

1. Verificar se o diretório em `~/.claude/design-sources/<repo>/` existe e tem conteúdo.
2. Se sim: ler/grep diretamente no cache sem clonar.
3. Se desatualizado (> 7 dias sem pull): `git -C ~/.claude/design-sources/<repo> pull --quiet` antes de inspecionar.
4. Se o cache não existir (máquina nova): `git clone --depth=1 <url> ~/.claude/design-sources/<repo>` e seguir.

**Regras de cópia para o projeto:**

- Copiar APENAS o(s) componente(s) necessário(s) para `src/components/` adaptados à marca
- Nunca adicionar o repo inteiro como dependência permanente
- Não clonar em `.design-sources-temp/` se o cache já tem o repo: usar o cache diretamente

### Fase 3: Magic MCP do 21st.dev (fonte PAGA, complementar)

**Ferramentas disponíveis (chamar via ToolSearch se não estiverem carregadas):**

- `mcp__magic__21st_magic_component_inspiration`: buscar referências e padrões para uma seção específica (hero, pricing, testimonials, navbar, contact dialog, etc.)
- `mcp__magic__21st_magic_component_builder`: gerar/instalar componente alinhado ao stack do usuário
- `mcp__magic__21st_magic_component_refiner`: refinar componente existente
- `mcp__magic__logo_search`: logos de marcas para integrações/prova social

**Gate de custo:** o 21st.dev é plano PAGO. Esta fase só roda quando as fases 1-2 não cobrirem o efeito/section necessário E com aprovação do usuário. Não é mais mínimo obrigatório.

**Quando chamar (se aprovado):**

- 1 chamada de `inspiration` para o **hero** (ex: liquid glass hero, particle hero, mask reveal hero)
- 1 chamada para o **bloco principal de conversão** (ex: pricing, contact dialog, CTA group)
- 1 chamada para **selected work / portfolio grid** se o projeto for autoridade/portfolio
- 1 chamada para **navigation** se a direção visual exigir navbar não-padrão

Se o Magic MCP não estiver disponível no ambiente: declarar ao usuário "o Magic MCP do 21st.dev não está conectado nesta sessão" e perguntar se ele quer conectar ou seguir com as outras fontes. **Não cair pro fallback de criar do zero sem essa pergunta.**

### Fase 4: 21st CLI (catálogo e registry — fonte PAGA, complementar)

O v0 foi removido do ecossistema. Mesmo gate de custo da Fase 3: plano pago, usar só quando as fases gratuitas não cobrirem e com aprovação do usuário. Componente do time já publicado no registry conta como recurso já pago: pode usar sem novo gate.

**Fluxo resumido:**

1. Checar a CLI: `command -v 21st`. Se ausente, propor (opt-in, nunca auto-rodar): `npm i -g @21st-dev/cli && npx @21st-dev/cli install-skill` e `21st login` com o usuário.
2. Buscar: `21st search "<termo>"` (`--type component|theme|template`); inspecionar com `21st get <id>`.
3. Instalar o escolhido no projeto: `21st add <user>/<slug>` ou `npx shadcn@latest add <url do item>`; adaptar à marca.
4. Componente do time já publicado no registry `@wizzdigitalagency` tem prioridade sobre item público equivalente.



Se a CLI não estiver instalada e o usuário recusar o install: declarar e seguir pra Fase 5 (confirmação), nunca criar do zero em silêncio.

### Fase 5: Apresentação ao usuário e confirmação

Antes de implementar, apresentar ao usuário uma resposta estruturada:

```
Source-First Inventory para sua landing:

HERO (efeito liquid glass)
├─ Opção A: 21st.dev → componente "X" via Magic MCP (recomendado, já compatível com Next + Tailwind)
├─ Opção B: clonar Ali Imam → arquivo `liquid-wave.tsx` adaptado para token #FF4500
└─ Opção C: buscar/instalar alternativa via 21st CLI (`21st search` + `21st add`)

CAROUSEL DE PRODUTOS
├─ Opção A: Embla Carousel (lib oficial, já no seu /modelos lp/ em `air-pods-max-product-showcase`)
└─ Opção B: 21st.dev → "scroll-snap carousel" via Magic MCP

TEXT REVEAL HEADLINE
├─ Opção A: React Bits → `split-text-reveal.tsx` (precisa autorização pra clonar)
└─ Opção B: Framer Motion na mão (fallback aceitável, padrão simples)

PORTFOLIO GRID
├─ Opção A: clonar Cult UI → `marketing-grid.tsx`
└─ Opção B: 21st.dev → portfolio grid via Magic MCP

Posso prosseguir com (A, A, A, A) ou prefere ajustar?
```

Só implementar depois da confirmação do usuário sobre quais fontes usar.

### Quando é aceitável criar do zero

Existem 3 casos onde é OK criar do zero, e em todos deve ser declarado ao usuário:

1. **Componente trivial e específico da marca** (ex: WizzMark inline SVG do logo): sem fonte que faça sentido, custo de adaptação > custo de fazer
2. **Após esgotar as fases 1-4** sem encontrar componente compatível, com o usuário ciente disso
3. **Microcomponentes utilitários** (MonoLabel, Section wrapper) que são apenas estilização de tokens

Para todo o resto (shaders, animações complexas, hero pieces, carousels, cards 3D, hover effects, transições), **DEVE passar pelo Source-First Protocol antes de ser escrito do zero**.

