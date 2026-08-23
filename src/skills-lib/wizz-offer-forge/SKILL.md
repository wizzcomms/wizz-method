---
name: wizz-offer-forge
description: Forja ofertas irresistíveis de resposta direta e infoprodutos integrando mecanismo único, tese da oferta, empilhamento de valor, garantia reversa, ancoragem de preço e matriz de criativos para tráfego pago. Use quando o usuário quiser criar uma nova oferta do zero, reestruturar oferta existente que não converte, empilhar bônus de alta percepção, definir garantia agressiva ou traduzir pesquisa de público (Piva/VoC) em uma máquina de vendas. NÃO use para pesquisa bruta de público (use pesquisa-de-publico-do-piva) nem redação final de copy de página (use copywriting).
---

# Wizz Offer Forge

Sistema de engenharia e forja de ofertas irresistíveis para tráfego direto e infoprodutos. Converte dados brutos de mercado e dores latentes em uma arquitetura de oferta de alta conversão, blindada contra objeções e pronta para escala em mídia paga.

## O que esta skill entrega

Um artefato mestre `OFFER-SPEC.md` contendo:
1. **Tese da Oferta & Promessa Central** (O Grande Gancho e o Resultado Tangível no Tempo).
2. **Mecanismo Único Duplo** (Mecanismo da Causa + Mecanismo da Solução).
3. **Core Deliverable + Empilhamento de Valor** (Produto Principal + Bônus Anti-Objeção).
4. **Ancoragem de Preço, Modelagem de Planos & Order Bumps / Upsells**.
5. **Garantia Reversa / Inversão de Risco** (Risco Zero ou Ganho Duplo).
6. **Ponte de Tráfego: Matriz de Hooks e Ângulos de Criativos**.

## Princípios de Forja de Oferta

- **Clareza vence criatividade vazia:** Se o prospecto precisa pensar para entender o que ganha, a oferta morreu.
- **Mecanismo Único dá esperança nova:** O público já tentou e falhou. A razão do fracasso anterior não foi incompetência dele, foi a falta do seu Mecanismo.
- **Bônus que matam a próxima dor:** Cada bônus da pilha deve resolver o obstáculo imediato que surge quando o cliente compra o produto principal.
- **Risco invertido:** O custo da inação deve parecer infinitamente maior do que o risco financeiro de comprar.

## Fluxo de Trabalho

### Passo 0 — Coleta de Insumos & Ambição

Consulte o contexto existente ou pergunte ao usuário:
1. **Pesquisa de Público Prévia:** Existe um relatório da skill `pesquisa-de-publico-do-piva` ou notas de VoC? Se sim, importe como insumo primário. Se não, defina Avatar, Dor Latente e Nível de Consciência inicial.
2. **Modelo de Negócio:** Low-ticket (R$ 10 a R$ 97), Front-end médio (R$ 197 a R$ 497) ou High-ticket / Mentoria (R$ 1.000 a R$ 10.000+)?
3. **Veículo de Entrega:** Curso gravado, comunidade, templates/ferramentas, mentoria ao vivo, SaaS ou híbrido?

### Passo 1 — Destilação do Mecanismo Único

Consulte `references/mecanismo-unico.md`:
- **Mecanismo da Causa (O Vilão Oculto):** O motivo real e não-óbvio pelo qual o cliente não teve resultado até hoje com os métodos tradicionais.
- **Mecanismo da Solução (O Veículo Proprietário):** O processo, método ou framework nomeado que torna o resultado previsível e simples.

### Passo 2 — A Grande Promessa & Posicionamento

Formule a Promessa Primária em 1 frase de alto impacto:
`[Resultado Específico Desejado] em [Prazo Crível] sem [Principal Dor / Sacrifício Odiado].`

### Passo 3 — Empilhamento de Valor & Matriz de Bônus

Consulte `references/empilhamento-valor.md`:
- **Produto Principal:** O caminho mais rápido e direto ao resultado.
- **Bônus 1 (Velocidade):** Templates, atalhos, checklists prontos que encurtam a execução.
- **Bônus 2 (Segurança):** Como evitar o erro mais comum ou o que fazer em caso de dúvida.
- **Bônus 3 (Próximo Passo):** O que fazer depois de atingir o primeiro marco.
- **Order Bump Estratégico:** Complemento impulsivo de alta margem (30-50% de take rate).

### Passo 4 — Ancoragem de Preço & Garantia Reversa

Consulte `references/garantia-reversa.md`:
- Preço total empilhado vs Preço de ancoragem vs Preço real de lançamento/escala.
- **Garantia Incondicional:** 7, 15 ou 30 dias sem atrito.
- **Garantia Condicional Agressiva (Inversão de Risco):** "Se você aplicar o método X por Y dias e não atingir Z, devolvo 100% do seu dinheiro + R$ 100 do meu bolso pelo seu tempo perdido."

### Passo 5 — Ponte de Tráfego & Ângulos de Anúncios

Consulte `references/ponte-trafego.md`:
- Mapeie 3 a 5 ganchos diretos para alimentar `ad-creative` e `paid-ads` no `traffic-masters` (Pedro Sobral / Molly Pittman / Ad Midas):
  1. *Gancho da Quebra de Padrão / Vilão Revelado*
  2. *Gancho do Erro Comum / Teste Rápido*
  3. *Gancho da Demonstração do Mecanismo*
  4. *Gancho da História de Transformação / Case*

### Passo 6 — Compilação e Entrega

Grave o artefato final em `{output_folder}/offers/OFFER-[NOME_SLUG].md` e apresente um resumo executivo com os 4 pontos de decisão para validação imediata do usuário.
