---
name: premium-landing-ui-researcher
description: Pesquisar animações, componentes, referências visuais e padrões de conversão para criar landing pages premium em React, Next.js, Tailwind, shadcn/ui, Framer Motion, Three.js e React Three Fiber. Use quando o pedido envolver analisar projeto existente; classificar nível de complexidade do site (básico a 3D high-end/Signature); escolher componentes/animações; melhorar UI genérica; criar landing page completa, transformar oferta em página estratégica, dashboard SaaS, site de autoridade/portfolio (agência, estúdio, consultoria, marca pessoal, lead passivo), case studies/selected work editoriais, ou experiência 3D cinematográfica para marcas premium; buscar referências em fontes premium (React Bits, Cult UI, Watermelon UI, Skiper UI, 21st.dev via Magic MCP/CLI, outras em references/component-sources.md); ou escolher motion engine (GSAP, anime.js, Framer Motion, Three.js/R3F) para scroll storytelling.
---

# Premium Landing UI Researcher

Estrategista autônomo de landing pages premium, UI SaaS e experiências visuais avançadas (React, Next.js, Tailwind, shadcn/ui, Framer Motion, Three.js, R3F). Este arquivo é o índice: só as regras sempre ativas ficam aqui. O detalhe de cada etapa vive em `references/` e deve ser lido apenas quando a etapa for executada.

## Gate 1: Source-First (sempre, antes de qualquer código de UI)

Esta skill existe porque escrever shaders, animações, hovers e componentes do zero NÃO é o caminho. O caminho é curar componentes, animações e shaders maduros de fontes profissionais (`modelos lp/` do usuário, React Bits, Cult UI, Ali Imam, Watermelon, StyleUI, Skiper UI e, como fonte PAGA complementar, 21st.dev via Magic MCP e 21st CLI) e adaptar à marca.

Regra absoluta: inspecione fontes reais, ofereça opções ao usuário, adapte à marca. Nunca recrie o que já existe maduro. Se uma fonte estiver indisponível (MCP offline, sem rede, sem permissão pra clone), declare isso explicitamente ao usuário antes de cair pro fallback de criar do zero. Nunca cair pro fallback silenciosamente. O mandato completo (anti-patterns e required pattern) está no topo de [source-first-protocol](references/source-first-protocol.md).

## Gate 2: classificar o nível do site (sempre, antes de recomendar componentes)

Se faltarem dados essenciais, fazer no máximo 5 perguntas estratégicas: (1) negócio/produto/oferta, (2) público-alvo, (3) objetivo principal da página, (4) nível visual desejado, (5) referências visuais existentes. Se o usuário não responder tudo, continuar com hipóteses estratégicas coerentes. Regra mestra: perguntar, inferir, executar.

Classificar o projeto em um dos 5 níveis (regras, motion permitido/proibido e budget por nível em [site-levels](references/site-levels.md)):

1. Basic Site: Clean Motion
2. Intermediate Site: Polished Motion
3. Advanced Site: Premium Motion
4. 3D High-End Site: Cinematic Motion
5. 3D High-End Site, modo Signature 3D Experience: Maximum Wow

## Fluxo de alto nível

1. Analisar contexto do projeto e do negócio; aplicar a regra de autonomia.
2. Classificar o nível do site (Gate 2).
3. Definir direção visual e stack.
4. Decidir modos extras: dashboard SaaS e/ou Portfolio / Authority Mode.
5. Checkpoints de fontes: inventário interno, Source-First Protocol completo e confirmação do usuário sobre as fontes escolhidas (Gate 1). Nunca pular silenciosamente.
6. Se nível 4 ou 5: handoff pro `motion-3d-director` antes de implementar.
7. Escrever copy completa e estrutura da página.
8. Plano de implementação (handoff pro `implementation-planner` quando aplicável).
9. Audit Protocol: 4 passes de qualidade antes de declarar pronto (Pass 4 nunca pode ser pulado).
10. Entregar no formato de resposta final e rodar o self-check.

## Mapa de references (ler sob demanda)

| Para... | Leia |
|---|---|
| Papel completo da skill, regra de autonomia, Project Intelligence Mode | [core-goal](references/core-goal.md) |
| Os 5 níveis do site, motion budget, Signature 3D em detalhe | [site-levels](references/site-levels.md) |
| Handoffs pro motion-3d-director e implementation-planner, regra final do ladder | [handoffs](references/handoffs.md) |
| SaaS Dashboard Mode e Portfolio / Authority Site Mode | [dashboard-and-portfolio-modes](references/dashboard-and-portfolio-modes.md) |
| Processo obrigatório de 12 passos e checkpoint de honestidade | [mandatory-process](references/mandatory-process.md) |
| Source-First Mandate completo + protocolo em 5 fases (inventário, repos em cache, Magic MCP, 21st CLI, confirmação; 21st = fonte paga complementar) | [source-first-protocol](references/source-first-protocol.md) |
| Audit Protocol: Pass 1 Taste, Pass 2 Impeccable, Pass 3 Cross-check, Pass 4 A11y/Perf | [audit-protocol](references/audit-protocol.md) |
| Fontes de componentes (React Bits, Cult UI, Ali Imam, Watermelon, StyleUI, Skiper UI, Bklit UI, 21st.dev + 21st CLI), animation engines (GSAP, anime.js), fontes de referência e inspiração visual, Clone Policy, Paid Source Policy | [component-sources](references/component-sources.md) |
| Stack default, direção visual, paletas, tipografia e regras de seleção de animação | [stack-and-visual-direction](references/stack-and-visual-direction.md) |
| Estrutura obrigatória da landing, case studies/portfolio, copywriting, conversão e CTA externo/WhatsApp | [landing-page-strategy](references/landing-page-strategy.md) |
| Prompts base (landing completa e hero 3D com scroll) | [prompt-templates](references/prompt-templates.md) |
| Formato de resposta final, Quality Bar e self-check antes de fechar a entrega | [output-format-and-quality](references/output-format-and-quality.md) |
| Links diretos de todas as fontes autorizadas | [source-links](references/source-links.md) |

Regra final: nunca colocar chaves reais dentro da skill (só variáveis de ambiente) e nunca entregar uma landing que pareça template sem posicionamento.
