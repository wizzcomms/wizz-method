# Plano de Medição da Oferta

O sétimo bloco do `OFFER-SPEC.md`. Não é arquivo separado, é uma seção do artefato.

Serve para uma coisa só: quando a oferta não converter, saber **onde** ela não converteu. Sem isso o diagnóstico vira arqueologia.

Regra que atravessa tudo: **nada de número inventado**. Toda meta tem fonte declarada (régua da metodologia local, histórico do próprio projeto, ou combinado com o usuário). O que não tiver fonte fica escrito como pendência.

## 1. Eventos mínimos

Derive da promessa, não de uma lista pronta. A pergunta é: qual é o instante em que esta oferta foi aceita?

Base para quase toda oferta de resposta direta:

| Evento | Marca | Obrigatório |
|---|---|---|
| `PageView` | chegou à página | sim |
| `ViewContent` | chegou ao bloco da oferta | sim |
| `InitiateCheckout` | clicou para comprar | sim |
| `Purchase` (com valor e moeda) | venda aprovada | sim |
| `AddPaymentInfo` | preencheu pagamento | quando o checkout tiver a etapa |
| evento do order bump | aceitou o bump | quando houver bump |
| evento do upsell | aceitou o upsell | quando houver upsell |

`Purchase` sem valor monetário inutiliza qualquer cálculo de retorno. Evento duplicado inutiliza todos.

## 2. Padrão de UTM por canal

Uma linha por rota de entrada que esta oferta vai usar. Toda rota, inclusive as próprias:

```
anúncio    utm_source=<plataforma>&utm_campaign=<nome>|<id>&utm_medium=<conjunto>|<id>&utm_content=<anúncio>|<id>
bio        utm_source=instagram&utm_medium=bio&utm_campaign=<oferta>
destaque   utm_source=instagram&utm_medium=destaque&utm_campaign=<nome-do-destaque>
story      utm_source=instagram&utm_medium=story&utm_campaign=<oferta>
e-mail     utm_source=email&utm_medium=<sequência>&utm_campaign=<oferta>
```

Rota sem UTM cai no balde do orgânico e some da análise. Se a skill `tracking-audit` estiver instalada, ela é a dona da implantação e da conferência disso.

## 3. Metas por transição

As cinco transições do funil, com a meta calibrada para **este** ticket e a fonte ao lado:

| Transição | Meta | Fonte da meta |
|---|---|---|
| Cliques → visitas | | |
| Visitas → checkout iniciado | | |
| Checkout iniciado → venda iniciada | | |
| Venda iniciada → aprovada (PIX) | | |
| Venda iniciada → aprovada (cartão) | | |

Preencher com régua declarada. Célula sem fonte fica vazia e vira pendência, nunca chute.

## 4. Hipótese e número que reprova

Duas frases, e elas são o coração do bloco:

```
Hipótese: <público> compra <promessa> a <preço> porque <mecanismo>,
          e isso aparece como <métrica> acima de <número>.

Reprova:  se depois de <volume mínimo de dados> a <métrica> ficar abaixo de <número>,
          a oferta está errada e o próximo passo é <mudar promessa | mudar preço | mudar público>.
```

O volume mínimo importa tanto quanto o número. "Não converteu" com 40 visitas não é informação.

## 5. Ponte com o tracking

Este bloco **declara** o que precisa ser verdade. Ele não instala nada e não confere nada.

- Com `tracking-audit` instalada: o passo seguinte é rodar o modo implantação dela usando este bloco como entrada.
- Sem ela: entregue o bloco como checklist manual e diga que a conferência não foi feita.
