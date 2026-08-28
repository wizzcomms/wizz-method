## 12B. Mineração — produzir a versão melhorada

> Shard da metodologia desta base. Índice: [`INDEX.md`](INDEX.md) · Sempre carregado junto: [`guardrails.md`](guardrails.md)
> Onde a skill genérica contradisser este shard, **o shard vence**, e isso deve ser dito na resposta.

**O que tem aqui:** `12.7` fábrica de ofertas, o agente que produz a versão melhorada · `12.7-A` a anatomia fixa de 11 blocos da página de low ticket puro
**Irmãos:** radar e rubrica em [`12-mineracao-ofertas.md`](12-mineracao-ofertas.md) · veredito em [`12a-mineracao-veredito.md`](12a-mineracao-veredito.md)
**Atenção:** depoimento sintético é tática bloqueada — ver [guardrails 23](guardrails.md).

### 12.7 fábrica de ofertas — o agente que produz a versão melhorada

Continuação direta do radar de ofertas, do mesmo autor (o autor da fonte, aula de 2026-08-20). O Radar entrega a planilha de ofertas validadas; **este agente pega uma linha da planilha e devolve a oferta inteira pronta para subir**: página de vendas, entregável em PDF e criativos. É a execução ponta a ponta do que 12.3 descrevia como "da linha da planilha nasce o MVP".

**O princípio que governa tudo:**

> A premissa: não clonar a oferta do concorrente, e sim produzir uma versão melhor dela.

Não é retórica: está embutido no mecanismo. O primeiro prompt extrai as **lacunas** da oferta original (o que aquela pessoa deixou de fazer), e o prompt da página ataca justamente essa lacuna. A oferta modelada vira matéria-prima de diagnóstico, não molde de cópia. Coerente com a regra 3 de 12.4 e com o "nunca clonar, sempre reconstruir" de 12.5.

**Setup:**

1. **Projeto novo e separado** no Claude modo Cowork, chamado "fábrica de ofertas". Não reaproveitar o projeto do Radar.
2. Pasta própria no PC com o mesmo nome, liberada para o agente.
3. Colar o prompt de instruções ("Você é minha fábrica de ofertas low ticket...").
4. **Modelo: Opus.** A fonte de origem diz explicitamente para **não usar o Fable** — "é muito caro e pro que a gente vai fazer não tem sentido".
5. Pegar o link da página de vendas na Biblioteca de Anúncios (clicar no anúncio → Saiba mais) e colar no primeiro prompt.

**A sequência de 5 prompts:**

| # | O que faz | Output |
|---|---|---|
| 1 | **Extração** — lê a página inteira pelo link | Promessa, mecanismo, público e nível de consciência, objeções, prova, preço, estrutura da página e **as lacunas da oferta original** (execução de poucos minutos) |
| 2 | **Posicionamento** | Nome, posicionamento, promessa central e **escada de preços** (ancoragem, preço de venda, order bump, upsell, downsell do upsell), com justificativa e o ticket médio alvo |
| 3 | **Página** | TSL/VSL completa seguindo a anatomia fixa do projeto, atacando a lacuna identificada |
| 4 | **Entregável** | Os PDFs do produto |
| 5 | **Criativos** | 5 prompts de imagem, orquestrando o ChatGPT pelo navegador. Depois, um prompt extra pede os textos para sobrepor no Canva |

> Entre a etapa 2 e a 3 há **confirmação manual**: o agente para e espera o ok antes de gerar a página. Não é pipeline cego.

**O que a fonte de origem confirma do que já estava escrito:**

- **Entregável em 4 PDFs + 1 bônus** (12.3). No exemplo saíram 5 arquivos de 24, 4, 4, 10 e 15 páginas.
- **Bônus liberado no 7º dia** para reduzir reembolso (12.3).
- **5 ângulos de criativo em imagem** (12.3).
- **Reposicionamento de ticket** (12.5): o exemplo da aula é R$147 → R$37, dentro da faixa R$37-47 da tabela.

