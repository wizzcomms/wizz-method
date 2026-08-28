# Modo implantação

Checklist executável para antes de subir campanha. Roda de cima para baixo. Cada item tem um jeito de verificar, não é declaração de fé.

Régua: leia o Passo 0 do `SKILL.md` antes. Sem régua declarada, o relatório sai sem número.

## 1. Página e carregamento

| Verificar | Como | Reprova quando |
|---|---|---|
| Página abre no mobile real | `agent-browser` em viewport de celular | Layout quebra ou bloco some |
| Tempo até o conteúdo principal | PageSpeed Insights, aba mobile | Fora da meta declarada pela régua do projeto |
| Redirect | Abrir o link do anúncio sem encurtador no meio | Qualquer salto extra ou loop |
| SSL | Cadeado e certificado válido no domínio final | Aviso do navegador |

Furou aqui: é trabalho de dev. Não mexa em criativo antes de resolver.

## 2. Pixel e servidor

| Verificar | Como | Reprova quando |
|---|---|---|
| Pixel presente na página | Extensão de debug da plataforma ou console | Não dispara `PageView` |
| Posição do disparo | Ver se o `PageView` sobe antes do conteúdo visível | Dispara em `onload` tardio: infla connect rate e mente sobre a visita |
| Evento de conversão do lado do servidor (CAPI) | Painel de qualidade da plataforma | Só navegador, sem servidor |
| Deduplicação | `event_id` igual entre navegador e servidor | Sem `event_id`: a mesma venda conta duas vezes |
| Domínio verificado | Painel de negócio da plataforma | Não verificado: perde atribuição em iOS |

> O pixel mede o pixel. Um connect rate bonito com página lenta é métrica maquiada, não conversão.

## 3. Eventos priorizados

Instale nesta ordem. Os quatro primeiros são obrigatórios; os outros entram quando o funil tiver a etapa.

1. `PageView` — visita à página de vendas
2. `ViewContent` — chegou ao bloco de oferta (não é o mesmo que abrir a página)
3. `InitiateCheckout` — clicou para comprar
4. `Purchase` — venda aprovada, com valor e moeda
5. `AddPaymentInfo` — preencheu pagamento, separa atrito de checkout de desistência de preço
6. `Lead` — captura, quando existir etapa de lead
7. `Subscribe` ou evento de recorrência, quando existir
8. Evento próprio de upsell ou order bump, quando existir

Regra: evento sem valor monetário em `Purchase` inutiliza ROAS. Evento duplicado inutiliza tudo.

## 4. Tags e atribuição

Ver `utm-e-atribuicao.md` para os templates. O que a implantação precisa provar:

- O template de UTM está colado no campo de parâmetros de URL do anúncio, não no destino do anúncio.
- Cada parâmetro carrega nome **e** ID.
- O parâmetro nativo da plataforma de checkout (quando existir) recebe a mesma informação empacotada, porque o checkout nem sempre repassa `utm_*`.
- Nenhum nome de campanha, conjunto ou anúncio contém `|`, `#`, `&` ou `?`.
- O padrão de nomenclatura está escrito em algum lugar que a próxima pessoa lê.

## 5. Repasse pelo checkout

Este é o item que mais falha e o mais fácil de esquecer.

1. Abra a página com uma UTM de teste na URL.
2. Clique para comprar.
3. Na página de checkout, confirme que os parâmetros chegaram (URL, campo escondido ou painel da plataforma).
4. Confirme que o webhook de venda entrega esses parâmetros para o destino final (banco, planilha, painel de atribuição).

Quebrou entre 2 e 3: o checkout não repassa. Use o parâmetro nativo.
Quebrou entre 3 e 4: o problema é a integração, não a tag.

## 6. Compra-teste por caminho

Cada rota de entrada recebe uma compra real de teste antes de investir:

- anúncio
- link da bio
- story
- destaque
- direct ou conversa

Para cada rota, registre: a venda apareceu no banco, apareceu no painel de atribuição, e apareceu com a origem certa. Rota que não passa nas três é rota cega.

## 7. Fechamento

Antes de liberar a subida, o relatório precisa responder sim para as cinco:

1. A visita é medida no instante certo?
2. A venda chega ao banco próprio?
3. A venda sabe de qual anúncio veio, por ID?
4. O orgânico é o que sobra depois de tudo taguear, e não um balde de preguiça?
5. Existe pelo menos uma compra-teste aprovada por rota?

Qualquer "não" vira achado `CRÍTICO` ou `ALTO`. Nada sobe com um `CRÍTICO` aberto.
