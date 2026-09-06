## Mandatory Process

Sempre seguir este processo. **Os passos 6, 7 e 8 são CHECKPOINTS DE FONTES e devem ser executados antes de qualquer código de UI.**

1. Analisar o contexto do projeto.
2. Fazer até 5 perguntas se faltarem dados essenciais.
3. Classificar o nível do projeto.
4. Definir direção visual.
5. Decidir se precisa de landing, dashboard, 3D/WebGL ou combinação.
6. **CHECKPOINT: Inventário de fontes do usuário.** Listar e inspecionar (ls + leitura mínima de READMEs/package.json) o projeto atual e os modelos nos caminhos fornecidos pelo usuário; reutilizar o resumo de memória do handoff. Identificar quais componentes/efeitos do que ele já tem podem ser reutilizados antes de qualquer fonte externa.
7. **CHECKPOINT: Source-First Protocol (obrigatório).** Execute [source-first-protocol](source-first-protocol.md): busque fontes públicas, abra demos e código/registry, confira revisão, licença e dependências. Registre evidências e falhas no artefato de pesquisa; mostre 1–3 candidatos reais por componente.
8. **CHECKPOINT: Escolher fontes.** Recomende a combinação adequada. Com direção e implementação já autorizadas, prossiga; pergunte apenas se faltar uma decisão material.
9. Recomendar componentes e animações (já curados nos checkpoints anteriores).
10. Escrever copy e estrutura.
11. Sugerir plano de implementação (adaptação das fontes à marca, não recriação).
12. **CHECKPOINT: Audit Protocol** (Pass 1 Taste Skill → Pass 2 Impeccable → Pass 3 Cross-check → Pass 4 Acessibilidade/Perf). Definido em references/audit-protocol.md. Nunca pular passes silenciosamente.

### Checkpoint de honestidade: antes de implementar

Antes de escrever qualquer componente, responder internamente:

- Eu inspecionei o que o usuário já tem em `/modelos lp/` (ou equivalente)?
- Eu abri as fontes exatas e registrei código/registry, revisão/data, licença e dependências?
- Eu documentei candidatos aceitos/rejeitados e eventuais fontes indisponíveis?
- O componente que estou prestes a escrever do zero ficou sem alternativa compatível nas fontes efetivamente pesquisadas, com justificativa registrada?

Se a resposta for "não" para qualquer uma dessas perguntas, **PARE e volte para o Source-First Protocol antes de continuar**.

### Detalhamento das etapas

**Analisar o projeto.** Antes de criar ou alterar qualquer coisa, inspecione o projeto quando houver acesso ao repositório. Verifique: framework (Next.js, React, Vite, Remix), linguagem (TS/JS), styling (Tailwind, CSS Modules, styled-components, shadcn/ui, Radix), bibliotecas já instaladas (framer-motion, gsap, three, @react-three/fiber, lucide-react), estrutura de pastas, rotas existentes, componentes reutilizáveis, tema/cores/fontes/tokens, nível visual atual, problemas de UX, gargalos de conversão, responsividade e performance. Se não houver projeto acessível, trabalhar como planejador.

**Entender o negócio.** Sempre identificar: negócio/produto/serviço, público-alvo, objetivo da página, oferta, diferenciais, nível de consciência do público, objeções prováveis, tom de marca, etapa do funil, ação principal desejada.

**Escolher referências e componentes.** Com base no nível classificado, decidir: quais seções devem existir, quais componentes melhoram conversão, quais animações ajudam ou atrapalham, quais referências visuais combinam com a marca, quais efeitos no hero, quais elementos devem ser estáticos por performance, quais componentes criar do zero, quais vêm de fontes autorizadas. Toda animação deve ter função: clareza, desejo, profundidade, guia visual, prova de valor ou sofisticação.
