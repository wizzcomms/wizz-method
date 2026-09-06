# Protocolo de Handoff Wizz (fonte única)

Contrato mínimo que todo orquestrador ou spawn de subagente usa ao delegar
trabalho: wizz-router, wizz-maestro, wizz-party-mode (subagent/agent-team)
e swarm-orchestrator. Objetivo: cortar a dupla consulta ao cerebro (cerebro
pago 2x na mesma cadeia), travar o loop router-maestro-router, e passar só
o entrypoint da skill e apenas as referências necessárias (progressive disclosure), não o pacote inteiro.

## Campos do brief

- skill de área: nome canônico da persona a invocar via `Skill` (ex.: `wizz-growth`). Não é `subagent_type`: para isolar a tarefa, escolha um executor nativo disponível (`wizz-exec-*`) e instrua-o a carregar essa skill antes de trabalhar. A ausência de um executor não impede invocar a skill na sessão atual.
- origem: quem está delegando (ex: wizz-router, wizz-maestro). Regra
  anti-loop: nunca invoque quem já está na cadeia de origem. Exemplo
  proibido: router delega pro maestro, maestro devolve pro router.
- cérebro já consultado: resumo de até 3 linhas do que o /cerebro ver já
  trouxe (estado do projeto, decisões recentes relevantes à área). Se este
  campo veio preenchido, quem recebe o handoff não roda /cerebro ver de
  novo, usa o resumo recebido.
- decisões já tomadas na cadeia: lista curta do que já foi decidido antes
  deste handoff (ex: paleta aprovada, escopo definido).
- seção relevante da skill: indique o assunto e as referências necessárias.
  Quem recebe carrega primeiro o SKILL.md completo via invocação da skill;
  depois lê apenas as referências exigidas pela tarefa. Skills carregadas
  pelo lead não são herdadas automaticamente por um subagente.
- model_hint (opcional): degrau da escada, não modelo cru. Valores:
  `haiku | sonnet | opus | review`. Quem recebe despacha `wizz-exec-<hint>`
  (nativo em Claude Code, Codex, OpenCode e Gemini CLI). Escalada: no
  máximo 1 degrau acima se o executor devolver ambiguidade ou os testes
  falharem 2x. `opus` é condicional, só quando a sessão que delega roda
  acima de Opus (detalhe completo em `_shared/model-ladder.md`, no
  módulo wizz). Campo opcional: sem ele o handoff funciona normal.
- precisa planejar (opcional): veredito sim/não do fator de planejamento
  do sinal de complexidade, avaliado por quem delega. Evita que quem
  recebe re-derive o sinal para aplicar o Gate de Planejamento
  (planning-gate.md, _shared do módulo wizz).
- gate (opcional): estado do Gate de Planejamento na cadeia. `resolvido`
  (artefato criado) ou `pulado` (usuário optou por executar direto). Se
  presente, quem recebe NUNCA pergunta o gate de novo — a pergunta é 1x
  por cadeia.

## Exemplo de brief

    origem: wizz-router
    cérebro já consultado: projeto usa Next.js + Supabase; paleta copper
      aprovada; falta terminar o checkout.
    decisões já tomadas na cadeia: escopo é só mobile-first.
    seção relevante da skill: page-cro/references/checkout-flow.md
    model_hint: sonnet

## Regra anti-loop

Hoje a prevenção de loop é só instrucional (nada programático barra). Quem
delega sempre declara `origem`; quem recebe nunca invoca de volta quem
está na cadeia. Se precisar de mais triagem, resolve sozinho ou rebaixa
para o agente de área, nunca devolve para quem chamou.

## Quem usa este protocolo

- wizz-router: declara ao delegar para o agente de área ou para o maestro.
- wizz-maestro: declara ao delegar para os agentes de área.
- wizz-party-mode (mode-subagent, mode-agent-team): inclui o resumo do
  cerebro e as decisões da cadeia no brief de cada persona/subagente.
- swarm-orchestrator: inclui o mesmo resumo no spawn prompt de cada
  teammate (eles não herdam a conversa do lead).

## Cobertura de eval

O cenário de loop router-maestro-router não ganhou caso automatizado em
evals/routing/dataset.json: o runner (run-routing-eval.mjs) testa a
classificação de 1 prompt do usuário (isTrivial + rota via LLM), não
simula uma cadeia de handoff nem lê um campo origem. Um caso com esse
campo não seria exercido por nenhum código do runner hoje. A cobertura
real da regra anti-loop fica instrucional (seção acima) até o runner
ganhar suporte a cenário multi-hop.
