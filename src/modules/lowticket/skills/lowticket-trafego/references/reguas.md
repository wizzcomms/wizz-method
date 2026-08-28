# Réguas numéricas · diagnóstico de tráfego low ticket

> Fallback. A fonte canônica é o shard `03-campanha-bidcap.md` e `02-diagnostico-funil.md` de `lowticket-metodologia`. Esta página existe para a skill continuar utilizável quando o módulo de conhecimento não está instalado, e para a consulta rápida de um número.

## Bid cap

**Pré-requisitos antes de recomendar bid cap:** breakeven calculado, pelo menos 1 criativo validado, Pixel funcionando, CAPI funcionando, volume de conversão suficiente.

Sem isso, começar em Volume Mais Alto até acumular ~20 a 30 compras, e só então migrar. Não é convivência em paralelo, é sequência.

| Postura | Cálculo |
|---|---|
| Base | bid cap = breakeven |
| Agressivo | breakeven × 1,30 |
| Agressivo (recomendação operacional atual) | breakeven × 1,50 |

Exemplo: breakeven R$163 → bid cap agressivo R$244,50.

Se a campanha não consegue gastar dentro do bid cap, não force a entrega artificialmente.

## Régua de 3x

**Gasto acumulado abaixo de 3x o bid cap = campanha não julgada.** Nem criativo, nem página, nem checkout, nem orçamento. Informe o valor exato que falta.

Depois de 24h rodando E 3x o bid cap gasto, o pause é justificado quando: ROAS abaixo do breakeven, zero vendas, e nenhuma mudança estrutural recente explicando a queda.

## Hierarquia de métricas

`Vendas → Iniciar Checkout → CPC → Hook Rate → Hold Rate → CPM`

- **Hook rate** = reproduções de 3s ÷ impressões
- **Hold rate** = reproduções de 75% ÷ impressões
- **ROAS** = a coluna de ROAS da plataforma. Não reconstruir dividindo valor de resultado por custo por resultado: é outro número.

## Funil: as 4 transições e seus benchmarks

Taxa real = etapa seguinte ÷ etapa anterior. **Nunca** usar a porcentagem exibida pela plataforma, que costuma ter Visitas como base.

| Transição | Ruim | Médio | Saudável | Onde atacar |
|---|---|---|---|---|
| Cliques → Visitas | < 95% | (sem faixa média) | ≥ 95% | técnico: página lenta, redirect, SSL, mobile, PageView |
| Visitas → Iniciar Checkout | < 10% | 10-25% | 25-40%+ | criativo, página e oferta: mismatch, CTA fraco, preço antes do valor |
| Iniciar Checkout → Venda Iniciada | < 50% | 50-75% | 75-90% | checkout: campos, atrito, confiança, meio de pagamento, mobile |
| Venda Iniciada → Venda Aprovada | < 50% | 50-75% | 75-90% | pagamento: aprovação Pix, cartão recusado, recuperação |

**Ordem de ataque:** de trás para frente. Checkout e pagamento primeiro, página depois, criativo por último.

## Aprovação de Pix

- **abaixo de 70% = problema grave.** Para tudo e ataca checkout/pagamento antes de qualquer outra coisa.
- **75% = meta** de operação saudável.

Cruzar o número da plataforma de tráfego com o da plataforma de pagamento. Se a campanha caiu e a aprovação de Pix caiu junto, o criativo não é o culpado.

## Escala

Alavancas, nesta ordem: (1) subir o bid cap, (2) adicionar criativos validados, (3) orçamento inflado com o bid cap segurando o gasto real.

**Nunca** como primeira alavanca: subir o orçamento diário. O orçamento dá permissão para gastar; o bid cap é o teto real de aquisição.

Trava depois de mexer: **ressaca de 48 a 72h** após mudança estrutural, e a régua de 3x antes de julgar de novo.

## Cadência e saturação

- 1 lote novo de criativos por semana, iniciado na virada de segunda-feira.
- ~15 dias sem lote novo = problema estrutural de cadência.
- Frequência acima de 3 em 7 dias = início de saturação. É bandeira para cruzar com vendas, ROAS, gasto e entrega, não pause automático.
- Detalhamento por idade a cada ~14 dias: o Advantage+ esconde diferença no agregado. Usar o histórico da própria conta, sem regra universal de faixa etária.

## O que não recomendar como padrão

ABO · interesses · segmentação excessiva · duplicação de campanha · vários conjuntos sem necessidade · aumento agressivo de orçamento diário · pause antes de 3x bid cap · decisão só por CPM · decisão só por CTR · troca simultânea de criativo, página e checkout.
