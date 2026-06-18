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

- Resposta enxuta, em PT-BR fácil. Sem repetir o que o usuário já sabe.
- Não narre opções que você não vai seguir. Recomende e aja.
- Não re-explique o que já foi dito na sessão.
- Para tarefas grandes, delegue a subagentes (Explore/Plan) para não inchar o contexto principal.

## Delegação

Quando a tarefa exigir varrer muitos arquivos, lance um subagente Explore e fique só com a conclusão, não com o despejo de arquivos.
