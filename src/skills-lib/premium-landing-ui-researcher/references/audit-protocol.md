## Audit Protocol

O Source-First Protocol cuida do **início** (curar fontes maduras antes de implementar). O Audit Protocol cuida do **fim** (validar qualidade antes de declarar a landing pronta).

Aplicar 3 passes em ordem. Cada um pega uma classe de problema diferente: usar os dois primeiros é redundante apenas em 60% dos casos; nos outros 40% um pega o que o outro deixou passar.

### Pass 1: Taste Skill (cedo, antes da implementação completa)

**Quando aplicar:** logo depois da Fase 5 do Source-First Protocol, quando você tem mockup/wireframe das seções ou primeira versão do hero implementada. Idealmente ainda dá tempo de trocar de componente sem custo alto.

**Fonte:** `https://github.com/Leonxlnx/taste-skill.git`

**Ângulo:** detector anti-AI-generic. Pergunta-chave: *"Esse layout poderia ser de qualquer SaaS genérico, ou tem assinatura autoral?"*

**O que procurar e marcar como problema:**

- Hero com "headline grande + subtítulo + 2 CTAs side-by-side" sem identidade própria
- Features em grid 3-col com ícones decorativos cute (estilo "✨ Fast 🚀 Reliable 🔥 Secure")
- Gradientes coloridos saturados sem propósito (purple-to-pink, blue-to-cyan padrão Tailwind)
- Copy de IA: "revolutionize your workflow", "supercharge your business", "10x your results"
- Layout simétrico perfeito sem tensão editorial
- Bordas arredondadas excessivas (`rounded-3xl` em tudo)
- Card stacks com shadow padrão `shadow-xl` Tailwind
- Emoji decorativo em qualquer lugar que não seja microcopy de status
- Testimonial cards genéricos com avatar redondo + nome + cargo + frase entre aspas
- Pricing cards com badge "Most Popular" centralizado e gradiente

**Saída do pass:** lista de até 5 pontos onde a landing parece template, com sugestão de **substituição** para cada um (componente de fonte autorizada, decisão editorial, ou remoção). Apresentar ao usuário antes de prosseguir.

### Pass 2: Impeccable (tarde, com tokens e conteúdo reais)

**Quando aplicar:** depois da implementação estar montada com tokens da marca, tipografia real, imagens/mockups reais. Pega problemas que só aparecem quando o componente está vivo, não em wireframe.

**Fonte:** `https://github.com/pbakaus/impeccable.git`

**Ângulo:** bagagem de design clássico. Pergunta-chave: *"Isso parece feito por um designer sênior com 10+ anos de bagagem editorial?"*

**O que procurar e marcar como problema:**

- **Spacing**: padding/margin inconsistente entre seções (24px aqui, 28px ali, 32px em outra). Definir e seguir uma escala (4/8/12/16/24/32/48/64/96/128)
- **Hierarchy**: títulos competindo entre si por peso/tamanho. H1, H2, H3 devem ter contraste claro
- **Leading**: `line-height` muito apertado em body (<1.5) ou muito largo em headlines (>1.15)
- **Tracking**: letter-spacing wrong em maiúsculas pequenas (mono labels precisam mais tracking, ~0.18em)
- **Optical alignment**: ícones com peso visual diferente do texto adjacente, números mono não monoespaçados na vertical
- **Ritmo vertical**: scroll sem respiração (seção atrás de seção sem ar) ou com buracos enormes inexplicáveis
- **Color hierarchy**: 5+ tons cinza para texto sem justificativa, accent usado em coisas que não são acionáveis
- **Image cropping**: thumbnails com aspect ratio inconsistente entre cards
- **Contraste tipográfico**: títulos heavy + body também heavy (faltou um light/regular pra criar contraste)
- **Edge cases**: o que acontece quando o nome do projeto tem 4 palavras vs 1? E quando a descrição tem 2 linhas vs 4?
- **Focus states**: o tab order entrega uma sequência editorial ou pula entre seções caoticamente?

**Saída do pass:** lista de até 7 ajustes finos com **antes/depois** específicos (ex: "Hero subhead: trocar leading 1.1 → 1.3" / "Cards grid: alinhar baseline da numeração mono com baseline da headline do card").

### Pass 3: Cross-check com referências

**Quando aplicar:** depois dos passes 1 e 2, com a landing visualmente refinada.

**Como usar agent-browser neste pass (ferramenta padrão):**

