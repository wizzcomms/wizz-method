# Padrões de código

## Pixel: primeiro item do `<head>`

```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://connect.facebook.net" crossorigin>

  <script>
    /* o snippet do pixel exatamente como a plataforma entrega */
    fbq('init', 'SEU_PIXEL_ID');
    fbq('track', 'PageView');
  </script>

  <title>...</title>
  <!-- CSS e o resto vêm depois -->
</head>
```

Regras associadas:

- Pixel **direto**, sem tag manager. Numa página única, o gerenciador de tags é uma camada inteira de latência para administrar duas tags.
- `InitiateCheckout` no clique do botão de compra.
- **Um pixel só.** Dois pixels disparando o mesmo evento geram duplicidade.
- Recomendar a API de Conversões no servidor, para cobrir o que o navegador perde por bloqueador e limite de cookie.

## Stack alvo

Framework que gera HTML estático no build e envia zero JavaScript por padrão. **Astro é o padrão** por esse motivo: o servidor não monta nada em tempo de requisição.

```
public/                 favicon, robots.txt, headers. NÃO colocar imagem crítica aqui
src/assets/             toda imagem que precisa ser otimizada
src/components/         pedaços reaproveitados
src/pages/index.astro   a página. Aceita HTML puro colado direto
```

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://SEU_DOMINIO',
  image: {
    layout: 'constrained',       // gera srcset e sizes automaticamente
    responsiveStyles: true,      // sem isto as imagens não redimensionam
    breakpoints: [360, 480, 640, 768, 1024, 1280],
  },
  build: { inlineStylesheets: 'always' },  // uma requisição bloqueante a menos
});
```

> Com Tailwind 4, `responsiveStyles: true` pode conflitar com os utilitários. Havendo conflito, deixar `false` e escrever o CSS responsivo à mão. Testar antes de entregar.

**Migração a partir de construtor:** um arquivo `.astro` aceita HTML puro. Colar o HTML exportado dentro de `index.astro` e ele já funciona. **Não reescrever a página do zero**: migrar o HTML existente e otimizar por cima. Componentizar é refinamento posterior.

**Hospedagem:** qualquer CDN de borda com build estático serve. O que importa é HTML pronto servido da borda, não a marca.

## Imagens

Referência de decisão:

| Formato | Ganho | Suporte |
|---|---|---|
| WebP vs JPEG | 25-35% menor | ~96% |
| AVIF vs WebP | 20-30% menor | ~95% |
| AVIF vs JPEG | ~50% menor | ~95% |

Regra: **WebP como padrão, AVIF no herói com reserva.** AVIF custa mais CPU para codificar, mas isso acontece uma vez, no build.

```astro
---
import { Image, Picture } from 'astro:assets';
import heroi from '../assets/heroi.png';
import prova from '../assets/prova.png';
---
<!-- herói: define o LCP. eager + fetchpriority tiram ele da fila -->
<Picture src={heroi} formats={['avif','webp']} alt="descrição real"
         layout="full-width" loading="eager" fetchpriority="high" />

<!-- abaixo da dobra: lazy explícito -->
<Image src={prova} alt="descrição real" layout="constrained"
       width={720} loading="lazy" />
```

**Redimensionar antes de converter.** Trocar o formato não conserta imagem grande demais: um print de 3000px entregue numa tela de 390px é desperdício até em AVIF.

Fora do Astro, o mesmo trabalho em lote com `sharp`: para cada arquivo, ler a largura original, e para cada largura alvo menor que ela gerar um `.webp` (qualidade ~78) e um `.avif` (qualidade ~55). Nunca aumentar a imagem.

## Fonte

Padrão de custo zero:

```css
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                    "Helvetica Neue", Arial, sans-serif; }
```

Quando a marca exige fonte própria:

```html
<link rel="preload" as="font" type="font/woff2"
      href="/fontes/NOME-700-latin.woff2" crossorigin>
<style>
@font-face{
  font-family:"NOME";
  src:url("/fontes/NOME-700-latin.woff2") format("woff2");
  font-weight:700; font-style:normal; font-display:swap;
  unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20AC;
}
</style>
```

Só `woff2`. Um ou dois pesos no máximo. Subset latino sempre. `preload` **apenas** na fonte que aparece acima da dobra.

## Player de VSL: fachada

A capa estática vira o LCP; o script do player entra depois, fora do caminho crítico. Um `<img>` com `width`/`height` e `aspect-ratio` reservados ocupa o espaço, e o script do player é injetado no primeiro `pointerenter` ou `click`, com um `requestIdleCallback` (timeout ~2,5s) como rede de segurança.

**Troca consciente:** se o VSL precisa de autoplay, a fachada custa retenção nos primeiros segundos. Nesse caso, reduzir a rede de segurança para 600-1000 ms e adicionar `preconnect` para o domínio do player. **Declarar a troca no relatório.**

## Rede: cache, prefetch e checkout

```
# headers da CDN
/*
  Cache-Control: public, max-age=0, must-revalidate

/_astro/*
  Cache-Control: public, max-age=31536000, immutable
```

```html
<!-- prefetch só funciona dentro do próprio domínio -->
<script type="speculationrules">
{ "prefetch": [{ "where": { "href_matches": "/*" }, "eagerness": "moderate" }] }
</script>

<!-- checkout em outro domínio: prerender entre sites não existe.
     preconnect é o máximo que dá -->
<link rel="preconnect" href="https://SEU_CHECKOUT" crossorigin>
```

## Scripts que não são o pixel

Chat, mapa de calor, gravador de sessão, pop-up de saída, contador de visitantes: nada disso precisa existir no primeiro segundo. Injetar todos no primeiro `pointerdown`, `keydown` ou `scroll` (listener `once` e `passive`), com um `setTimeout` de ~4s como rede de segurança.
