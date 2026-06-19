---
title: Bem-vindo ao Wizz Method
description: Método de agência orientado por IA, em PT-BR, com agentes especializados, fluxos guiados e planejamento adaptável
---

O **Wizz Method** é um método de desenvolvimento e produção de agência orientado por IA, em PT-BR. Ele acompanha o trabalho do início ao fim: da ideia e do planejamento até a implementação assistida por agentes. Oferece agentes especializados, fluxos guiados e planejamento que se ajusta à complexidade do projeto, seja uma correção pequena ou uma plataforma inteira.

Se você já trabalha com assistentes de IA como Claude, Cursor ou GitHub Copilot, está pronto para começar.

:::note[Fork independente do BMad Method]
O Wizz Method é um fork independente do [BMad Method](https://github.com/bmad-code-org/BMAD-METHOD), mantido pela Wizz! comms. O motor continua o BMAD (creditado no arquivo `TRADEMARK.md` do repositório); a camada Wizz adiciona linguagem fácil em PT-BR, encerramento padrão (✅ o que fiz, ➡️ próximo passo, 🎯 comando) e roteamento via `wizz-maestro` para as skills da agência.
:::

## Começando

O jeito mais rápido de entender o método é experimentar.

- **[Primeiros passos](./tutorials/getting-started.md)**: instale e entenda como o Wizz Method funciona.
- **[Mapa de fluxos](./reference/workflow-map.md)**: visão geral das fases, dos fluxos e da gestão de contexto.

:::tip[Só quer mergulhar?]
Instale o Wizz Method e invoque o `wizz-maestro`. Ele lê seu pedido e despacha o agente certo com base no projeto e nos módulos instalados.
:::

## Como usar esta documentação

Os docs estão organizados em quatro seções, conforme o que você quer fazer:

| Seção             | Para quê                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| **Tutoriais**     | Orientado a aprender. Passo a passo para construir algo. Comece aqui se for novo.                     |
| **Guias práticos**| Orientado a tarefas. Soluções para problemas específicos. "Como personalizo um agente?" mora aqui.    |
| **Explicação**    | Orientado a entender. Mergulhos em conceitos e arquitetura. Leia quando quiser saber o porquê.        |
| **Referência**    | Orientado a informação. Especificações técnicas de agentes, fluxos e configuração.                    |

## Expandir e personalizar

Quer estender o Wizz Method com agentes, fluxos ou módulos próprios? A personalização da agência fica no módulo `wizz` (agentes, overrides em PT-BR e o `wizz-init`). Ajustes pessoais ficam em `_wizz/custom/`, que tem prioridade sobre os padrões do time.

## O que você vai precisar

O Wizz Method funciona com qualquer assistente de IA que aceite system prompts ou contexto de projeto. Opções populares:

- **[Claude Code](https://code.claude.com)**: a CLI da Anthropic (recomendada).
- **[Cursor](https://cursor.sh)**: editor de código com IA.
- **[Codex CLI](https://github.com/openai/codex)**: agente de terminal da OpenAI.

Convém ter familiaridade com conceitos básicos de desenvolvimento (controle de versão, estrutura de projeto, fluxos ágeis). Nenhuma experiência prévia com sistemas de agentes é necessária. É para isso que esta documentação existe.

## Comunidade

Tire dúvidas, mostre o que está construindo ou contribua:

- **[GitHub](https://github.com/wizzcomms/wizz-method)**: código-fonte, issues e contribuições.
- **[Wizz! comms.](https://wizzcomms.com)**: a agência por trás do método.

## Próximo passo

Pronto para começar? **[Primeiros passos](./tutorials/getting-started.md)** e construa seu primeiro projeto.
