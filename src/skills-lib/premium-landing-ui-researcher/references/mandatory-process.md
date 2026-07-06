## Mandatory Process

Sempre seguir este processo. **Os passos 6, 7 e 8 são CHECKPOINTS DE FONTES e devem ser executados antes de qualquer código de UI.**

1. Analisar o contexto do projeto.
2. Fazer até 5 perguntas se faltarem dados essenciais.
3. Classificar o nível do projeto.
4. Definir direção visual.
5. Decidir se precisa de landing, dashboard, 3D/WebGL ou combinação.
6. **CHECKPOINT: Inventário de fontes do usuário.** Listar e inspecionar (ls + leitura mínima de READMEs/package.json) o conteúdo de `/modelos lp/` (ou pasta equivalente que o usuário tiver), do projeto atual se houver, e do cérebro/vault. Identificar quais componentes/efeitos do que ele já tem podem ser reutilizados antes de qualquer fonte externa.
7. **CHECKPOINT: Source-First Protocol (obrigatório).** Executar o protocolo definido em references/source-first-protocol.md: invocar Magic MCP do 21st.dev, v0 via MCP, e pedir autorização pra clones temporários quando aplicável. Voltar pro usuário com **3-5 opções concretas de componentes/animações reais** com link/nome da fonte. Nunca pular este passo silenciosamente.
8. **CHECKPOINT: Apresentar opções e obter confirmação.** Mostrar ao usuário o que cada fonte oferece e qual combinação faria sentido para a landing dele. Só prosseguir quando ele aprovar a direção das fontes escolhidas.
9. Recomendar componentes e animações (já curados nos checkpoints anteriores).
10. Escrever copy e estrutura.
11. Sugerir plano de implementação (adaptação das fontes à marca, não recriação).
12. **CHECKPOINT: Audit Protocol** (Pass 1 Taste Skill → Pass 2 Impeccable → Pass 3 Cross-check → Pass 4 Acessibilidade/Perf). Definido em references/audit-protocol.md. Nunca pular passes silenciosamente.

### Checkpoint de honestidade: antes de implementar

Antes de escrever qualquer componente, responder internamente:

- Eu inspecionei o que o usuário já tem em `/modelos lp/` (ou equivalente)?
- Eu invoquei o Magic MCP do 21st.dev, ou declarei explicitamente que está indisponível?
- Eu pedi autorização para clonar fontes autorizadas quando elas tinham o efeito ideal (Ali Imam pra shader, React Bits pra animação, Cult UI pra section)?
- O componente que estou prestes a escrever do zero **realmente não existe** em nenhuma das fontes inventariadas?

Se a resposta for "não" para qualquer uma dessas perguntas, **PARE e volte para o Source-First Protocol antes de continuar**.

### Detalhamento das etapas

**Analisar o projeto.** Antes de criar ou alterar qualquer coisa, inspecione o projeto quando houver acesso ao repositório. Verifique: framework (Next.js, React, Vite, Remix), linguagem (TS/JS), styling (Tailwind, CSS Modules, styled-components, shadcn/ui, Radix), bibliotecas já instaladas (framer-motion, gsap, three, @react-three/fiber, lucide-react), estrutura de pastas, rotas existentes, componentes reutilizáveis, tema/cores/fontes/tokens, nível visual atual, problemas de UX, gargalos de conversão, responsividade e performance. Se não houver projeto acessível, trabalhar como planejador.

**Entender o negócio.** Sempre identificar: negócio/produto/serviço, público-alvo, objetivo da página, oferta, diferenciais, nível de consciência do público, objeções prováveis, tom de marca, etapa do funil, ação principal desejada.

**Escolher referências e componentes.** Com base no nível classificado, decidir: quais seções devem existir, quais componentes melhoram conversão, quais animações ajudam ou atrapalham, quais referências visuais combinam com a marca, quais efeitos no hero, quais elementos devem ser estáticos por performance, quais componentes criar do zero, quais vêm de fontes autorizadas. Toda animação deve ter função: clareza, desejo, profundidade, guia visual, prova de valor ou sofisticação.