**O que ela acrescenta:**

- **Order bump incentivado no próprio card de oferta**, dentro da página. O autor diz nunca ter visto outra pessoa aplicar isso. Ver [Ponto em aberto 8](pontos-em-aberto.md), que trata de onde e quantos bumps usar.
- **Elementos de rodapé anti-bloqueio**: textos legais e institucionais no fim da página para reduzir risco de bloqueio no Facebook.
- **Banir travessão da copy.** Achado de revisão humana, não do prompt: travessão "dá na cara que foi feito com IA". Soma-se à lista de vocabulário proibido de 7.4.
- **Hospedagem gratuita na Vercel**, em vez de HostGator/Registro.br.
- **Criativo em vídeo: fazer à mão no começo.** Para quem tem pouco caixa, cortes de TikTok + narração gratuita do ElevenLabs batem montar a stack paga (Higgsfield, HeyGen, Dream Face) — o custo somado não se justifica antes da oferta validar. Contrapeso útil às seções 4.6 e 4.9.

> ⚠️ **Depoimento sintético — registrado, não adotado.** A fonte de origem sugere preencher a prova social com foto de rosto gerado por IA, mais nome e cidade fictícios. Isso é **depoimento fabricado**: além de violar a política de anúncios da Meta, é publicidade enganosa (CDC no Brasil, e mais dura ainda na UE, onde a 4.8 já manda enquadrar depoimento como resultado individual). Fica registrado porque está no material, mas **não entra como prática**. Ver [guardrails 23](guardrails.md).

**Os prompts**. Eles nunca são lidos em voz alta na aula: aparecem só escritos na tela, e foram capturados por print em 2026-08-22. O arquivo tem o texto literal do que estava visível.

**A regra central, que define o método inteiro:**

> Regra dura de leitura: da página do concorrente sai **estrutura e inteligência**, nunca frase. Nada é transcrito, copiado ou reescrito a partir do texto dela. Todo texto produzido nasce do zero.

**A Ficha de Inteligência — as "nove coisas" que a transcrição menciona sem enumerar.** O prompt 1 devolve, sobre a página de origem:

| # | Campo | O que extrai |
|---|---|---|
| 1 | Promessa | categoria: transformação, economia, status ou velocidade |
| 2 | Mecanismo | o que ele alega que faz funcionar |
| 3 | Público | e **nível de consciência do problema, de 1 a 5** |
| 4 | Objeções | quais a página trata, **e em que ordem** |
| 5 | Prova | tipos usados e quantos de cada |
| 6 | Oferta | entregável, bônus, garantia, prazo |
| 7 | Preço | valor cheio, entrada, bump, upsell, parcelamento |
| 8 | Estrutura | seções na ordem, e onde estão os CTAs |
| 9 | **Lacunas** | **o que essa página NÃO faz e deveria fazer** |

> O item 9 é o que sustenta o "melhorar em vez de clonar", e o próprio prompt diz: *"Capricha, é a parte mais importante."* O prompt da página então manda **atacar cada lacuna do item 9** — "é a nossa vantagem".

**A lógica de preço do agente — fixa, não faixa:**

| Origem | Entrada |
|---|---|
| R$47 a 67 | **R$19,90** |
| R$67 a 97 | **R$27,00** |
| R$97+ | **R$37,00** |

> ⚠️ Isso **não é a mesma tabela de 12.5**. O `prompt minerador` dá faixas para decisão caso a caso e escala até ~R$97 numa origem de R$297; a Fábrica dá **valor único com teto em R$37**, porque agente automatizado precisa de número fechado, não de julgamento. Batem até R$97 e divergem acima disso. Ver [Ponto em aberto 24](pontos-em-aberto.md).

