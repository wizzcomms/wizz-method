![Wizz Method](banner-wizz-method.png)

# Wizz Method

**O método de agência orientado por IA, em português.** Um maestro lê seu pedido, descobre a área e chama o agente certo. Você fala normal, ele organiza o trabalho.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.12.0-brightgreen)](https://nodejs.org)
[![npm](https://img.shields.io/npm/v/wizz-method?color=FF4500&label=wizz-method)](https://www.npmjs.com/package/wizz-method)

Cansado de reexplicar o contexto a cada conversa com a IA? O Wizz Method dá ao seu time uma estrutura fixa: agentes especializados (dev, design, copy, SEO, growth, ads, memória), linguagem fácil e resumida, e um encerramento padrão em toda resposta (**✅ o que fiz**, **➡️ próximo passo**, **🎯 comando**). Tudo em PT-BR, dentro do seu assistente de IA favorito.

O ponto de entrada é um só. Invoque o `wizz-maestro`, mande o pedido, ele despacha para quem resolve.

## Os 7 agentes

| Agente | Faz | Rota para (skills globais) |
|---|---|---|
| 🧭 `wizz-maestro` | Lê o pedido e despacha o agente certo | todos os agentes wizz/wizz |
| 🎨 `wizz-designer` | Design visual, landing, motion, 3D | premium-landing-ui-researcher, ui-ux-pro-max, motion-3d-director, taste-skill, ui-component-curator |
| ✍️ `wizz-copy` | Copy, e-mail, headlines | copywriting, email-sequence, humanizer, copy-editing |
| 🔍 `wizz-seo` | SEO tradicional e de IA | seo-audit, ai-seo, schema-markup, programmatic-seo, site-architecture |
| 📈 `wizz-growth` | Marketing, CRO, lançamento, preço, churn | marketing-ideas, page-cro, launch-strategy, pricing-strategy, churn-prevention |
| 📢 `wizz-ads` | Mídia paga | paid-ads, ad-creative, analytics-tracking, MCP meta-ads |
| 🧠 `wizz-memoria` | Memória do projeto | cerebro |

Os papéis de dev e produto reusam os agentes WIZZ (Mary, John, Winston, Amelia, Sally, Paige), personalizados em PT-BR pelos overrides em `src/modules/wizz/overrides/`.

A camada Wizz vale para todos os agentes: encerramento padrão (✅/➡️/🎯), economia de token (graphify, depois cérebro, depois grep antes de abrir arquivos), auto-load leve do cérebro na ativação e idioma à sua escolha. Detalhes em [src/modules/wizz/README.md](src/modules/wizz/README.md).

## Quick Start

**Pré-requisitos**: [Node.js](https://nodejs.org) v20.12+ · [Python](https://www.python.org) 3.10+ · [uv](https://docs.astral.sh/uv/)

Instale o método no seu projeto:

```bash
npx wizz-method install
```

Siga os prompts, depois abra seu IDE de IA (Claude Code, Cursor, etc.) na pasta do projeto.

Em seguida, rode a personalização Wizz. Ela pergunta o idioma de comunicação dos agentes e aplica os overrides PT-BR. É idempotente: pode rodar quantas vezes quiser.

```bash
node <caminho-do-wizz-method>/src/modules/wizz/scripts/wizz-init.mjs .
```

Por fim, invoque o `wizz-maestro` e mande seu pedido.

**Instalação não-interativa** (para CI/CD):

```bash
npx wizz-method install --directory /caminho/do/projeto --modules bmm --tools claude-code --yes
node <caminho-do-wizz-method>/src/modules/wizz/scripts/wizz-init.mjs . --lang "English"
```

Sem TTY, o idioma padrão é "Português (BR)". Use `--lang` ou a variável `WIZZ_LANG` para definir outro.

## Origem

O Wizz Method é um fork independente do [Wizz Method](https://github.com/bmad-code-org/WIZZ-METHOD), mantido pela Wizz! comms. O motor continua o WIZZ: workflows, agentes de dev e produto e a arquitetura de skills. A camada Wizz adiciona marca, idioma, roteamento e os 7 agentes de agência por cima desse motor. Crédito e agradecimento ao projeto original.

## Documentação

[method.wizzcomms.com](https://method.wizzcomms.com): tutoriais, guias, conceitos e referência.

## Licença

Licença MIT, veja [LICENSE](LICENSE) para detalhes.

**Wizz** e **WIZZ-METHOD** são marcas da BMad Code, LLC. **Wizz Method** é marca própria da Wizz! comms. A licença MIT cobre apenas o código. Veja [TRADEMARK.md](TRADEMARK.md).
