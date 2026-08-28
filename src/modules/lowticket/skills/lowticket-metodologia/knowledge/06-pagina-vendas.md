## 6. Página de vendas

> Shard da metodologia desta base. Índice: [`INDEX.md`](INDEX.md) · Sempre carregado junto: [`guardrails.md`](guardrails.md)
> Onde a skill genérica contradisser este shard, **o shard vence**, e isso deve ser dito na resposta.

### 6.1 Anatomia de 12 blocos

| # | Bloco | Status | Função |
|---|-------|--------|--------|
| 01 | Top bar | Opcional | Urgência + ancoragem de preço |
| 02 | Hero (headline + VSL + CTA 1) | Core | 80% da conversão se ganha ou perde aqui |
| 03 | Dor | Core | Efeito espelho: a pessoa precisa se reconhecer |
| 04 | Mecanismo | Core | Transforma o comum em único (ver 5.5: problema + solução) |
| 05 | Prova | Core | Demonstração + depoimento + autoridade |
| 06 | Desejo | Core | Benefício em linguagem de resultado, vende o "depois" |
| 07 | Valor | Core | Empilhamento antes do preço |
| 08 | Oferta | Core | Preço com ancoragem + decoy + bônus |
| 09 | Resumo | Opcional | Captura quem rolou direto |
| 10 | Garantia | Core | Reversão de risco com prazo e selo |
| 11 | FAQ | Core | Quebra de objeção final |
| 12 | CTA final + rodapé | Core | Chamada + selos + legal |

Essa estrutura converteu em 90% das ofertas rodadas.

**Por que cada bloco existe.** Os dois exemplos de página analisados são **Pack de Planilhas** (R$10, infoproduto genérico) e **ViviTrick** (assistente de mira para jogo, público jovem).

| # | O trabalho do bloco | O mecanismo psicológico |
|---|---------------------|--------------------------|
| 01 | Ancora preço e cria urgência antes de qualquer rolagem | O preço já parece pechincha antes de a pessoa começar a ler |
| 02 | Promete resultado + mecanismo, quebra a objeção nº 1 e entrega a VSL | Promessa específica + prova em vídeo + primeira chamada |
| 03 | Faz a pessoa se reconhecer no problema e segmenta o público | Efeito espelho: "isso sou eu" vem antes de querer a solução |
| 04 | Explica o produto de forma que pareça único, não genérico | O mecanismo justifica **por que** aquilo funciona |
| 05 | Print, dashboard, demonstração e depoimento de quem o público admira | Prova visual + prova social derrubam a desconfiança juntas |
| 06 | Lista o ganho em linguagem de resultado, não de característica | Vende o depois, não o produto |
| 07 | Empilha tudo que vem junto antes de mostrar o número | Quanto mais valor empilhado antes do preço, menor a dor do preço |
| 08 | Preço com ancoragem, plano isca e bônus | Ancoragem + decoy + selo "mais vendido" guiando o olho |
| 09 | Resume a oferta em duas linhas | Captura quem rolou direto até o preço sem ler |
| 10 | Selo, prazo e promessa de devolução | Risco percebido menor = mais cliques no botão |
| 11 | Derruba "é seguro / quando recebo / funciona no meu caso" | Cada dúvida sem resposta fecha uma venda; o FAQ fecha as saídas |
| 12 | Última chamada + selos de confiança + parte legal | Ação clara ancorada em segurança |

**Padrões de oferta extraídos dos dois exemplos (bloco 08):**

- **Pack de Planilhas:** Básico R$10 contra Premium R$19,90, com valor total riscado de R$147. Order bump sobe o ticket.
- **ViviTrick:** três opções onde a terceira é o alvo. Mensal R$4,99, trimestral R$9,99, permanente R$13,90 (de R$358). Os dois primeiros são isca para fazer o permanente parecer óbvio.

> Regra que aparece nos dois: o plano-alvo nunca é o mais barato nem aparece sozinho. Ele aparece cercado de opções que existem para fazê-lo parecer a escolha racional.

**Notas de copy dos exemplos:**

- Headline do Pack: "Pacote com +13 mil planilhas profissionais. Economize tempo e dinheiro."
- Headline da ViviTrick já embute prova + quebra de objeção: "O assistente de mira que transformou +15.000 players numa máquina de capa. 100% aprovado pela Garena, nunca deu ban."
- Bloco de dor da ViviTrick nomeia o público direto: "É pra você que não aceita mais perder x1 pros amigos."
- Blocos 01 e 09 são opcionais e entram conforme o tamanho da página; a ViviTrick abre direto no headline, sem barra de urgência.

### 6.2 Regras de copy e layout

