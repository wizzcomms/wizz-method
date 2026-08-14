# Módulo Wizz — método de agência em PT-BR

Personalização do WIZZ para a Wizz: linguagem fácil e resumida, cada agente termina com **✅ o que fiz / ➡️ próximo passo / 🎯 comando**, e o `wizz-router` é a porta técnica que triageia pedidos leves para agentes de área ou casos complexos para o `wizz-maestro`.

## Agentes

| Agente | Ícone | Faz | Rota para (skills globais) |
|---|---|---|---|
| `wizz-maestro` | 🧭 | Orquestra trabalhos complexos e multi-área recebidos do router | todos os agentes wizz/wizz |
| `wizz-designer` | 🎨 | Design visual, landing, motion, 3D | premium-landing-ui-researcher, ui-ux-pro-max, motion-3d-director, taste-skill, ui-component-curator |
| `wizz-copy` | ✍️ | Copy, e-mail, headlines | copywriting, email-sequence, humanizer, copy-editing |
| `wizz-seo` | 🔍 | SEO tradicional e de IA | seo-audit, ai-seo, schema-markup, programmatic-seo, site-architecture |
| `wizz-growth` | 📈 | Marketing, CRO, lançamento, preço, churn | marketing-ideas, page-cro, launch-strategy, pricing-strategy, churn-prevention |
| `wizz-ads` | 📢 | Mídia paga | paid-ads, ad-creative, analytics-tracking, MCP meta-ads |
| `wizz-memoria` | 🧠 | Memória do projeto | cerebro |

Os papéis de dev/produto reusam os agentes WIZZ (Mary, John, Winston, Amelia, Sally, Paige), personalizados em PT-BR pelos overrides em `overrides/`.

## Camada Wizz (em todos os agentes)

- **Encerramento** (`_shared/encerramento.md`): bloco ✅/➡️/🎯 ao terminar.
- **Economia de token** (`_shared/token-economy.md`): graphify → cerebro → grep antes de ler arquivos; RTK reescreve shell.
- **Cerebro** (`_shared/cerebro.md`): auto-load leve na ativação, lembrete de salvar no fim.
- **Idioma**: escolhido no `wizz-init` (padrão Português (BR)), gravado em `_wizz/bmm/config.yaml`.
- **Encadeamento**: automático. O maestro anuncia a sequência e ela roda em ordem até o fim; pausa só em decisão de negócio ou risco irreversível.
- **Gate de planejamento** (`_shared/planning-gate.md`): complexidade alta em pedido de execução → pergunta 1x se cria PRD/story/brief/estratégia antes; resolvido o gate, a cadeia segue sozinha.

## Instalação

1. Instale o WIZZ no projeto (o módulo `wizz` aparece como bundled em `src/modules/wizz`).
2. Rode a personalização Wizz (escolha do idioma + overrides dos agentes WIZZ):
   ```bash
   node <caminho-do-wizz-method>/src/modules/wizz/scripts/wizz-init.mjs .
   ```
   Ele pergunta o idioma. Para CI, use `--lang "English"` ou `WIZZ_LANG`. Idempotente: pode rodar quantas vezes quiser.
3. Invoque o `wizz-router` e mande seu pedido. Para trabalhos claramente multi-área, o `wizz-maestro` também pode ser chamado direto.

## Customização pessoal

Os overrides em `overrides/*.toml` são escopo **time** e vão para `_wizz/custom/`. Para ajustes só seus, crie `_wizz/custom/<skill>.user.toml` — ele vence por cima.
