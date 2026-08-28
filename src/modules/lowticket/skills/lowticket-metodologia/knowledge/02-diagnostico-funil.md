## 2. Diagnóstico de funil (Utmify) — o coração do método

> Shard da metodologia desta base. Índice: [`INDEX.md`](INDEX.md) · Sempre carregado junto: [`guardrails.md`](guardrails.md)
> Onde a skill genérica contradisser este shard, **o shard vence**, e isso deve ser dito na resposta.

Esta é a seção mais importante de origem. **Toda decisão de tráfego pago passa por identificar qual transição do funil está furando.** Regra de ouro: diagnostica-se **do fim para o começo**.

### 2.1 As 5 transições e seus benchmarks

Base do funil = Visitas à Página = 100%.

| # | Transição | Ruim | Médio | Saudável |
|---|-----------|------|-------|----------|
| 1 | Cliques no Anúncio → Visitas na Página | < 70% | 70–90% | ≥ 95% |
| 2 | Visitas na Página → Iniciar Checkout (IC) | < 10% | 10–25% | 25–40%+ |
| 3 | Iniciar Checkout → Venda Iniciada | < 50% | 50–75% | 75–90% |
| 4 | Venda Iniciada → Venda Aprovada (PIX) | < 50% | 60–75% | 75–90% |
| 5 | Venda Iniciada → Venda Aprovada (Cartão) | < 60% | 60–75% | 75–90% |

**Cálculo:** taxa real de cada transição é uma etapa dividida pela anterior, não pela base fixa. Ex: `IC / Visitas × 100`.

### 2.2 Transição 1: Cliques → Visitas (< 95% = problema técnico, não de marketing)

**Causas:** LP lenta (>3s no 3G), redirect quebrado ou em loop, erro de SSL, LP quebrada no mobile (95% do tráfego é mobile), Pixel não disparando `PageView` (aqui a medição está errada, não a conversão).

**Ações:** testar LP com throttling 3G no DevTools; rodar PageSpeed Insights e Core Web Vitals (LCP, CLS, INP); clicar direto para a LP sem link tracker no meio; confirmar Pixel e `PageView`.

> Se o furo está aqui, é trabalho de dev. Resolve e volta. Não mexer em criativo.

### 2.3 Transição 2: Visitas → IC (a que mais revela casamento criativo + LP + oferta)

**Causas:**
- Mismatch criativo ↔ LP: o criativo prometeu A e a LP entrega B.
- Criativo qualifica errado: público certo, mas o gancho puxa curiosidade em vez de intenção de compra.
- Oferta genérica: não fica claro por que comprar essa e não outra.
- CTA escondido ou fraco ("saiba mais" em vez de "quero comprar").
- Preço aparece antes do valor.
- Público desqualificado no ADV+: o Meta jogando para faixa sem capacidade de pagar.
- Ressaca de aprendizado: mexeu em checkout/pixel há menos de 72h.

**Ações, em ordem de esforço:** cruzar copy do criativo com a headline da LP; ver mapa de calor (Clarity, Hotjar) para achar onde o usuário para de rolar; confirmar CTA acima da dobra no mobile; testar hero mais direto (promessa + prova social imediata + CTA); se está em ADV+, abrir por idade e revisar a cada 14 dias, porque a faixa boa fica escondida no agregado; se mexeu em checkout/pixel, esperar 48–72h antes de julgar; testar gancho de **intenção** ("pra quem vende X") contra gancho de **curiosidade** ("olha o que descobri").

> **Regra dos 3x bidcap:** antes de mexer em criativo, gastar pelo menos 3x o valor do bid. Pausar antes disso é decisão viesada por amostra pequena.

### 2.4 Transição 3: IC → Venda Iniciada (quase sempre atrito no checkout)

A pessoa clicou em "quero comprar" e não preencheu. É atrito, medo ou falta de gatilho.

**Causas:** checkout com campos e passos demais; sem prova social visível no checkout; sem urgência explícita (timer, "restam X vagas"); sem selo de segurança; PIX não destacado (público BR prefere PIX); preço final diferente do prometido; order bump agressivo ou confuso, que faz desistir do carrinho inteiro.

**Ações:** simplificar para checkout de uma página (Hotmart e Kiwify já entregam); banner de prova social ao vivo ("Fulano de São Paulo comprou há 2min"); timer visível, mesmo simbólico; selo de compra segura grande, com cadeado ao lado do CPF; PIX como primeira opção, não cartão como default; depoimento em vídeo de 10–15s rodando no checkout; se tem order bump, testar 3 dias sem ele e comparar; testar sem exigir criação de senha antes da compra.

### 2.5 Transição 4: Venda Iniciada → Aprovada (dinheiro puro perdido)

A pessoa já quis pagar. Gerou PIX ou lançou cartão e não confirmou.

**Causas:** plataforma com taxa de aprovação de PIX ruim (<70%); sem recuperação automática de PIX pendente; cartão negado sem retry; fluxo de "seu PIX está expirando" desligado.

**Ações:** ativar recuperação de PIX pendente (Utmify dispara WhatsApp e e-mail automático em 5min, 30min e 2h); conferir a taxa real de aprovação de PIX da plataforma e comparar Hotmart, Kiwify, Cakto; ativar retry automático de cartão negado; cruzar com os dados da própria plataforma, que mostra aprovação real por método.

> **Aprendizado registrado:** plataforma que aprova PIX abaixo de 70% quebra a campanha inteira. É motivo suficiente para migrar de plataforma.

### 2.6 Hierarquia: o que atacar primeiro

Se dá para mexer em uma coisa só, siga esta ordem:

1. **Venda Iniciada → Aprovada.** ROI mais rápido do funil inteiro; recuperar 15% aqui é dinheiro que já era seu.
2. **IC → Venda Iniciada.** Ajuste de checkout é barato e rápido, ganho grande com pouco esforço.
3. **Visitas → IC.** Mexer em LP e criativo. Mais lento e mais caro; só depois que o checkout está resolvido.
4. **Cliques → Visitas.** Técnico. Chama dev.

**Métrica mãe (ordem de prioridade):** Vendas > Iniciar Checkout > CPC > Hook Rate > Hold Rate > CPM.
Não se mexe em CPC se a LP não converte. Não se mexe em CPA se o checkout está furando.

### 2.7 Gerar o funil visual com IA

Dá para colar prints do Meta Ads Manager e pedir o funil em HTML: a IA lê as métricas, calcula as taxas reais de transição e gera cards de ROAS, CPA, ticket médio e faturamento, mais uma seção de diagnóstico contra os benchmarks acima.

**Métricas que precisam aparecer no print:** cliques no link, visualizações da LP, finalizações de compra iniciadas, compras (ou "resultados" se otimizado para compra), valor gasto e valor atribuído.

### 2.8 ROI verdadeiro vs. ROI falso

ROI falso é calculado antes da venda e ignora impostos, taxas de plataforma e comissões. ROI verdadeiro considera o pós-venda completo: quantos completaram a compra e quanto sobrou de receita real depois de todos os custos.
