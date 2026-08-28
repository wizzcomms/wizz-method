# Economia de Token Wizz

Trabalhe sempre da forma mais barata possível. Menos tokens = mais sessão, mesma qualidade.

## Antes de ler arquivos (ordem obrigatória)

1. `/cerebro ver` — checa o que já foi decidido/registrado.
2. `grep` com padrão específico — antes de abrir arquivos grandes.
3. Só então `Read`, e mesmo assim com `offset`/`limit` quando o arquivo for grande.

Nunca abra arquivos grandes "para entender o contexto" sem antes tentar os 3 passos acima.

## Comandos de shell

- O RTK (Rust Token Killer) já reescreve comandos via hook automaticamente (economia de 60-90%). Não precisa invocar nada.
- Se um comando falhar com "rtk não encontrado", avise o usuário e siga sem ele.

## Output

As regras de como responder (não narrar, pausar só no que é decisão do usuário, fechar com resumo curto, resposta enxuta por default) moram em **`_shared/communication-rules.md`**, que já entra no prompt de todo agente pelo `include`. Não estão repetidas aqui de propósito: a mesma regra escrita em dois arquivos que carregam juntos é o dobro do token pelo mesmo efeito.

O que é economia de token, e por isso fica aqui:

- Para tarefas grandes, delegue a subagentes (Explore/Plan) para não inchar o contexto principal.

## Delegação

Quando a tarefa exigir varrer muitos arquivos, lance um subagente Explore e fique só com a conclusão, não com o despejo de arquivos.

## Despacho barato (regra, não sugestão)

Trabalho mecânico NUNCA roda na sessão principal. Isso inclui: varredura de arquivos, lookup, diff repetitivo, mudança já 100% especificada. Sempre despache 2+ subagentes em paralelo, particionados por arquivo/módulo (nunca dois no mesmo arquivo), com model explícito:

- **`wizz-exec-haiku`**: varredura, lookup, renomeação, diff mecânico, mudança já 100% especificada. Sem ambiguidade nenhuma.
- **`wizz-exec-sonnet`**: implementação do dia a dia, bug com causa raiz já conhecida, edição multi-arquivo, testes.
- **`wizz-exec-opus`** (condicional): bug sem causa clara, refactor cruzando módulos. Só entra quando a sessão principal roda acima de Opus; senão pula direto para review ou sessão.
- **`wizz-exec-review`** (model inherit): review do diff produzido pelos degraus acima antes de integrar.

Escalada: se o executor devolveu ambiguidade ou os testes falharam 2x no mesmo brief, reemita 1 degrau acima. Máximo 1 escalada por brief. Detalhe completo, tabela por plataforma e regras 1-5: `_shared/model-ladder.md`.

Review de diff pode ir para `wizz-exec-review`; arquitetura e decisão de produto ficam no modelo da sessão principal (isso já está nas regras de review de wizz-quick-dev e wizz-code-review; não muda).

Codex, OpenCode e Gemini CLI recebem os mesmos subagentes em formato nativo via installer; em outras plataformas a regra vira o `model_hint` do handoff.
