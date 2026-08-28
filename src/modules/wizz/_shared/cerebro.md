# Integração com o Cerebro (memória persistente)

O cerebro é a memória do usuário entre sessões (Claude Code, Codex e outros). Modo configurado: **auto-load leve no início + lembrete de salvar no fim**.

São duas camadas, e cada fato mora em uma só: o **vault** (decisão, estado, sessão) e a **auto-memória do agente** (armadilha de stack, preferência do usuário). O vault é lido igual em qualquer plataforma. A auto-memória carrega sozinha no Claude Code; nas outras (Codex, OpenCode, Gemini) o caminho é o comando `/memoria` do cerebro, que lê o mesmo diretório no disco local. Não existe cópia paralela dos fatos.

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
  - `/cerebro memoria` — armadilha ou preferência (auto-memória), quando o agente não é o Claude Code

## Dever de memória (não-negociável)

Após bug não-óbvio resolvido, decisão importante, armadilha de stack ou correção recebida do usuário, ofereça salvar. É assim que o método aprende. Mas salve **numa camada só**.

## Roteamento: uma fonte por tipo de fato

| tipo de fato | grava em |
|---|---|
| decisão de arquitetura ou de produto | Cérebro `_decisions/` (`/cerebro decisao`) |
| estado do projeto (onde parou, o que falta) | Cérebro `projetos/<nome>.md`, bloco no topo (`/cerebro salvar`) |
| narrativa de sessão (o que rolou no dia) | Cérebro `projetos/<nome>.md`: bloco `Estado` no topo (sobrescrito) + 1 linha na tabela `Sessões` |
| armadilha de stack, bug não-óbvio, pegadinha de ambiente | auto-memória do agente (`memory/` do projeto; fora do Claude Code, via `/memoria`) |
| preferência de trabalho, correção recebida do usuário | auto-memória do agente (idem) |
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

O hook é do Claude Code, e portar hooks para as outras plataformas está **fora de escopo por decisão** (2026-08-28). Em Codex, OpenCode e Gemini não há `FEATURE ATIVA` injetada: resolva o tema do branch git na hora (`git branch --show-current`) ou trabalhe sem tema. Sem hook não é degradação silenciosa; é limite conhecido e documentado.

Seção "Aprendizados do projeto" no `CLAUDE.md` do projeto **não é passo padrão**. Só em repo compartilhado com outros humanos, e mesmo aí como resumo curto que aponta para a camada canônica.
