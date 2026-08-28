## 12. Mineração de ofertas — radar e rubrica

> Shard da metodologia desta base. Índice: [`INDEX.md`](INDEX.md) · Sempre carregado junto: [`guardrails.md`](guardrails.md)
> Onde a skill genérica contradisser este shard, **o shard vence**, e isso deve ser dito na resposta.

**O que tem aqui:** `12.1` o truque do preço · `12.2` rubrica de validação 0-10, corte em 6 · `12.3` do dado ao MVP e a ordem certa · `12.4` três regras de segurança · `12.6` o método compartilhado dos 3 prompts · `12.9` os 5 E
**Irmãos:** veredito e amostra de mercado em [`12a-mineracao-veredito.md`](12a-mineracao-veredito.md) · produzir a versão melhorada em [`12b-fabrica-de-ofertas.md`](12b-fabrica-de-ofertas.md)

### 12.1 O truque do preço

Buscar palavras-chave de ofertas **caras já validadas** (apenas R$47 / R$67 / R$97, "de R$197 por R$67", "método comprovado"...) — nunca ofertas de R$10. O jogo: achar oferta cara validada e vender a própria versão a R$19,90. Quem procura oferta barata pra vender barato entra num leilão que não dá pra ganhar.

### 12.2 Rubrica de validação (0-10, nota de corte 6)

| Critério | Pontos |
|---|---|
| Anúncios ativos no domínio | 1-10 = 0 · 11-30 = 1 · 31-80 = 2 · 80+ = 3 |
| Dias no ar do anúncio mais antigo | <7 = 0 · 7-30 = 1 · >30 = 2 |
| Outros anunciantes no mesmo nicho | só ele = 0 · 2-3 = 1 · 4+ = 2 |
| Preço de origem | <R$37 = 0 · R$37-67 = 1 · >R$67 = 2 |
| Dá pra entregar em PDF sem gravar vídeo | sim = 1 · não = 0 |

Justificativa sempre quebrada por critério (ex.: "3+2+1+2+1 = 9"). Nota <6 nem entra na planilha: "planilha com 200 ofertas medianas não vale nada; com 12 ofertas nota 8 vale o mês inteiro". Guardrails do agente: nunca copiar texto/imagem, nunca repetir domínio, nunca inventar número ("não visível").

### 12.3 Do dado ao MVP e a ordem certa

Da linha da planilha nasce o MVP: nome e posicionamento, entregável em 4 PDFs + 1 bônus liberado após 7 dias (reduz reembolso), estrutura da página seção por seção, 5 ângulos de criativo em imagem. **A ordem certa:** planilha entrega a oferta → MVP em minutos → teste com orçamento pequeno → se não vender, IA analisa os números → se vender, **sobe o orçamento 30% em 30%, nunca dobra** ("dobrar reseta o aprendizado").

### 12.4 Três regras de segurança

1. **Perfil separado do Chrome + Facebook que não é admin da BM** — navegação automatizada nunca na conta que gerencia o dinheiro.
2. **O agente lê, mas não assina nada**: páginas de terceiros podem conter prompt injection; agente só lê biblioteca e escreve na planilha, sem acesso a checkout ou gerenciador.
3. **Inspiração não é cópia**: registra dado público e descreve o ângulo com palavras próprias.

### 12.6 O método compartilhado dos 3 prompts

Os três prompts operacionais de origem são módulos de escopo fechado que se recusam a invadir o terreno um do outro — e compartilham a mesma forma de pensar. Vale como método geral de trabalho no projeto:

1. **A cascata de funil é o eixo de tudo.** `Vendas → IC → CPC → Hook → Hold` aparece igual no gestor de tráfego (campanha própria) e no minerador (oferta de terceiro). É o mesmo diagnóstico apontado para fora ou para dentro.
2. **Uma ação por vez.** Nunca um relatório despejado. O gestor exige uma ação prioritária; o funil avança em 5 etapas; o minerador faz uma pergunta por vez.
3. **Nunca inventar dado.** Os três são repetitivos nisso: parar e perguntar em vez de preencher a lacuna com estimativa.
4. **Gargalo por camada, na ordem certa.** Checkout antes de LP, LP antes de criativo. Localizar **o primeiro ponto em que a operação quebra** e atacar só ele.
5. **Esperar é decisão válida.** Régua de 3x do Bid Cap, corte de 14 dias do minerador, "a melhor decisão muitas vezes é não mexer".
6. **Tom direto, sem elogio de abertura.** Frases curtas, "você" nunca "vc", zero jargão corporativo. A lista de palavras banidas de 7.4 vale para os três.

### 12.9 O mapa dos 5 E

Mapa mental interativo autónomo (HTML com os dados embutidos num array `BLOCKS`, sem servidor), com 27 itens em 5 blocos. **Não traz técnica nova**: quase tudo já está neste documento. O que ele acrescenta é um **mapa de ordem**, útil como checklist de operação e para saber em que etapa uma oferta está travada.

| E | O que decide | Onde está aqui |
|---|---|---|
| **Encontrar** | mercado potencial ("se não tem anúncio a rodar, não há mercado"), oferta para modelar, especialista | 12.1, 12.2, 9.2 |
| **Entender** | mercado, público (dor/desejo/consciência, "rouba as palavras deles" de comentário e review), lista única de recursos da oferta, persona única com nome e rotina | 8, 12.5 |
| **Estruturar** | produto, oferta irrecusável, promessa, mecanismos únicos, entregáveis ("a palavra PDF nunca aparece"), bónus que derruba objeção, order bump (3 a 5 ativos), upsell/downsell | 5, 11.1, 11.4 |
| **Executar** | copy na ordem **página, depois anúncio, depois VSL**; criativo 9x16 com gancho nos 5 primeiros segundos; página com dois planos e pop-up de cross-sell; checkout só e-mail e Pix >75%; Instagram BBF; VSL 90s-2min; gerenciador configurado antes de gastar | 6.1, 6.2, 11.2, 11.3, 11.4 |
| **Escalar** | BM e conta separadas; CBO com bid cap no ticket cheio ("ABO vai deixar de existir"); 17h sem gasto = oferta não passou; 3x o ticket com ROI<1 mata; 3 dias no verde sobe até 50% | 3.7, 11.6 |

**As duas coisas realmente novas:**

1. **Validar o mercado antes de minerar a oferta.** "Se não tem anúncio a rodar, não há mercado." Hoje o documento salta direto para validar uma **oferta** específica (12.1, 12.2); este passo é anterior e mais barato.
2. **A ordem de produção da copy: página, depois anúncio, depois VSL.** Essa sequência não estava declarada em lado nenhum. Faz sentido: a página é onde a oferta fica definida, e anúncio e VSL derivam dela.

> Este mapa fica do lado do mapa dos 5 E, ou seja da fábrica de ofertas. Onde ele bate de frente com a Fábrica (dois planos e pop-up, contra "UM preço só"), o conflito é do próprio autor consigo mesmo. Ver [Ponto em aberto 25](pontos-em-aberto.md).
