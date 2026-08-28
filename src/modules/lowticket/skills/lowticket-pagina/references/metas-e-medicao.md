# Metas, medição e relatório

## Como medir cada meta

Sempre em **mobile, com throttle de 4G**. Medir em desktop dá número bonito e diagnóstico errado.

| Métrica | Alvo | Onde medir |
|---|---|---|
| Redirects entre anúncio e página | 0 | `curl -sIL` no link exato do anúncio |
| TTFB | < 200 ms | DevTools → Network → primeira requisição |
| LCP | < 2,0 s (ideal < 1,5 s) | PageSpeed Insights, aba Mobile |
| CLS | < 0,1 | PageSpeed Insights, aba Mobile |
| Tempo até o `PageView` | < 800 ms | DevTools → requisição para o endpoint de tracking da Meta |
| HTML comprimido | < 50 KB | Network, coluna Size |
| Peso acima da dobra | < 250 KB | Network, filtrado até o LCP |
| JavaScript próprio bloqueante | 0 KB | nenhum `<script>` sem `async`/`defer` no caminho crítico |

Checagem de redirects:

```bash
curl -sIL "https://link-exato-do-anuncio" -o /dev/null \
  -w "%{num_connects} conexões · %{num_redirects} redirects · %{time_total}s\n"
```

`num_redirects` tem que dar **0**.

## Armadilha de medição do player

Player com autoplay inteligente confunde medidor de velocidade: o carregamento em segundo plano faz a ferramenta achar que a página nunca terminou. **Medir com o autoplay desligado e religar depois.**

## Armadilha de medição do connect rate

- A Meta passou a exibir que visualização da página de destino não exige mais o pixel. Ou seja, o número pode ser **estimado**, não contado: a plataforma infere se a página carregou observando quanto tempo a pessoa ficou fora do app.
- Em auditoria com pixel corretamente instalado, campanha de **tráfego** otimizada para visualização de página mostrou número muito acima das sessões realmente medidas no analytics. Em campanha de **conversão**, os números bateram.
- Consequência prática: rodar campanha otimizada por compra, e para medir connect rate com precisão criar uma **conversão personalizada baseada na URL da página**, que só dispara com a página realmente carregada.

## Relatório final

Formato fixo. Português claro, sem jargão. Quando um número não bateu a meta, uma frase explicando o que aquilo significa na prática.

```
RELATÓRIO DE PERFORMANCE

| Métrica              | Antes | Depois | Meta    | Status |
|----------------------|-------|--------|---------|--------|
| Redirects            |       |        | 0       |        |
| TTFB                 |       |        | < 200ms |        |
| LCP (mobile 4G)      |       |        | < 2,0s  |        |
| CLS                  |       |        | < 0,1   |        |
| Tempo até o PageView |       |        | < 800ms |        |
| HTML comprimido      |       |        | < 50KB  |        |
| Peso acima da dobra  |       |        | < 250KB |        |

O QUE FOI FEITO
- lista curta, em português comum

O QUE NÃO CONSEGUI FAZER E POR QUÊ
- específico: limitação da plataforma, falta de acesso, ou decisão que depende do dono da página

TROCAS CONSCIENTES
- ex.: reduzi o atraso do player para preservar o autoplay, custando ~300ms de LCP

O QUE PRECISA SER FEITO NA MÃO
- ex.: trocar o link dentro do gerenciador de anúncios pela URL final

O QUE VERIFICAR DEPOIS DE PUBLICAR
- abrir a página no celular, com dados móveis, por dentro do Instagram
- comparar cliques no link contra visualizações da página no gerenciador, por criativo
- connect rate abaixo de 85% depois disso quase nunca é público ruim, é estrada
```
