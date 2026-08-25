---
name: site-launch-kit
description: "Checklist operacional de pré-lançamento de site em 15 rodadas corretivas: CTA principal acima da dobra, barra fixa mobile, promessa de tempo de resposta, prova social real, FAQ de decisão com FAQPage, imagens reais (não stock), endereço e como chegar, titles únicos, Open Graph, breadcrumbs, alt text, schema do negócio local, robots/sitemap, privacidade e termos LGPD, medição de eventos. Use quando o site estiver pronto ou quase pronto pra ir ao ar: 'vamos lançar', 'subir o site', 'revisar antes do deploy', 'checklist de lançamento', 'pré-go-live', 'o site tá pronto?', ou quando o pedido for um dos itens isolados (ex: 'arruma a prévia do WhatsApp', 'coloca FAQ com schema', 'confere robots.txt antes de subir'). Roda DEPOIS do site construído e ANTES do deploy. Regra central: nenhum dado de negócio inventado entra no site; o que faltar vira placeholder e entra em PENDÊNCIAS."
---

# Site Launch Kit · Revisão de Pré-Lançamento

15 rodadas corretivas para rodar **depois que o site está construído e antes do deploy**. Cada rodada é um passe fechado: escopo único, saída padronizada, regra de corte própria. Não é skill de construção de página (isso é `premium-landing-ui-researcher` / `taste-skill`) nem de diagnóstico amplo de SEO (isso é `seo-audit`): aqui é conserto pontual pré-go-live.

## Contrato comum (vale para TODAS as rodadas)

1. **Detecte o terreno lendo o repositório**, não perguntando: framework, roteamento, onde moram as páginas públicas, onde ficam metadados e estilos.
2. **Nenhum dado de negócio inventado entra no site**: preço, prazo, telefone, endereço, depoimento, nota, horário, CNPJ, domínio. O que faltar vira placeholder explícito (`{{ASSIM}}`) e entra em PENDÊNCIAS. Nunca preencha por estimativa.
3. **Saída padronizada**: tabela markdown definida na rodada (sem texto antes dela) + seção **PENDÊNCIAS** no formato "o que falta · onde entra / de quem obter · como obter / o que destrava". Sem pendências, escreva "NENHUMA PENDÊNCIA".
4. **Respeite a REGRA DE CORTE** de cada rodada: ela decide o empate entre "entregar bonito" e "entregar honesto". Honesto ganha sempre.
5. **Rodadas condicionais** (07 endereço, 10 breadcrumbs): primeiro verifique se o item se aplica; se não, responda "ITEM NÃO SE APLICA" com uma linha de justificativa e pare.
6. **Uma rodada por vez.** Não misture escopos no mesmo passe.

## As 15 rodadas (ordem recomendada)

| # | Rodada | Arquivo |
|---|---|---|
| 01 | CTA principal acima da dobra | [references/01-cta-principal.md](references/01-cta-principal.md) |
| 02 | Barra de ação fixa no mobile | [references/02-barra-fixa-mobile.md](references/02-barra-fixa-mobile.md) |
| 03 | Promessa de tempo de resposta | [references/03-tempo-de-resposta.md](references/03-tempo-de-resposta.md) |
| 04 | Prova social real | [references/04-prova-social.md](references/04-prova-social.md) |
| 05 | FAQ de decisão + FAQPage | [references/05-faq-decisao.md](references/05-faq-decisao.md) |
| 06 | Imagens reais, não stock | [references/06-imagens-reais.md](references/06-imagens-reais.md) |
| 07 | Endereço e como chegar | [references/07-endereco-como-chegar.md](references/07-endereco-como-chegar.md) |
| 08 | Title próprio por página | [references/08-titles.md](references/08-titles.md) |
| 09 | Prévia de link (Open Graph) | [references/09-open-graph.md](references/09-open-graph.md) |
| 10 | Trilha de navegação (breadcrumbs) | [references/10-breadcrumbs.md](references/10-breadcrumbs.md) |
| 11 | Texto alternativo correto | [references/11-alt-text.md](references/11-alt-text.md) |
| 12 | Dados estruturados do negócio | [references/12-schema-local.md](references/12-schema-local.md) |
| 13 | robots.txt e sitemap | [references/13-robots-sitemap.md](references/13-robots-sitemap.md) |
| 14 | Privacidade e termos (LGPD) | [references/14-privacidade-termos.md](references/14-privacidade-termos.md) |
| 15 | Medição de lançamento | [references/15-medicao.md](references/15-medicao.md) |

**Dependências entre rodadas:** a 12 (schema) usa a mesma fonte de dados da 07 (endereço) e só inclui `aggregateRating` se a 04 (prova social) tiver deixado avaliação real no ar; a 02 (barra fixa) reaproveita o rótulo definido na 01 (CTA); a 15 (medição) marca a página de obrigado que a 03 (tempo de resposta) também toca. Rodando fora de ordem, leia antes a rodada da qual a atual depende.

## Como executar

- **Pedido genérico** ("revisa o site antes de subir", "checklist de lançamento"): rode na ordem 01→15, uma rodada por vez, entregando a tabela + PENDÊNCIAS de cada uma antes de abrir a próxima. Ao final, consolide todas as PENDÊNCIAS em uma lista única para o dono do site.
- **Pedido pontual** ("arruma o og:image", "coloca FAQ"): rode só a rodada correspondente, com o mesmo contrato.
- **Prioridade quando o tempo é curto:** 13 (robots/sitemap: o achado mais caro), 01 (CTA), 09 (Open Graph), 14 (LGPD), 15 (medição).

## O que esta skill NÃO faz

- Não redesenha layout, paleta ou conteúdo de seções (use `taste-skill` / `impeccable`).
- Não cria a página do zero (use `premium-landing-ui-researcher`).
- Não faz diagnóstico amplo de ranking/tráfego (use `seo-audit`).
- Não escreve copy de venda nova (use `copywriting`); aqui só se ajusta rótulo e microcopy de atrito com material que já existe no site.
