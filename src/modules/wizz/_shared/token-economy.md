# Economia de Token Wizz

Trabalhe sempre da forma mais barata possível. Menos tokens = mais sessão, mesma qualidade.

## Antes de ler arquivos (ordem obrigatória)

1. `/graphify query "<pergunta>"` — pergunta ao knowledge graph do projeto (mais barato que ler arquivo).
2. `/cerebro ver` — checa o que já foi decidido/registrado.
3. `grep` com padrão específico — antes de abrir arquivos grandes.
4. Só então `Read`, e mesmo assim com `offset`/`limit` quando o arquivo for grande.

Nunca abra arquivos grandes "para entender o contexto" sem antes tentar os 3 passos acima.

## Comandos de shell

- O RTK (Rust Token Killer) já reescreve comandos via hook automaticamente (economia de 60-90%). Não precisa invocar nada.
- Se um comando falhar com "rtk não encontrado", avise o usuário e siga sem ele.

## Output

- **Não narre o passo a passo enquanto trabalha.** Nada de "agora vou fazer X, depois Y". Isso gasta token e polui a conversa. Trabalhe direto e só mostre o resultado.
- **Pause e pergunte no que é importante.** Se aparecer uma decisão que é do usuário, ou algo difícil de desfazer (apagar, publicar, sobrescrever, gastar dinheiro), PARE e pergunte antes de seguir.
- **Feche com resumo curto.** No fim, um resumo enxuto em linguagem simples e fácil de entender, como se explicasse para um cliente.
- Resposta enxuta, em PT-BR fácil. Sem repetir o que o usuário já sabe.
- Não narre opções que você não vai seguir. Recomende e aja.
- Não re-explique o que já foi dito na sessão.
- Para tarefas grandes, delegue a subagentes (Explore/Plan) para não inchar o contexto principal.

## Delegação

Quando a tarefa exigir varrer muitos arquivos, lance um subagente Explore e fique só com a conclusão, não com o despejo de arquivos.

## Despacho barato (regra, não sugestão)

Trabalho mecânico NUNCA roda na sessão principal. Isso inclui: varredura de arquivos, lookup, diff repetitivo, mudança já 100% especificada. Sempre despache 2+ subagentes em paralelo, particionados por arquivo/módulo (nunca dois no mesmo arquivo), com model explícito:

- **`wizz-exec-haiku`**: varredura, lookup, renomeação, diff mecânico, mudança já 100% especificada. Sem ambiguidade nenhuma.
- **`wizz-exec-sonnet`**: implementação do dia a dia, bug com causa raiz já conhecida, edição multi-arquivo, testes.

Review adversarial, arquitetura e decisão ficam no modelo da sessão principal (isso já está nas regras de review de wizz-quick-dev e wizz-code-review; não muda).

Fora do Claude Code (sem subagente nativo), a regra vira o `model_hint` do handoff.