- **CTA se repete**: depois do hero, depois da prova, depois da oferta e no final. Nunca um botão só.
- **CTA chip** entre as seções para guiar o olhar.
- **Em low ticket, não colocar CTA na primeira dobra** (exceto como efeito de scroll).
- VSL logo após a headline, para prender antes de qualquer explicação.
- Headline foca no produto em low ticket, e na transformação em nicho complexo.
- Top bar com data atualizada automaticamente por script.
- Prova social com feedback real, de preferência em vídeo.

> A ordem é recomendada, não sagrada: varia por nicho e tipo de produto.

### 6.3 Connect rate — a engenharia da página

Esta seção detalha a Transição 1 do funil (seção 2.2). Lá o diagnóstico diz "é problema técnico"; aqui está como resolver.

```
connect rate = visualizações da página de destino ÷ cliques no link
```

**Fato técnico que determina tudo:** a visualização é contada quando o evento `PageView` do pixel dispara. O connect rate mede **o instante em que o pixel consegue falar**, não o instante em que o usuário vê a oferta.

Isso cria **dois relógios**, e os dois precisam ser otimizados:

| Relógio | O que é | O que governa |
|---------|---------|----------------|
| Tempo até o pixel | quando `fbq('track','PageView')` executa | o connect rate no gerenciador |
| Tempo até o herói | LCP: quando o maior elemento visível aparece | a venda de verdade |

> **Regra de integridade:** dá para subir o connect rate só movendo o pixel para o topo do `<head>`, sem a página ficar mais rápida. Isso é maquiagem de métrica. Sobe o pixel **e** conserta a página. Se só um dos dois for possível, dizer isso explicitamente.

**Metas de aceitação:** tabela completa na seção **6.4** (medir sempre em mobile com throttle de 4G, nunca desktop) — não duplicada aqui para evitar as duas versões divergirem com o tempo.

**Ordem de execução** (ordenada por retorno sobre esforço, não por elegância):

1. **Diagnóstico.** `curl -sIL` no link do anúncio, medir LCP/TTFB/CLS em mobile, localizar o pixel no HTML. Esses números são o "antes".
2. **Estrada.** Zerar redirects. Um host só, https direto, sem encurtador.
3. **Onde a página mora.** Estático servido da borda, com cache configurado.
4. **Pixel.** Subir para o topo do `<head>`, tirar o GTM do caminho.
5. **Imagens.** Converter, redimensionar, `Picture` no herói e `lazy` no resto.
6. **Fonte e CSS.** Fonte do sistema ou woff2 subsetada; CSS embutido.
7. **Player.** Fachada com capa estática.
8. **Scripts secundários.** Adiar todos.
9. **Remedição.** Repetir o passo 1 e montar a tabela antes/depois.

**Regras NUNCA:**

- Nunca redirect entre o link do anúncio e a página (nem encurtador, nem `http→https`, nem `www→sem www`).
- Nunca o pixel dentro de web worker (Partytown e similares). Melhora a nota do Lighthouse e atrasa o `PageView`, que **é** o connect rate.
- Nunca o pixel depois do CSS, do título, ou no fim do `<body>`.
- Nunca `loading="lazy"` na imagem do herói; nunca omitir `lazy` abaixo da dobra.
- Nunca fonte de domínio de terceiros (Google Fonts hospedado no Google). Custa DNS, TLS e conexão nova.
- Nunca o script do player de VSL no caminho crítico.
- Nunca entregar imagem maior que a largura em que ela é exibida.
- Nunca JPEG XL (suporte ~16%).

**Regras SEMPRE:**

- Pixel como **primeiro script do `<head>`**, chamado direto, sem GTM. Um pixel só.
- `InitiateCheckout` no clique do botão de compra. API de Conversões ligada no servidor.
- `width`/`height` (ou `aspect-ratio`) reservados em imagem e vídeo, para CLS zero.
- `preconnect` nos terceiros inevitáveis: player, `connect.facebook.net`, checkout.
- Preservar comportamento de conversão existente: botões, âncoras, UTMs no checkout, delays de CTA sincronizados com o vídeo.

**Imagens (dados de 2026):** WebP é o padrão (25–35% menor que JPEG, ~96% de suporte). AVIF só no herói, com reserva (mais 20–30% sobre o WebP). Redimensionar na largura real **antes** de converter: formato não conserta imagem de 3000px. Breakpoints começando em 360, porque o clique vem do celular.

**Player de VSL:** capa estática no lugar do player, que vira o LCP; o script entra depois, na primeira intenção (`pointerenter`/`click`) com rede de segurança de tempo. Se o VSL precisa de autoplay, reduzir a rede de segurança para 600–1000 ms e adicionar `preconnect` no domínio do player, assumindo a troca de LCP por autoplay. **Medidor de velocidade não entende autoplay:** medir com ele desligado e religar depois.