**Convenção de arquivos do projeto:** , , e a página em . Numeração com zero à esquerda, um arquivo por etapa, pasta conectada ao Google Drive.

#### 12.7-A O guia impresso fecha a lacuna

Até 2026-08-26 esta seção terminava com "o prompt de instruções está cortado por um Mostrar mais, e faltam os prompts 2, 4 e 5". O guia em PDF do mesmo autor traz o texto literal de tudo o que faltava: o Prompt 0 completo (com a **anatomia fixa**, que era o buraco central), e os prompts 2, 3, 4 e 5.

**Requisitos declarados:** o Radar já montado, **assinatura paga do Claude, "o Pro já serve"**, ChatGPT Plus para os criativos, e Chrome com a extensão Claude in Chrome num perfil separado. O texto insiste: "isso não é de graça, mas provavelmente você já paga os dois". Ver [Ponto em aberto 30](pontos-em-aberto.md), porque a fonte de origem anterior mandava usar Opus.

**Setup em 4 passos:** projeto novo no Cowork chamado fábrica de ofertas; pasta local `~/Ofertas` conectada; duas abas no perfil separado do Chrome (uma no chatgpt.com logado, outra em branco); Prompt 0 colado no campo de instruções do projeto.

**Cadência declarada por etapa** (útil para saber quando algo travou):

| Etapa | Tempo |
|---|---|
| 1. Montar a Fábrica | 3 min |
| 2. Ficha de Inteligência | 2 min |
| 3. Posicionamento e preço | 1 min |
| 4. A página | 4 min |
| 5. Entregável | 5 min |
| 6. Criativos no automático | 4 min |

**A escada de preço completa.** A tabela de entrada já estava aqui; o que faltava era o bump e o upsell:

| Origem | Entrada | Order bump | Upsell |
|---|---|---|---|
| R$47 a 67 | **R$19,90** | ~R$8 | ~R$47 |
| R$67 a 97 | **R$27,00** | ~R$11 | ~R$67 |
| Acima de R$97 | **R$37,00** | ~R$15 | ~R$92 |

Regra por trás dos números: **order bump ~40% da entrada, upsell ~2,5x a entrada.** Ver [Ponto em aberto 27](pontos-em-aberto.md): o resto do material trabalha com upsell de ~2x.

> **Por que bump e upsell não são opcionais:** "com entrada de 19,90 você não paga tráfego. O que paga tráfego é o ticket médio."

> **O erro que quase todo mundo comete:** pegar uma oferta que já vende a 10 e tentar vender também a 10. "Preço baixo só é vantagem quando ele sai de um produto caro que já está validado." É isso que faz o leilão sair mais barato que o do anunciante usado como referência.

**A anatomia fixa dos 11 blocos.** É esta a "anatomia do projeto" que o prompt da página manda seguir, e o guia afirma que ela não muda de nicho para nicho:

| # | Bloco | Função |
|---|---|---|
| 01 | Hero | prova social curta + headline com a promessa + subheadline com o mecanismo + 1 CTA único + mockup do entregável |
| 02 | Faixa de prova | números reais, prints, quantidade de alunos. **Nunca invente** |
| 03 | O que você vai conseguir | 6 blocos em bento. Benefício, nunca feature |
| 04 | Como funciona | o método em 3 passos. Simplicidade vende |
| 05 | O que você recebe | os 4 PDFs mais o bônus, com mockup visual |
| 06 | Preço | valor cheio riscado, entrada destacada, order bump. **UM preço** |
| 07 | Depoimentos | logo abaixo do preço, "é onde a dúvida aparece" |
| 08 | Garantia | 7 dias incondicional, visível e sem letra miúda |
| 09 | FAQ | 5 perguntas, cobrindo as objeções da ficha mais reembolso e acesso |
| 10 | CTA final | mesmo botão, mesma promessa |
| 11 | Rodapé | CNPJ, termos, privacidade, contato. "Sem isso reprova" |

