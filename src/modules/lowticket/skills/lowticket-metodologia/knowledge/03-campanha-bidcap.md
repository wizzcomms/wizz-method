## 3. Campanha, BidCap e escala

> Shard da metodologia desta base. Índice: [`INDEX.md`](INDEX.md) · Sempre carregado junto: [`guardrails.md`](guardrails.md)
> Onde a skill genérica contradisser este shard, **o shard vence**, e isso deve ser dito na resposta.

### 3.1 Estrutura

- **Primária: BidCap.** Sob o algoritmo Andromeda, o BidCap é superior ao modelo BO por dar previsibilidade e controle de gasto.
- **Secundária: ABO**, desativar se a performance for ruim.
- Não é troca completa: prioriza-se BidCap enquanto se mantém o BO/orçamento rodando e otimizando em paralelo.

### 3.2 Regras de bid e orçamento

- Não baixar o BidCap enquanto a performance estiver alta. Com RPU de R$ 20–23, mantém-se o bid e dá-se liberdade para o Facebook gastar.
- **CPA máximo = break-even + 30%.** Essa é a margem de erro aceitável.
- Testar orçamentos maiores (ex: R$ 500) dentro dessa margem.
- **Janela de 10 dias:** o Facebook leva até 10 dias para readquirir inteligência depois de mudanças. Não continuar testando indefinidamente além disso.
- **Escala de no máximo +30% ao dia.** Subir mais que isso reseta o aprendizado.
- **Bid cap inicial ancorado no ticket médio, com folga:** a fonte de origem manda começar em torno de 50% acima do ticket e ajustar diariamente conforme as vendas entram. Ex.: ticket de R$50 → bid cap na casa de R$75.

### 3.3 Análise e corte

- **Nível de análise é o anúncio individual**, não o conjunto.
- **Desligar criativo com ROI < 1.3.** Manter os vencedores ativos.
- Isso permite testar criativo novo sem afetar o vencedor.

### 3.4 Quando escalar

RPU acima de R$ 20 e consistência de vendas diárias. Aí sobe o orçamento respeitando o CPA máximo (break-even + 30%).

### 3.5 Ritmo de análise

Métricas macro (30 dias) e micro (últimos 7 dias), **diariamente**.

### 3.6 Infraestrutura de conta: LALF, proxy e verificação

A fonte de origem trata CPM/CPC baixo como resultado de **infraestrutura de conta**, não só de criativo. O setup vem antes da estratégia.

**Ordem de instalação (a fonte de origem insiste que é o primeiro passo, seja qual for a estratégia):**

1. Instalar o **LALF** (Link Automatizado Link Flutuante) — funciona como multi-login e elimina a edição manual de perfil.
2. Criar um grupo exclusivo para o próprio perfil (nome pessoal).
3. Criar um novo perfil dentro desse grupo e usá-lo como **proxy**.

> Ordem declarada pela fonte: o multi-login vem primeiro, antes de qualquer outra peça da infraestrutura.

**Alavancas de CPM/CPC citadas:**

- **Proxy é tratado como essencial** para manter CPM/CPC baixos, independentemente do tipo de oferta.
- **Anúncio verificado reduz CPC** de forma significativa — a verificação entra como item de checklist técnico, não como detalhe.
- **Vídeo com engajamento orgânico forte bate estático/texto** para derrubar CPC.
- **Nicho específico bate categoria ampla.** Evitar "todas as mães"; restringir a subnichos onde a demanda é menor mas a concorrência é mínima. É a mesma lógica de subnicho da seção 4.5, aplicada ao alvo em vez do criativo.
- **Horário inicial da manhã** tende a entregar CPM/CPC mais baixos para oferta low ticket ou de alto volume.

**Colunas manuais no Gerenciador (quando não há Utmify):** montar a predefinição com Veiculação, Custo por Resultado, Valor de Conversão da Compra e Custo por Clique no Link, e salvar como "Predefinição" para reuso.

**Redundância de acesso:** compartilhar o acesso à página entre perfis diferentes, como proteção contra perda de senha. Permite continuar operando as mesmas campanhas se um acesso cair.

> ⚠️ **Compra de engajamento — registrado, não recomendado.** A fonte de origem cita uma ferramenta paga para comprar likes e comentários em vídeos e inflar sinais de engajamento para o algoritmo. Isso é **engajamento inautêntico e viola os Termos da Meta**, com risco de banimento da conta e da BM — justamente os ativos que o resto desta seção está tentando proteger. Fica registrado porque está no material de origem, mas não entra como prática recomendada aqui. Ver [guardrails 20](guardrails.md).

### 3.7 A régua do gestor de tráfego

Este arquivo é o **prompt operacional de diagnóstico de campanha** de origem. As réguas embutidas nele são a leitura mais explícita e mais recente da metodologia sobre BidCap e escala, e por isso resolvem vários pontos que estavam em aberto.

**Estrutura padrão declarada:** 1 campanha, 1 conjunto, X criativos. **CBO + Bid Cap + Advantage+, sem interesses.** A segmentação é feita pelo criativo, não pelo público. O prompt **proíbe ABO como padrão**, assim como interesses, segmentação excessiva e duplicação de campanhas.

**Cálculo do Bid Cap:**

- Base: **Bid Cap = Breakeven**.
- Agressivo: Breakeven × 1,30 ou × 1,50.
- **Recomendação operacional atual: +50% sobre o breakeven.**
- Pré-requisitos para usar Bid Cap: breakeven calculado, ao menos 1 criativo validado, Pixel ok, CAPI ok e dados suficientes. Sem isso, começar em **Volume Mais Alto até ~20-30 compras**.

**A régua de 3x — a mais importante da seção:** não julgar, não pausar e não alterar nada antes de a campanha nova acumular **gasto de 3x o Bid Cap**. Abaixo de 24h é validação, não resultado.

**Hierarquia de métricas (nessa ordem):** Vendas > IC > CPC > Hook Rate > Hold Rate > CPM.

- **Hook Rate** = reproduções de 3s ÷ impressões.
- **Hold Rate** = reproduções de 75% ÷ impressões.
- ROAS: usar direto a coluna "ROAS de resultados", **nunca** calcular valor ÷ custo à mão.

**Pausar criativo só com os 4 juntos:** gasto ≥ 3x Bid Cap **e** ROAS abaixo do breakeven **e** zero vendas **e** nenhuma mudança estrutural recente.

**Escala — a ordem das alavancas:** nunca subir orçamento diário como primeira alavanca. As alavancas certas, na ordem: (1) subir o Bid Cap, (2) adicionar criativos já validados, (3) orçamento inflado com o Bid Cap controlando o gasto real.

**Cadência e saturação:**

- **1 lote de criativos novos por semana, segunda-feira 00:01.** ~15 dias sem lote novo = problema estrutural, não de performance.
- **Análise por idade a cada ~14 dias** (o Advantage+ pode esconder diferenças; 65+ tende a converter menos, mas não é regra universal).
- **Frequência > 3 em 7 dias** = início de saturação. Não pausar automaticamente: cruzar com os outros dados.
- **Ressaca de aprendizado:** mudança estrutural gera ~48-72h de instabilidade. Antes de julgar um número ruim, investigar o que mudou nas últimas 72h.

**Uma mudança por vez.** Nunca trocar criativo + LP + checkout + orçamento + BidCap ao mesmo tempo: o resultado fica ilegível.

> **Não mexer é decisão válida.** O prompt trata esperar por evidência suficiente como ação legítima, não como omissão. É a mesma postura da régua de 3x e do corte de 14 dias do minerador (12.5).