**Stack recomendada:** Astro (HTML estático no build, zero JavaScript por padrão), hospedado em Cloudflare Pages. Arquivo `.astro` aceita HTML puro, então dá para colar o export do construtor e otimizar por cima — **não reescrever a página do zero**. Toda imagem em `src/assets`, nunca em `public/` (lá não é otimizada). `inlineStylesheets: 'always'` remove uma requisição bloqueante. Trade-off real: toda alteração vira build, o que incomoda quem troca headline várias vezes por dia.

**Se o aluno está preso a um construtor fechado:** aplicar o que a plataforma permitir (ordem do pixel, imagens, fachada do player, remoção de scripts e redirects) e declarar quais metas ficaram inatingíveis e por quê.

**Contexto de medição que evita conclusão errada:**

- A Meta passou a exibir que visualizações da página de destino **não exigem mais o pixel**. A métrica pode ser **estimada**, não contada: a plataforma infere se a página carregou observando quanto tempo o usuário ficou fora do app.
- Em auditorias, campanhas de **tráfego** otimizadas para visualização de página mostraram números muito acima das sessões reais medidas em analytics. Em campanhas de **conversão**, os números batiam.
- Consequência prática: rodar campanha otimizada por compra e criar uma **conversão personalizada baseada na URL da página** para medir connect rate sem chute. Cruzar com a Utmify antes de decidir qualquer coisa, porque o gerenciador arredonda para cima.

> **Connect rate abaixo de 85% quase nunca é público ruim. É estrada ruim.** E se o connect rate já está acima de 92%, o problema está em outro lugar: velocidade não conserta oferta ruim, criativo ruim nem checkout ruim.

### 6.4 Metas técnicas de performance da página

A 6.3 explica **por que** o connect rate importa. Esta seção concentra a **tabela de metas** (a 6.3 remete pra cá em vez de repetir os números): o material é um briefing formal para colar inteiro numa IA (Claude Code, Cursor, Lovable, v0, Bolt, Replit) junto com a página, para ela executar e devolver relatório antes/depois.

**O fato técnico que muda a leitura da métrica:**

> A visualização da página de destino só é contada quando o evento PageView do pixel da Meta dispara. Ou seja: o connect rate mede o instante em que o pixel consegue falar, não o instante em que a pessoa vê a oferta.

Isso cria **dois relógios distintos** a otimizar: o tempo até o pixel disparar e o tempo até o LCP (o herói visual). Confundir os dois é o que produz a fraude descrita abaixo.

> ⚠️ **Regra de integridade — a mais importante da seção.** Dá para subir o connect rate só movendo o pixel para o topo do `<head>` sem a página ficar mais rápida.
>
> Subir o pixel sem consertar a página é maquiagem de métrica: o número melhora e a venda não. As duas coisas andam juntas.
>
> Se só um dos dois for possível, isso tem que estar dito no relatório. Um connect rate que subiu sem a página acelerar não converteu nada: só mentiu melhor.

**Metas de aceitação — sempre medidas em mobile com throttle 4G, nunca em desktop:**

| Métrica | Meta | Como medir |
|---|---|---|
| Redirects entre anúncio e página | **0** | `curl -sIL` |
| TTFB | **< 200 ms** | DevTools Network, primeira requisição |
| LCP | **< 2,0 s** (ideal < 1,5 s) | PageSpeed Insights mobile |
| CLS | **< 0,1** | PageSpeed Insights mobile |
| Tempo até o PageView | **< 800 ms** | requisição para `facebook.com/tr` |
| HTML comprimido | **< 50 KB** | — |
| Peso total acima da dobra | **< 250 KB** (até o LCP) | — |
| JavaScript próprio bloqueante | **0 KB** | — |

**Diagnóstico antes de mexer:** rodar PageSpeed Insights e Lighthouse **antes** de qualquer alteração, para ter a linha de base do antes/depois.

**Contexto de tráfego assumido:** majoritariamente mobile, rede móvel BR, dentro do **navegador interno do Instagram** — que é mais lento que Chrome ou Safari nativos. Medir no ambiente errado invalida o número.

**A régua de corte:**

> Velocidade conserta o vazamento entre o clique e a página, e só isso. Não conserta oferta ruim, criativo ruim nem checkout ruim. Com connect rate acima de 92%, o problema está em outro lugar.

Acima de 92%, parar de otimizar página e voltar para a hierarquia da seção 2.6.

**Solução de player citada:** player de vídeo customizado sobre YouTube, com controles parecidos com os do VTurb, para simular a sessão de compra completa.
