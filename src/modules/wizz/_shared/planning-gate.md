# Gate de Planejamento Wizz

Complexidade alta não muda só QUEM cuida do pedido — muda o RIGOR do processo. Este gate converte o fator "precisa planejar antes?" (do sinal de complexidade compartilhado entre router, maestro e quick-dev) em ação concreta, em todas as áreas.

## Quando o gate dispara

Dispara quando TODAS forem verdadeiras:

1. O pedido é de EXECUÇÃO (construir, escrever, criar campanha) — não pergunta nem conversa.
2. O fator "precisa planejar antes?" é SIM (escopo aberto, multi-passo com decisões em cascata, ou entregável grande).
3. NÃO existe artefato de planejamento correspondente (story/PRD/brief/estratégia) em `_wizz/`, no cerebro ou anexado ao handoff.

Se o handoff recebido já declarar `gate: resolvido` (criado ou pulado), NÃO pergunte de novo. O gate pergunta **no máximo 1x por cadeia**.

## Como perguntar (1x, objetivo)

> "Esse pedido é grande o bastante pra merecer [artefato] antes. Crio primeiro (recomendado) ou pulo e executo direto?"

- **Criar** → rode o passo de planejamento da tabela abaixo e SIGA automaticamente para a execução. Não pare entre planejamento e execução.
- **Pular** → execute direto, registre `gate: pulado` no handoff/encerramento e nunca pergunte de novo na mesma cadeia.

## Tabela: área → passo de planejamento

| Área | Situação | Passo antes de executar |
|---|---|---|
| dev | feature única multi-passo | `wizz-create-story` (story com contexto) |
| dev | escopo grande / produto ou módulo novo | `wizz-prd` → `wizz-create-epics-and-stories` |
| dev | mudança estrutural (banco, infra, integração) | `wizz-architecture` antes da story |
| design | página, site ou identidade novos | brief visual (`decision-maker` ou classificação da `premium-landing-ui-researcher`) |
| copy | página inteira, sequência de e-mails | contexto de marketing (`product-marketing-context`) |
| seo | mudança ampla de SEO | `seo-audit` primeiro |
| growth | lançamento, pricing, funil | estratégia (`launch-strategy` / `pricing-strategy` / `content-strategy`) |
| ads | campanha nova / lote de criativos | estratégia de campanha (`paid-ads`) antes de `ad-creative` |
| social | lote de conteúdo / calendário | briefing + calendário antes dos roteiros |
| qa | suíte E2E ampla | plano de testes (fluxos críticos) antes de gerar |

Bom senso vale: bug pontual, tweak visual, 1 post isolado = sem gate.

## Depois do gate: encadeamento automático

Resolvido o gate (artefato criado ou pulado), a cadeia segue **automática** até o fim: cada agente dispara o próximo da sequência anunciada sem pedir confirmação. Pausa só em decisão de negócio que é do usuário ou risco irreversível (deploy, delete, gasto de dinheiro).
