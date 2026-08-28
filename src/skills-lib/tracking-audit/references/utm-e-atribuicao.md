# UTM e atribuição

O cimento de todo o resto. Se a tag está errada, o funil inteiro mede ficção.

## A regra central

Cada parâmetro carrega **nome e ID**, separados por um delimitador fixo. O nome existe para humano ler; o ID existe para a atribuição sobreviver a renomeação.

```
utm_campaign={{campaign.name}}|{{campaign.id}}
utm_medium={{adset.name}}|{{adset.id}}
utm_content={{ad.name}}|{{ad.id}}
utm_term={{placement}}
utm_source=<plataforma>
```

Cole no campo **parâmetros de URL** do anúncio, nunca no destino.

## Redundância no parâmetro nativo

Muito checkout não repassa `utm_*` para o webhook de venda. Quando a plataforma de checkout tem parâmetro próprio (por exemplo `xcod`, `src` ou `sck`), empacote a mesma informação lá também, com um separador longo e improvável:

```
xcod=<origem><SEP><campaign.name>|<campaign.id><SEP><adset.name>|<adset.id><SEP><ad.name>|<ad.id><SEP><placement>
```

O separador precisa ser uma string que nunca apareça em nome de campanha. Escolha uma vez e nunca mude: mudar quebra o histórico.

## Delimitadores proibidos em nomes

Nunca use `|`, `#`, `&` ou `?` em nome de campanha, conjunto ou anúncio. São delimitadores da própria string de tag.

Violou: **recriar a campanha**. Renomear não resolve, porque a plataforma continua servindo o nome antigo em cache para as impressões já entregues.

Padrão de nome que não dá problema: minúscula, sem acento, palavras separadas por hífen ou underscore, campos em ordem fixa. Escreva o padrão em algum lugar. Padrão que só existe na cabeça de alguém não é padrão.

## Outras plataformas

O formato é o mesmo em toda plataforma de mídia: macro nativa da plataforma preenchendo `utm_*`, mais o empacotamento no parâmetro nativo do checkout quando ele existir.

| Plataforma | O que muda |
|---|---|
| Meta | Macros `{{campaign.name}}`, `{{campaign.id}}`, `{{adset.*}}`, `{{ad.*}}`, `{{placement}}` |
| Google | Macros entre chaves simples, mais `{lpurl}?` na frente e `keyword`, `device`, `network` |
| TikTok, Kwai, Taboola | Mesma estrutura, nomes de macro próprios da plataforma |

Antes de escrever o template de uma plataforma, confirme o nome exato da macro na documentação dela. Macro errada entrega a string literal `{{campaign.id}}` na URL, e ninguém percebe até a primeira venda.

Existe variação a mais quando há cloaker na frente do checkout: um conector extra para não quebrar a string. Confirme com quem instalou o cloaker.

## O balde do orgânico

"Orgânico" não é canal. É tudo que chegou sem tag: destaque do Instagram sem UTM, link na bio sem UTM, direct, recompra, boca a boca.

Diagnóstico: tague **todas** as rotas próprias (bio, destaque, story, direct, e-mail, grupo) e observe o orgânico cair. O que sobrar depois disso é orgânico de verdade. O tamanho da queda é a prova de quanto o balde estava mentindo.

Padrão sugerido para rota própria:

```
utm_source=instagram&utm_medium=<bio|destaque|story|direct>&utm_campaign=<nome-do-destaque-ou-post>
```

## Primeiro toque

Último clique é o padrão de quase toda ferramenta, e ele esconde qual anúncio **apresentou** a oferta. Guarde o primeiro toque no seu banco (primeira UTM vista pelo visitante, com data) e compare com o último. Multi-toque simples, dois campos, resolve a maior parte das decisões de criativo.

## Conferência rápida

Cinco checagens que pegam quase todo erro de tag:

1. Abra o anúncio em preview e leia a URL final: tem macro literal sobrando?
2. A UTM sobrevive ao redirect até o checkout?
3. O webhook de venda entrega os campos ao banco?
4. Dois anúncios diferentes geram `utm_content` diferentes?
5. Renomear um anúncio quebra a atribuição? Se quebrar, está atribuindo por nome.