agent-browser navega autonomamente em Chrome via CDP e devolve **accessibility tree compacto com refs `@eN`** (~200-400 tokens), não depende de screenshots. Skill instalada via `npm install -g agent-browser` (repo: https://github.com/vercel-labs/agent-browser). Para ver o core skill da CLI: `agent-browser skills get core`.

Loop padrão:
```bash
agent-browser open <url>        # 1. abre a página
agent-browser snapshot -i       # 2. lê estrutura (interactive elements)
agent-browser get text @e1      # 3. inspeciona um nó específico
agent-browser eval "<js>"       # 4. mede tokens (computed styles, etc.)
```

**O que fazer:**

1. **Abrir a landing/dashboard** com `agent-browser open <url>` e capturar snapshot textual de cada seção crítica via `snapshot -i -s "<seletor>"` (escopo CSS).
2. **Abrir 1-2 referências** da direção aprovada na mesma sessão (`open` + `snapshot -i`): Linear, Stripe, Beli, Copilot Money etc, conforme o público.
3. **Comparar via accessibility tree + computed styles** (`get styles @eN` ou `eval "getComputedStyle(...)"`):
   - hierarquia tipográfica (tamanhos, pesos, tracking)
   - escala de radius e shadow
   - densidade vertical (padding/margin entre seções)
   - estados interativos (focus visible, contraste, tab order)
4. **Screenshot é opcional**: só use `agent-browser screenshot path.png` quando precisar de confirmação visual de algo que o accessibility tree não captura (atmosfera, gradientes, motion frozen).
5. Pergunta-chave: *"Está no mesmo degrau de qualidade visual ou ainda parece um nível abaixo?"*

**Diagnóstico:**

- Se a diferença for **gosto/direção** (escolhas conscientes de marca) → ok, manter
- Se a diferença for **execução** (a referência tem polish que falta na sua) → voltar pro Source-First e buscar o componente que falta
- Se a diferença for **fluidez de motion** → revisar timing, easing, escala e composição das animações (provavelmente faltou aplicar Design Motion Principles)
- Se a diferença for **densidade visual** (referência mais espaçada e respira mais) → cortar elementos, não adicionar

**Saída do pass:** veredicto curto: "pronta", "precisa de 1 pass mais (passe X)", ou "precisa voltar pro Source-First por causa de Y".

> **Regra**: agent-browser navega via accessibility tree (texto) por padrão. **Não tirar screenshots por reflexo**: é overhead desnecessário. Só capturar imagem quando o tree não responde a pergunta (ex: comparar atmosfera visual entre 2 sites).

### Pass 4: Acessibilidade e performance (sempre, antes de entregar)

Não é gosto, é qualidade técnica. Verificar:

- Contraste AA em todos os textos (mínimo 4.5:1 para body, 3:1 para large text)
- Tab order coerente, focus visible em todos os elementos clicáveis
- `prefers-reduced-motion` respeitado (3D off, animações simples)
- Mobile: hero estático funciona, scroll horizontal vira vertical, sem cursor custom
- Lighthouse: Desktop ≥ 90 Performance, 100 Accessibility, 100 SEO. Mobile ≥ 80 Performance, 100 Accessibility
- LCP < 2.5s, CLS < 0.1, INP < 200ms
- Bundle 3D faz lazy load (não bloqueia LCP)

### Ordem e custo de cada pass

| Pass | Quando | Custo de ajuste | Frequência |
|---|---|---|---|
| 1. Taste Skill | Wireframe / hero primeiro | Baixo (ainda dá pra trocar componente) | Sempre |
| 2. Impeccable | Implementação com tokens reais | Médio (CSS fino) | Sempre |
| 3. Cross-check | Visual final | Variável | Sempre |
| 4. Acessibilidade + Perf | Antes de entregar | Médio-alto (pode exigir refactor) | Sempre |

### Quando pular um pass

**Nunca pular sem declarar ao usuário.** Casos onde faz sentido pular:

- Pass 1 (Taste): pular se a direção visual veio inteira de uma referência específica que o usuário aprovou (ex: "clone exato do Everswap"): nesse caso, taste já foi decidido upstream
- Pass 2 (Impeccable): pular se a landing for v0 throwaway / wireframe interno, não entrega real
- Pass 3 (Cross-check): pular se não há referência pública disponível
- Pass 4 (Acessibilidade): **nunca pular**

Em qualquer pulada, declarar ao usuário: "vou pular o pass X porque Y, ok?". Nunca pular silenciosamente.