> ⚠️ Esta anatomia **não bate** com a de 12 blocos da seção 6.1 em três pontos: não tem bloco de **Dor**, fixa a garantia em **7 dias** e proíbe mais de um plano. Ver Pontos em aberto [25](pontos-em-aberto.md), [26](pontos-em-aberto.md) e [28](pontos-em-aberto.md) antes de aplicar.

**O que NÃO se põe numa página de R$19,90:**

- **Navbar com menu.** "Todo link é uma porta de saída do funil."
- **CTA secundário.** "Numa venda por impulso, segunda opção é a opção de não comprar."
- **Três planos.** "Isso é página de software. Você tem 1 entrada, 1 bump, 1 upsell."

**Regras de página do Prompt 0:** sem navbar e sem link que saia da página; **CTA único repetido nas seções 1, 6 e 10**; mobile-first, porque 80% do tráfego é celular. O guia manda abrir o no telemóvel, "é lá que a maioria das páginas quebra".

**Restrições Meta, declaradas "não negociáveis" dentro do próprio Prompt 0:**

- sem promessa de renda garantida ou prazo de resultado;
- sem contador regressivo falso;
- sem alegação direcionada ao corpo ou à saúde do leitor;
- sem depoimento inventado com nome ou foto de pessoa real.

> Note que a última restrição está no prompt do mesmo autor que, na aula gravada, sugeria preencher a prova social com rosto de IA e nome fictício (Ponto em aberto 23). O material escrito é mais rígido que a fonte de origem falada. **Vale o material escrito.**

**Os cinco ângulos de criativo em imagem, finalmente nomeados:** curiosidade, dor, antes/depois, prova, objeção. A seção 12.3 já falava em "5 ângulos" sem dizer quais.

**Regra dos prompts de imagem:** pedir **só a cena visual, sem texto na imagem ou no máximo 3 palavras.** O motivo é operacional: "gerador de imagem erra português, sempre". A headline entra por cima depois, na identidade visual própria, o que também mantém os cinco criativos consistentes entre si e evita descartar imagem boa por uma palavra escrita errada.

**Orquestração dos criativos (Prompt 5):** o Cowork abre a aba do ChatGPT e manda **uma mensagem única com os 5 prompts dentro**, pedindo as 5 imagens em **4:5 retrato**, numeradas, numa só resposta. Nunca uma de cada vez. Se vierem menos de 5, responde "faltaram, gere as restantes na mesma resposta". Se o download travar, baixar à mão e seguir: "não vale queimar tempo com isso".

**Checklist antes de gastar o primeiro real:**

| Página | Produto | Campanha |
|---|---|---|
| abriu no celular e não quebrou | os 4 PDFs na área de membros | pixel instalado na plataforma de vendas |
| nenhum link que saia da página, exceto o checkout | bônus configurado para D+7 | **pelo menos 6 criativos no mesmo conjunto, de preferência 10** |
| CTA nas seções 1, 6 e 10, sempre com o mesmo texto | order bump ativo | **orçamento diário em torno de 2x o ticket** |
| rodapé com CNPJ, termos, privacidade e contato | upsell configurado | início agendado para a madrugada do dia seguinte |
| nenhuma promessa de renda garantida ou prazo | link do checkout colado e testado com um clique real | |
| nenhum depoimento com nome ou foto de pessoa real inventada | | |

> O número de criativos por conjunto conflita com a régua de 4.12.3 (conjunto por ângulo, até 5 dentro). Ver [Ponto em aberto 31](pontos-em-aberto.md).

**Depois que subir:** não vendeu, tira print das colunas do gerenciador e manda para o mesmo Claude que construiu a oferta, porque "ele já tem o contexto inteiro e te diz se o furo está no criativo, na página ou no checkout". Vendeu, sobe o orçamento **30% em 30%, nunca dobra**, "porque dobrar reseta o aprendizado" (já em 12.3).
