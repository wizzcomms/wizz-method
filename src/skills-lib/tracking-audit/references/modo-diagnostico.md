# Modo diagnóstico

Está rodando e o número não fecha. Este modo descobre **qual transição está furando** e separa problema de medição de problema de conversão.

Régua: leia o Passo 0 do `SKILL.md`. Cada faixa citada no relatório declara de onde veio.

## As 5 transições

Base do funil é a visita à página, igual a 100%. A taxa real de cada transição é a etapa dividida pela **anterior**, nunca pela base.

| # | Transição | O que ela revela |
|---|---|---|
| 1 | Cliques no anúncio → Visitas na página | Saúde técnica: velocidade, redirect, SSL, mobile, disparo do `PageView` |
| 2 | Visitas → Checkout iniciado | Casamento entre criativo, página e oferta |
| 3 | Checkout iniciado → Venda iniciada | Atrito de checkout: campos, meios de pagamento, frete, taxa surpresa |
| 4 | Venda iniciada → Aprovada (PIX) | Recuperação: lembrete, prazo, instrução |
| 5 | Venda iniciada → Aprovada (cartão) | Recusa: antifraude, parcelamento, emissor |

Sempre diagnosticar **do fim para o começo**.

## Hierarquia do que atacar primeiro

Se dá para mexer em uma coisa só:

1. **Venda iniciada → aprovada.** O ROI mais rápido do funil. Esse dinheiro já era seu.
2. **Checkout iniciado → venda iniciada.** Ajuste barato, ganho grande.
3. **Visitas → checkout.** Página e criativo. Mais lento e mais caro; só depois que o checkout está resolvido.
4. **Cliques → visitas.** Técnico. Chama dev.

Ordem de prioridade das métricas: vendas > checkout iniciado > CPC > hook rate > hold rate > CPM. Não se mexe em CPC se a página não converte. Não se mexe em CPA se o checkout está furando.

## Medição contra conversão

Antes de dizer "a conversão caiu", prove que a **medição** está de pé. As três perguntas:

| Sintoma | Se for medição | Se for conversão |
|---|---|---|
| Cliques muito acima das visitas | `PageView` não dispara, ou dispara tarde | Página fora do ar, redirect quebrado |
| Venda no banco e não no gerenciador | Falta CAPI, falta domínio verificado, iOS | Nada: a venda existe |
| Venda no gerenciador e não no banco | Deduplicação ausente, evento duplicado | Nada: a venda não existe |
| Orgânico subindo sozinho | Rota sem UTM | Recompra e boca a boca de verdade |
| Atribuição some ao renomear campanha | Atribuição por nome, não por ID | Nada |

Regra prática: se as duas fontes discordam, a discordância **é** o achado. Nunca escolha a fonte que confirma a tese.

## Qual dado falta para decidir

Parte do trabalho é dizer o que não dá para responder ainda. Formato:

```
PENDÊNCIA: não dá para separar atrito de checkout de desistência de preço.
Falta: evento AddPaymentInfo.
Custo de instalar: baixo.
O que muda quando existir: a transição 3 vira duas, e o conserto deixa de ser chute.
```

Nunca invente o número que falta. Um "provavelmente uns 30%" contamina a decisão inteira.

## ROI verdadeiro contra ROI falso

- **ROI falso:** valor atribuído pelo gerenciador dividido pelo gasto do gerenciador. Conta venda que não entrou e ignora venda que entrou sem atribuição.
- **ROI verdadeiro:** faturamento aprovado no banco próprio, menos taxa da plataforma e menos reembolso, dividido pelo gasto real do período.

Sempre reporte os dois lado a lado. A diferença entre eles é o tamanho do buraco de medição.

## Leitura de print do gerenciador

Métricas que precisam aparecer no print para o diagnóstico rodar:

cliques no link, visualizações da página, checkouts iniciados, compras (ou resultados quando a campanha otimiza para compra), valor gasto, valor atribuído.

Faltou alguma: diga qual e o que ela impede de calcular. Não estime.
