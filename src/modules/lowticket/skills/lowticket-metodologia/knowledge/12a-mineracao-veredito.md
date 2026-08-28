## 12A. Mineração — veredito e amostra de mercado

> Shard da metodologia desta base. Índice: [`INDEX.md`](INDEX.md) · Sempre carregado junto: [`guardrails.md`](guardrails.md)
> Onde a skill genérica contradisser este shard, **o shard vence**, e isso deve ser dito na resposta.

**O que tem aqui:** `12.5` a régua do minerador (como pontuar, o que reprova) · `12.8` amostra de mercado, pack de criativos de terceiro
**Irmãos:** radar e rubrica em [`12-mineracao-ofertas.md`](12-mineracao-ofertas.md) · produzir a versão melhorada em [`12b-fabrica-de-ofertas.md`](12b-fabrica-de-ofertas.md)

### 12.5 A régua do minerador

Prompt operacional que faz o trabalho de avaliação que a rubrica de 12.2 não cobre: **decidir o que fazer com a oferta depois de achá-la**. Quatro operações: (A) gerar palavras-chave de mineração, (B) analisar uma oferta e dar veredito, (C) comparar 2-3 ofertas, (D) diagnosticar por que uma oferta não escalou.

**Veredito em 4 níveis:** Diamante · Ouro · Média · Descartar.

**Reposicionamento de ticket** (hipótese de trabalho, não regra mecânica) — é a operacionalização do "truque do preço" de 12.1:

| Preço de origem | Vender a |
|---|---|
| R$67 | R$19-27 |
| R$97 | R$27-37 |
| R$147 | R$37-47 |
| R$297 | ~R$97 |

> A fonte da fábrica de ofertas (12.7) usa uma tabela **diferente**: valor fixo por faixa com teto em R$37, em vez de faixa aberta. As duas batem até R$97 e divergem acima. Ver [Ponto em aberto 24](pontos-em-aberto.md).

**Sinais de longevidade:**

- **30+ dias** no ar = validação inicial
- **60+ dias** = sinal forte
- **90+ dias** = sinal muito forte
- **Menos de 14 dias = evidência insuficiente.** Não modelar como comprovada.

**Diagnóstico de por que não escalou — 4 casos:**

| Caso | Sintoma | Onde está o problema |
|---|---|---|
| 1 | CPC ok, mas baixa conversão checkout→venda | oferta, preço, checkout ou prova |
| 2 | CPC alto | criativo, ângulo ou hook |
| 3 | CPA bom mas ROAS ruim | ticket médio, order bump ou upsell |
| 4 | Tudo ruim | **não salvar com criativo** — voltar para a mineração |

> O caso 4 é a regra que economiza dinheiro: quando tudo está ruim, o problema é a oferta, e criativo novo só queima orçamento adiando o diagnóstico.

**Framework de engenharia reversa (a ordem de leitura de qualquer oferta):** Demanda → Hook → Promessa → Mecanismo → Oferta → Preço → Checkout → Monetização → Pós-compra.

**Avaliação de plataforma pela margem, não pela popularidade:** preço × taxa × custo fixo por transação × volume × margem. Decidir pelo **valor líquido recebido**.

**Princípio central:** nunca clonar, sempre reconstruir. Nome, identidade, copy, entregável, domínio e monetização próprios. É a mesma regra 3 de 12.4.

**Regra de evidência.** O prompt proíbe inventar número e fixa frases-padrão para quando o dado não existe: *"Não consigo confirmar isso pelo material enviado."*, *"Minha leitura é..."*, *"Sinal insuficiente para modelar."* Separar observação de inferência é obrigatório no output.

### 12.8 Amostra de mercado — pack de criativos de terceiro

**Não é material de método: é uma oferta concorrente capturada.** 32 páginas do catálogo de vendas de um terceiro (um perfil de revenda) que vende packs de criativos e cursos. Entra aqui, e não na seção 4, porque o valor dele é como **objeto de mineração** — uma oferta low ticket real rodando, do tipo que 12.1 e 12.2 mandam garimpar.

**O que ele confirma na prática:**

| Preço | Aparições | Função |
|---|---|---|
| R$10,00 | 9 | ticket de entrada |
| R$17,00 | 4 | ticket de entrada |
| R$19,90 | 2 | ticket de entrada |
| R$97,00 | 4 | **ancoragem riscada** |
| R$397,00 | 1 | **ancoragem riscada** |

Os tickets de venda ficam entre **R$10 e R$19,90**, exatamente a faixa de entrada que a fábrica de ofertas (12.7) fixa para origem de R$47-67. E as ancoragens de R$97 e R$397 aparecem sempre riscadas, ao lado do preço final — a execução literal do molde `OFERTA DIRETA` de 4.11 ("R$000,00 riscado · Por apenas: 0,00").

**Ofertas presentes:** packs de criativos (o principal: "+900 criativos + aulas de Facebook Ads por R$17"), criativos americanos, criativos vetorizados, curso de Excel (R$397 riscado → R$10) e cursos de culinária (panetone gourmet, hot dog gourmet, "de R$97 por R$19,90").

**O que se aproveita disso:**

1. **Confirma a régua de preço** de 12.7 com oferta real de mercado, não com hipótese.
2. **Mostra a ancoragem em uso**: o desconto declarado chega a 97% (R$397 → R$10). É agressivo até para low ticket, e vale como referência de até onde o mercado vai.
3. **É concorrência direta** se você for vender pack de criativo. O swipe file de 4.10 e os moldes de 4.11 cobrem o mesmo terreno.

> Aplicar aqui a rubrica de 12.2 e o veredito de 12.5 antes de tratar como modelo: não há dado de quantos anúncios ativos, há quanto tempo no ar nem faturamento. **É uma amostra, não uma oferta validada.**

---
