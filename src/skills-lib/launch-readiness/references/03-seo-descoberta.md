# Área 03 · SEO / Descoberta

Checa se o produto CONSEGUE ser encontrado no dia do lançamento. Não é diagnóstico de ranking, tráfego ou Core Web Vitals (isso é `seo-audit`) e, quando a superfície é SITE, não repete as rodadas de execução (isso é `site-launch-kit`, rodadas 08 a 13): aqui só confirma se o básico de indexabilidade existe.

Se o projeto não tem superfície web pública indexável (ex.: app mobile-only, ferramenta interna), responda `ITEM NÃO SE APLICA` com 1 linha de justificativa e pare.

## Checagens objetivas

1. **`robots.txt` presente e não bloqueando tudo.** Ausente é 🟠; presente bloqueando `Disallow: /` em produção por engano é 🔴. Aponte `site-launch-kit` (rodada 13) como executor.
2. **Sitemap presente e referenciado no `robots.txt`.** Ausente é 🟠.
3. **Title e meta description únicos nas páginas públicas principais.** Title padrão/repetido (ex.: mesmo title em todas as páginas) é 🟠. Aponte `site-launch-kit` (rodada 08).
4. **Open Graph configurado.** Sem `og:title`/`og:image`/`og:description`, a prévia de compartilhamento (WhatsApp, redes) sai quebrada. É 🟡, mas sobe pra 🟠 se o canal de aquisição principal do lançamento é social/WhatsApp. Aponte `site-launch-kit` (rodada 09).
5. **Dados estruturados básicos do negócio.** Ausência não é bloqueante isolado, mas se o negócio depende de aparecer no Google local/rich snippet, é 🟡. Aponte `site-launch-kit` (rodada 12) ou `schema-markup`.
6. **Canonical e indexação não duplicada.** Múltiplas URLs servindo o mesmo conteúdo sem `rel=canonical` é 🟡.
7. **Domínio/DNS resolvendo pro ambiente de produção certo.** Domínio configurado mas apontando pro ambiente de staging/preview é 🔴 (achado de infra também, ver área 07; registre aqui só a parte de descoberta: se o buscador já indexou o domínio errado).

## Regra de corte

Não rode auditoria de ranking/backlink/palavra-chave aqui: isso é escopo do `seo-audit`, ofereça-o como próximo passo pós-launch, não execute agora.

## Formato de saída

```
| # | Item | Onde (arquivo/rota) | O que falta ou está errado | Severidade | Executor da correção |
```

Sem achado que passe na régua: responda só `NENHUM ACHADO NESTA ÁREA`.
