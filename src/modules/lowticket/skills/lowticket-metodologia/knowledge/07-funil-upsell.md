## 7. Funil e upsell

> Shard da metodologia desta base. Índice: [`INDEX.md`](INDEX.md) · Sempre carregado junto: [`guardrails.md`](guardrails.md)
> Onde a skill genérica contradisser este shard, **o shard vence**, e isso deve ser dito na resposta.

### 7.1 Estrutura

1. **Front**: entrada, simples e direto, para conversão inicial alta.
2. **Upsell 1**: oferta complementar logo após o checkout do front. Valida engajamento e reduz o ticket necessário para a venda real.
3. **Upsell 2**: captura quem recusou o primeiro.
4. **Oferta final**: última chance de conversão.

### 7.2 Regras

- **Upsell imediato ou no checkout**, nunca tardio depois do pagamento.
- Não criar upsell só depois de vender o front: valida-se o front, mas o upsell entra cedo.
- Estrutura linear e direta, para evitar fadiga.
- Todo produto do funil precisa de vídeo na landing page.
- Testar e classificar upsells e downsells **semanalmente (~25 por semana)** antes de escalar.
- **Taxa de aprovação esperada no primeiro upsell: 17% a 25%.**

### 7.3 Recuperação de pagamento

PIX + cartão + WhatsApp com código único para recuperação imediata. O WhatsApp reduziu pendências de forma drástica, mais do que simplesmente desativar boleto. Público endividado prefere PIX, e boleto pode sujar a inteligência da campanha.

### 7.4 A régua de preço e conversão do funil

Prompt operacional de origem que transforma um produto principal em funil pós-checkout completo (U1, U2, Downsell, Oferta Final). As réguas embutidas nele são os números mais específicos que o material tem sobre monetização pós-compra.

**Preço de cada etapa — sempre relativo, nunca absoluto:**

| Etapa | Preço |
|---|---|
| **U1** | 40% a 60% do preço do front |
| **U2** | igual ao U1, ou até ~20% acima |
| **Downsell** | 10% a 25% do preço do produto **recusado** |
| **Oferta Final** | piso prático de ~R$9 a R$15 no mercado brasileiro |

> O downsell se calcula sobre o **produto recusado**, não sobre o front. Se a pessoa recusou o U2 (que tem preço próprio), a base é o U2. Errar isso é o engano mais comum: o downsell sai caro demais e ninguém pega.

**Ticket total esperado do funil: 1,5x a 2,3x o preço do front.** É o número que fecha a conta do CPA: o breakeven da seção 3.7 se calcula contra esse ticket total, não contra o front sozinho.

**Conversões esperadas por etapa:**

| Etapa | Conversão |
|---|---|
| U1 | 15% a 25% |
| U2 (entre quem comprou o U1) | 20% a 35% |
| Downsell | 20% a 35% |
| Oferta Final | 18% a 28% |

> A conversão do U1 aqui (15-25%) confirma a faixa de 17-25% já registrada em 7.2. O que era um número solto agora tem a cascata inteira em volta. Isso fecha o [Ponto em aberto 4](pontos-em-aberto.md).

**Regras estruturais:**

- **Máximo de 3 etapas pagas pós-checkout.** A partir de 5, o próprio prompt manda consolidar.
- **Nunca mostrar U2 e Downsell para a mesma pessoa.** Aceitou o U1 → vê o U2. Recusou → vê o Downsell. Todo mundo passa pela Oferta Final.
- Pagamento pós-checkout: preferir **OTO one-click**.

**Anatomia da página de upsell — 10 blocos, nessa ordem:**

1. Indicador de etapa
2. Eyebrow
3. Headline (destacar visualmente **uma só** palavra)
4. Corpo (3 a 5 parágrafos curtos)
5. Ancoragem de preço
6. Card de preço
7. Três bullets de resultado
8. CTA
9. Recusa (o link de "não quero")
10. Barra de confiança

**Vocabulário proibido.** O prompt carrega uma lista de palavras que denunciam texto de IA e derrubam a conversão: *crucial, jornada, mindset, transformador, revolucionário, empoderamento, protagonismo, alavancar, ecossistema, potencializar, holístico, agregar valor, sinergia*, além das aberturas "nos dias de hoje..." e "a verdade é que...". Vale para toda copy do projeto, não só para upsell.
