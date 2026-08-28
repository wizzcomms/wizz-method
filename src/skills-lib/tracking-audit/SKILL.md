---
name: tracking-audit
description: Auditoria e diagnóstico de rastreamento de resposta direta em dois modos. Modo implantação valida pixel, CAPI, domínio verificado, eventos priorizados, template de UTM com ID, repasse do parâmetro nativo pelo checkout, higiene de nomenclatura e compra-teste por caminho. Modo diagnóstico lê as transições do funil contra a régua, separa problema de medição de problema de conversão e diz qual transição está furando. Use quando alguém perguntar "por que a venda não bate com o gerenciador", "onde está furando o funil", "meu pixel está certo?", "as UTMs estão corretas?", "o tráfego orgânico está inflado", "qual dado falta pra eu decidir", ou antes de subir campanha nova. NÃO use para desenhar plano de medição de SaaS/produto (use analytics-tracking), para decidir bid e orçamento (use paid-ads) nem para criar a oferta (use wizz-offer-forge).
---

# Tracking Audit

Auditoria de rastreamento para oferta de resposta direta. Uma hora aqui evita 30 dias de campanha medida errado.

A skill faz duas coisas e nada além: **valida o que foi instalado** e **diz onde o funil está furando**. Ela não cria oferta, não decide bid e não escreve copy.

## Passo 0 — Achar a régua (obrigatório, sempre)

Benchmark sem origem é chute. Antes de qualquer análise, resolva de onde vêm os números, nesta ordem:

1. **Skill `lowticket-metodologia` instalada?** Se sim, ela tem precedência. Leia a entrada de diagnóstico de funil no INDEX dela e use os benchmarks de lá. Declare na resposta: "régua: metodologia low ticket".
2. **O projeto tem histórico próprio?** Trinta dias de dados reais do mesmo público valem mais que qualquer benchmark de mercado. Use a mediana do próprio histórico como linha de base.
3. **Nenhum dos dois?** Peça ao usuário. Não invente faixa, não use número de memória, não cite benchmark sem dizer de onde saiu.

> Regra anti-invenção: todo número que aparecer no relatório tem fonte declarada, ou vira PENDÊNCIA. Um relatório com faixa inventada é pior que nenhum relatório, porque parece medido.

## Escolher o modo

| O pedido é... | Modo | Referência |
|---|---|---|
| Vou subir campanha, está tudo instalado? | implantação | `references/modo-implantacao.md` |
| Está rodando e o número não fecha | diagnóstico | `references/modo-diagnostico.md` |
| A venda não bate com o gerenciador | diagnóstico, começando por atribuição | `references/utm-e-atribuicao.md` |
| Como monto as UTMs desta conta | implantação, só a parte de tags | `references/utm-e-atribuicao.md` |

Em dúvida entre os dois: se existe dado rodando, é diagnóstico. Implantação é para o que ainda não subiu.

## Os princípios que decidem no empate

- **O banco próprio é a fonte de verdade.** Gerenciador e Analytics perdem venda (bloqueador, iOS, cookie recusado). O número oficial vem do banco alimentado por webhook da plataforma de pagamento. Quando as duas fontes divergem, a divergência é o achado, não um erro de leitura.
- **O pixel mede o pixel.** Connect rate é o instante em que o `PageView` dispara, não o instante em que a pessoa vê a oferta. Subir o pixel sem consertar a página é maquiagem de métrica.
- **Atribuir por ID, não por nome.** A UTM carrega nome e ID. Renomear campanha não pode quebrar a atribuição.
- **Orgânico não é canal, é ausência de UTM.** O balde "organic" é destaque sem tag, direct e recompra. Taguear tudo e ver o orgânico cair é a prova da origem real.
- **Higiene de nomenclatura é infraestrutura.** Nome de campanha sujo não se conserta depois: a plataforma continua servindo o nome antigo em cache para o que já foi entregue.
- **Diagnóstico é do fim para o começo.** Sempre. Recuperar venda iniciada é dinheiro que já era seu; mexer em criativo com checkout furando é desperdício.

## Entradas que a auditoria precisa

Peça de uma vez, não uma por uma:

- URL da página de vendas e da página de checkout
- Plataforma de checkout e de pagamento
- Print ou export do gerenciador com: cliques no link, visitas à página, checkouts iniciados, compras, valor gasto, valor atribuído
- Acesso (ou print) do painel de atribuição, quando existir
- O template de UTM que está colado hoje no campo de parâmetros de URL

Faltou item: siga com o que dá e liste o que falta em PENDÊNCIAS. Nunca preencha buraco de dado com estimativa.

## Saída

Um relatório em markdown, sempre com estas quatro partes:

1. **Achados por severidade.** `CRÍTICO` (o dado está errado e a decisão em cima dele também), `ALTO` (perde venda ou perde atribuição), `MÉDIO` (higiene, vai doer depois), `BAIXO` (melhoria).
2. **A transição que está furando**, com a taxa real calculada e a régua ao lado, sempre com a fonte da régua.
3. **O que consertar, em ordem**, seguindo a hierarquia do modo diagnóstico. Um item por linha, com quem resolve (dev, checkout, criativo, página).
4. **Plano de tags pronto para colar**, quando o modo for implantação ou quando a auditoria encontrar UTM errada.

Feche com **PENDÊNCIAS**: o que não deu para verificar e o que precisa de acesso ou de dado que não veio.

## Ferramentas

- Inspeção de página: CLI `agent-browser`. Nunca Playwright.
- Nada mais é obrigatório. A auditoria funciona lendo print e página.

## Quando delegar

| Situação | Vai para |
|---|---|
| O furo é a página (LCP, mobile, blocos) | `page-cro` |
| O furo é o criativo | `ad-creative` |
| O furo é bid, orçamento ou estrutura de campanha | `paid-ads` |
| Precisa desenhar medição de produto ou SaaS | `analytics-tracking` |
| A oferta em si não fecha | `wizz-offer-forge` |
