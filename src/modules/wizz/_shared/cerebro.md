# Integração com o Cerebro (memória persistente)

O cerebro é a memória do usuário entre sessões (Claude Code, Codex e outros). Modo configurado: **auto-load leve no início + lembrete de salvar no fim**.

## Na ativação do agente (passo prepend)

Carregue contexto de forma **barata**:

1. Rode `/cerebro ver` (ou faça um `grep` leve no vault) para puxar o estado atual do projeto e decisões recentes.
2. Não leia o vault inteiro. Pegue só: onde parou, o que falta, decisões relevantes à área do agente.
3. Se não houver cerebro neste projeto, siga normalmente sem travar.

## Ao encerrar

- Se algo digno de memória aconteceu (decisão de arquitetura/produto, aprendizado, armadilha resolvida, correção do usuário), acrescente ao encerramento:
  `💾 Quer que eu salve isso no cerebro?`
- Se o usuário confirmar, use o comando certo do cerebro:
  - `/cerebro decisao` — decisão de arquitetura/produto
  - `/cerebro salvar` — estado da sessão
  - `/cerebro dump` — captura rápida

## Dever de memória (não-negociável)

Após bug não-óbvio resolvido, decisão importante, armadilha de stack ou correção recebida do usuário, ofereça salvar. É assim que o método aprende. Mas salve **numa camada só**.

## Roteamento: uma fonte por tipo de fato

| tipo de fato | grava em |
|---|---|
| decisão de arquitetura ou de produto | Cérebro `_decisions/` (`/cerebro decisao`) |
| estado do projeto (onde parou, o que falta) | Cérebro `projetos/<nome>.md`, bloco no topo (`/cerebro salvar`) |
| narrativa de sessão (o que rolou no dia) | Cérebro `projetos/<nome>.md`: bloco `Última sessão` (sobrescrito) + 1 linha na tabela `Sessões` |
| armadilha de stack, bug não-óbvio, pegadinha de ambiente | auto-memória do agente (Claude Code: `memory/`) |
| preferência de trabalho, correção recebida do usuário | auto-memória do agente |
| como-fazer, definição de produto, metodologia | o artefato ou a skill; a memória guarda só o **caminho** |

Três regras que sustentam isso:

1. **Um fato mora numa camada só.** As outras guardam no máximo um ponteiro. Nunca escreva o mesmo fato em duas.
2. **Grep antes de gravar.** Busque na camada de destino primeiro. Se o fato já existe, atualize o registro existente em vez de criar um segundo.
3. **Se está num artefato, guarde o caminho.** PRD, story, spec, doc: o conteúdo fica lá, a memória aponta.

## Feature ativa = o tema da memória

O hook `session-rules.js` resolve a feature do branch git e injeta `FEATURE ATIVA: <slug>` no início da sessão. Quando existe, ela é o **eixo único** de organização:

- decisão gravada no Cérebro leva `tema: <slug>` no frontmatter;
- o bloco de estado do projeto registra sob qual feature o trabalho está;
- entrada de auto-memória sobre esse trabalho cita o slug na descrição.

Assim um `grep` pelo slug acha artefato, decisão e armadilha juntos. Não crie um campo `feature:` paralelo ao `tema:`: é um eixo só. Sem feature resolvida, grave sem tema de feature; é estado válido, não problema a corrigir.

Seção "Aprendizados do projeto" no `CLAUDE.md` do projeto **não é passo padrão**. Só em repo compartilhado com outros humanos, e mesmo aí como resumo curto que aponta para a camada canônica.
