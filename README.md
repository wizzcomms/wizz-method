![Wizz Method](banner-wizz-method.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.12.0-brightgreen)](https://nodejs.org)

O **Wizz Method** é o método de agência da Wizz! comms., orientado por IA e operado em PT-BR. Linguagem fácil e resumida, sem floreio. Cada agente termina sempre com um bloco padrão: **✅ o que fiz**, **➡️ próximo passo**, **🎯 comando**.

O ponto de entrada é o `wizz-maestro`: ele lê o pedido, descobre a área (dev, design, copy, SEO, growth, ads, memória) e despacha o agente certo, roteando para as ~80 skills globais.

## Origem

O Wizz Method é um fork independente do [BMad Method](https://github.com/bmad-code-org/BMAD-METHOD), mantido pela Wizz. O motor interno continua sendo o BMAD: workflows, agentes de dev/produto e a arquitetura de skills. A camada Wizz adiciona marca, idioma PT-BR, roteamento e os 7 agentes de agência por cima desse motor. Crédito e agradecimento ao projeto original.

## Os 7 agentes Wizz

| Agente | Faz | Rota para (skills globais) |
|---|---|---|
| 🧭 `wizz-maestro` | Lê o pedido e despacha o agente certo | todos os agentes wizz/bmad |
| 🎨 `wizz-designer` | Design visual, landing, motion, 3D | premium-landing-ui-researcher, ui-ux-pro-max, motion-3d-director, taste-skill, ui-component-curator |
| ✍️ `wizz-copy` | Copy, e-mail, headlines | copywriting, email-sequence, humanizer, copy-editing |
| 🔍 `wizz-seo` | SEO tradicional e de IA | seo-audit, ai-seo, schema-markup, programmatic-seo, site-architecture |
| 📈 `wizz-growth` | Marketing, CRO, lançamento, preço, churn | marketing-ideas, page-cro, launch-strategy, pricing-strategy, churn-prevention |
| 📢 `wizz-ads` | Mídia paga | paid-ads, ad-creative, analytics-tracking, MCP meta-ads |
| 🧠 `wizz-memoria` | Memória do projeto | cerebro |

Os papéis de dev/produto reusam os agentes BMAD (Mary, John, Winston, Amelia, Sally, Paige), personalizados em PT-BR pelos overrides em `src/modules/wizz/overrides/`.

A camada Wizz aplica a todos os agentes: encerramento padrão (✅/➡️/🎯), economia de token (graphify → cerebro → grep antes de ler arquivos), auto-load leve do cérebro na ativação e idioma PT-BR. Detalhes em [src/modules/wizz/README.md](src/modules/wizz/README.md).

## Quick Start

**Pré-requisitos**: [Node.js](https://nodejs.org) v20.12+ · [Python](https://www.python.org) 3.10+ · [uv](https://docs.astral.sh/uv/)

Instale o método no seu projeto:

```bash
npx wizz-method install
```

Siga os prompts do instalador, depois abra seu IDE de IA (Claude Code, Cursor, etc.) na pasta do projeto.

**Instalação não-interativa** (para CI/CD):

```bash
npx wizz-method install --directory /caminho/do/projeto --modules bmm --tools claude-code --yes
```

Em seguida, rode a personalização Wizz (escolha do idioma + overrides dos agentes BMAD). O comando é idempotente: pode rodar quantas vezes quiser.

```bash
node <caminho-do-wizz-method>/src/modules/wizz/scripts/wizz-init.mjs .
```

Ele pergunta o idioma de comunicação dos agentes. Para CI ou modo não-interativo, passe `--lang "English"` (ou a variável `WIZZ_LANG`); sem TTY o padrão é "Português (BR)".

Por fim, invoque o `wizz-maestro` e mande seu pedido.

## Documentação

[method.wizzcomms.com](https://method.wizzcomms.com): tutoriais, guias, conceitos e referência.

## Licença

Licença MIT, veja [LICENSE](LICENSE) para detalhes.

**BMad** e **BMAD-METHOD** são marcas da BMad Code, LLC. **Wizz Method** é marca própria da Wizz! comms. A licença MIT cobre apenas o código. Veja [TRADEMARK.md](TRADEMARK.md).
