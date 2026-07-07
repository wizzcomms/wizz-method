# Auditoria Completa do Framework Wizz Method: Parte 1 de 4

Data: 2026-07-07 · Versão auditada: 1.4.2 (main, `fb1d8e54`) · Método: 5 frentes de análise paralelas (arquitetura, orquestração, skills, infraestrutura, processo) + verificação manual dos achados críticos.

Princípio seguido: nenhuma recomendação remove capacidade, especialização ou conhecimento. Tudo é reorganização, desambiguação, fatiamento ou automação.

---

## Sumário executivo

O framework está estruturalmente saudável: registry consistente (67/67 skills batem, zero órfãs, zero fantasmas), secrets limpos (verificado no working tree e no histórico git completo), hooks bem construídos (fail-open, sem condição de corrida), doutrina de portas do designer bem desenhada, e a maior parte dos pins de supply chain feita.

Os problemas se concentram em 4 temas:

1. **Sincronização sem garantia**: repo e instalação global divergem em pontos críticos (tabela de roteamento do router está quebrada nas duas versões, cada uma de um jeito diferente).
2. **Regras escritas à mão em N lugares**: a regra de dispatch existe em 4 cópias manuais, sem geração nem validação cruzada.
3. **Peso físico e de tokens ainda alto**: o pacote npm publicado tem 55MB (9MB de site compilado que vazou, 27MB de MP3), e um pedido roteado ainda custa ~14k tokens de scaffolding (a dieta de jul/2026 atacou hooks e registry, mas não a cadeia maestro→agente→cérebro).
4. **Qualidade de processo sem gate**: o CI roda um subconjunto pequeno do `npm test`, evals nunca rodam automaticamente, não há log de decisão de roteamento, e não existe processo documentado para adicionar/remover componentes.

---

## A. Achados CRÍTICOS

### C1. Tabela de roteamento flat do router está quebrada nas duas cópias (bug ativo)

O `wizz-router/references/routing-table-flat.md` declara na linha 3: "Use esta tabela **só fora de projeto Wizz** (sem `_wizz/`)". Porém:

- **Versão do repo** (`src/skills-lib/wizz-router/references/routing-table-flat.md`, pós-commit `3459cbf4`): a seção "Código e Qualidade" roteia para `wizz-code-review`, `wizz-quick-dev`, `wizz-agent-dev`, `wizz-agent-architect`, `wizz-qa-generate-e2e-tests`. Todas são bmm-skills que **só existem dentro de um projeto com `_wizz/` instalado**. Ou seja, o arquivo roteia, no contexto que ele mesmo define como "fora de projeto Wizz", para skills que não existem nesse contexto. O commit também removeu a linha de "Verificação de existência" que mitigava esse tipo de erro.
- **Versão global instalada** (`~/.claude/skills/wizz-router/references/`): nunca recebeu o sync pós-`3459cbf4` e ainda contém as referências fantasma antigas: `tdd-mastery`, `testing-strategies`, `ci-cd-pipelines`, `database-optimization` (não existem no registry) e até `@dev-fast` / `@plan` / `@review` marcados como "OpenCode agent" (outra ferramenta). O `auditoria-360.md` global também diverge.

Como este repo não tem `_wizz/`, todo pedido não-trivial nesta máquina cai no modo flat e consulta a versão global corrompida. O bug está ativo em produção pessoal agora.

Causa raiz: o commit `3459cbf4` ("validate wizz method references") corrigiu o sintoma (referências que o validador não encontrava) apontando para nomes que o validador encontra no repo, sem considerar o escopo de execução do arquivo. E o `sync:global` não rodou depois.

**Correção:**
1. Reescrever a seção "Código e Qualidade" da tabela flat com o que de fato existe fora de projeto Wizz: skills de `src/skills-lib` (`adversarial-reviewer`, `implementation-planner`, `inicio-de-projeto`, `web-security`, `supabase-postgres-best-practices` etc.) e agentes nativos do Claude Code quando fizer sentido, com a ressalva de disponibilidade.
2. Restaurar a linha de "Verificação de existência" (instrução para o router confirmar que a skill existe antes de oferecer).
3. Rodar `npm run sync:global`.
4. Ensinar o `validate:method-refs` a validar por contexto: referências na tabela flat devem resolver contra `skills-lib` + catálogo nativo, não contra bmm-skills.

### C2. Pacote npm publicado carrega 9MB de site compilado e depende do estado do disco de quem publica

Verificado baixando o pacote real: `wizz-method@1.4.1` tem 55.2MB descompactado, 1273 arquivos, incluindo 109 arquivos de `build/` (site Astro: CSS, pagefind, PNGs de até 5.7MB). O `.gitignore` ignora `build/`, mas como existe `.npmignore`, o npm ignora o `.gitignore` e o `.npmignore` não exclui `build/`. Como `npm run quality` executa `docs:build` antes de release, o diretório está presente no disco na hora do publish e embarca.

Consequências: todo `npx wizz-method install` baixa ~9MB inúteis; o conteúdo do pacote não é reprodutível (depende do que estava no disco).

**Correção:** adotar allowlist `"files"` no `package.json` (listar só `tools/installer/`, `src/`, `web-bundles/`, `skills-registry.yaml`, `wizz-modules.yaml` e o que o runtime precisa). Allowlist é mais robusto que denylist: artefatos novos ficam de fora por padrão. Avaliar também excluir `src/squads/` (2.2MB de fonte arquivada que o próprio `src/squads/README.md` confirma não ser lida em runtime).

### C3. O CI valida um subconjunto pequeno do `npm test` (o teste do hook de roteamento nunca roda no CI)

`package.json` define `test` = `test:refs + test:install + test:urls + test:channels + test:mcp + test:cli + test:deps + test:hooks + lint + lint:md + format:check`. O `.husky/pre-commit` roda tudo localmente, mas `.github/workflows/quality.yaml` só executa `test:install`, `validate:refs` e `validate:skills`. Ficam fora do CI: `test:hooks` (testa exatamente o `wizz-router-enforce.js`, o mecanismo central de triagem), `test:mcp`, `test:cli`, `test:channels`, `test:deps`, `validate:method-refs` e `docs:validate-sidebar`. Um `git commit --no-verify` ou um PR externo passa sem nenhum desses gates.

**Correção (config de CI, risco baixíssimo):** trocar os 3 comandos do job `validate` por `npm test && npm run validate:method-refs`. Fecha também o gap que permitiu o C1 (o `validate:method-refs` melhorado do item C1.4 passaria a rodar em todo PR).

---

## B. Achados ALTOS

### A1. Regra de dispatch ("2+ áreas OU 2+ fatores") duplicada à mão em 4 lugares

Cópias manuais em: `wizz-router/SKILL.md:29-41`, `wizz-maestro/SKILL.md:82-97`, `tools/hooks/wizz-router-enforce.js:145-147` e `wizz-quick-dev/SKILL.md` (paráfrase em inglês). Nenhum build gera essas cópias de uma fonte única; nenhum teste compara. O drift já aconteceu nos arquivos de referência (C1), vai acontecer aqui.

**Correção:** fonte única (um snippet em `tools/` ou no registry) + ou geração no build, ou um teste de CI que extraia e compare as 4 ocorrências e falhe em divergência. A segunda opção é mais barata e não muda o runtime.

### A2. Overhead de scaffolding continua ~14k tokens por pedido roteado, com o cérebro pago 2x

Estimativa ponta a ponta (hook → maestro → agente de área → skill final): ~14.100 tokens antes de qualquer trabalho útil, na mesma ordem dos ~17k pré-dieta. A dieta de jul/2026 atacou hooks e fatiou o registry; a cadeia de delegação em si não foi tocada. Maior item isolado: a skill `cerebro` (~2.656 tokens) é invocada pelo `customize.toml` do maestro E pelo do agente de área na mesma cadeia (~5.3k tokens, 38% do overhead, só nisso).

**Correção:**
1. Protocolo de handoff: quando o maestro delega, declara no handoff "cérebro já consultado: <resumo de 3 linhas>". O `customize.toml` dos agentes ganha a condição "se o handoff já traz o contexto do cérebro, não invoque /cerebro ver". Preserva 100% da capacidade, corta a duplicata.
2. Medir de verdade: rodar 2-3 pedidos reais num projeto Wizz instalado e registrar o custo por etapa (hoje o número é estimativa por tamanho de arquivo).

### A3. Zero observabilidade de decisão de roteamento

Nenhuma decisão (trivial vs não-trivial, agente vs maestro, quais fatores pesaram) é registrada em lugar algum. O hook é advisory-only e não escreve nada em disco. Debugar "por que o maestro chamou o agente errado" exige reler a transcrição inteira. Isso também impede calibrar os 4 fatores (M1) com dados.

**Correção:** trace opt-in. Sob `WIZZ_ROUTER_DEBUG=1`, o hook grava `{timestamp, prompt_hash, isTrivial}` e o maestro/agentes anexam 1 linha de decisão (`área, rota, fatores`) em `_wizz/.router-trace.jsonl` (ou `~/.wizz/routing.log` no modo flat). Append-only, fail-silent, zero custo quando desligado. Bônus: o dataset de evals de roteamento passa a poder ser alimentado por casos reais.

### A4. Módulos externos: 6 repos de terceiros (`bmad-code-org/*`) rotulados como `type: wizz-org`

O `wizz-modules.yaml` lista 6 módulos apontando para repos da org BMAD com rótulo `wizz-org` (enganoso: sugere org própria). Risco de supply chain: repo de terceiro pode mudar de dono, remover branch, alterar conteúdo, e o installer resolve e baixa sem controle da Wizz. Contradiz a narrativa de fork independente.

**Correção (decisão do usuário, duas rotas):** (a) barata: renomear `type` para `upstream-org` e documentar a confiança delegada; (b) completa: forkar os 6 sob `wizzcomms` e apontar os URLs para os forks (controle total, custo de sincronização com upstream; aceitável dado que todos são `defaultSelected: false`).

### A5. Peso do skills-lib no pacote: 27MB de MP3 + 5.3MB de fontes

`src/skills-lib` responde por ~73% do pacote npm. `huashu-design/assets/` tem 5 trilhas MP3 de fundo (27MB) para um recurso opcional de exportação de vídeo; `canvas-design/canvas-fonts/` tem 5.3MB de TTF. Qualquer projeto que escolha a área designer (a mais comum) baixa tudo.

**Correção sem perder capacidade:** mover os MP3 para download sob demanda (o bloco `setup:`/pattern do scrapling já existe como precedente: baixar no primeiro uso do export de vídeo, de release do GitHub ou CDN). Avaliar subset das variantes de fonte. O conhecimento (as skills) fica intacto; só a mídia vira lazy.

### A6. Evals existem mas nunca rodam; o eval de roteamento não testa o dispatch real

48 casos em `evals/routing/dataset.json` com runner real, mas: nenhum script npm ou workflow o chama; sem `--llm`, só os 14 casos triviais são verificados (a heurística `isTrivial` do hook), e os 34 casos de rota ficam sem verificação; mesmo com `--llm`, testa a classificação, não o despacho efetivo do maestro. 31/68 skills têm `evals/evals.json` sem runner algum (julgamento manual por agente).

**Correção:** (1) adicionar `eval:routing` (modo heurístico, grátis) ao CI: pega regressão do `isTrivial` de graça; (2) rodar o modo `--llm` como job manual/semanal com budget; (3) política declarada: "toda skill nova traz 3-5 casos de eval" via PR template (checklist, não gate, enquanto não houver runner).

### A7. Governança inexistente e docs de contribuição de outro projeto

- `CONTRIBUTING.md` ainda fala "BMad strengthens...", pede "BMad version" em bug report, cita "BMad Community Module". Um contribuidor externo não sabe onde está.
- Não existe processo documentado para adicionar skill/agente/MCP/CLI (é preciso engenharia reversa do installer + registry).
- `CHANGELOG.md` para em 1.4.0; `package.json` está em 1.4.2. Sem automação de changelog.
- `removals.txt` (mecanismo real de descontinuação, consumido no update) não é citado em nenhum doc de contribuição.
- README.md com frase de trademark invertida: "Wizz e WIZZ-METHOD são marcas da BMad Code, LLC" (resíduo de find-replace; contradiz o TRADEMARK.md).

**Correção:** ver seção H (modelo de governança proposto).

---

## C. Achados MÉDIOS

### M1. Os 4 fatores de complexidade são ambíguos e circulares
"Áreas" é ao mesmo tempo um dos 4 fatores e uma cláusula independente ("2+ ÁREAS, OU 2+ fatores"). Não está definido se área conta na soma de fatores. Fatores 2-4 não têm limiar objetivo nem exemplos calibrados; o mesmo pedido pode ser classificado diferente em dois momentos. **Correção:** reescrever como duas cláusulas: "SE 2+ áreas → maestro, sempre. SENÃO conte os 3 fatores restantes (multi-passo, precisa planejar, gera artefato memorável); 2+ → maestro". Adicionar 3-4 exemplos calibrados de borda (o dataset de evals já tem candidatos). Aplicar via fonte única (A1).

### M2. Prevenção de loop é só instrucional
Nada programático impede router→maestro→router; só prosa ("pare aqui", "nunca devolve pra ele"). Risco real é baixo, mas o custo de mitigar também: incluir no protocolo de handoff um campo `origem:` e a regra "nunca invocar quem está na cadeia de origem"; cobrir com 1 caso no eval de roteamento.

### M3. RTK: o componente de maior privilégio é o único não pinado
`skills-registry.yaml:408` instala via `curl .../refs/heads/master/install.sh | sh` (branch móvel, sem checksum), enquanto todo o resto do arquivo tem pins de 2026-07-06. O hook do RTK reescreve todo comando Bash da sessão: é o maior privilégio efetivo da stack. Além disso, o bloco do `rtk-rewrite.sh` no `settings.json` não declara `timeout` (os outros 3 hooks declaram `timeout: 5`). **Correção:** pinar em tag de release + `verify` de versão mínima (padrão scrapling); adicionar `timeout` ao hook.

### M4. Memória em 3 camadas sem hierarquia declarada
Cérebro (vault), auto-memória nativa do Claude Code (em uso pesado, 18 arquivos neste projeto) e "CLAUDE.md do projeto, seção Aprendizados" (arquivo que nem existe neste repo, e está no .gitignore). O CLAUDE.md global instrui gravar nas camadas 1 e 3; a prática real usa a 2. **Correção (decisão do usuário):** declarar 1 linha de hierarquia no CLAUDE.md global. Sugestão: Cérebro = fonte de verdade cross-ferramenta (decisões, estado de projeto); auto-memória = operacional do Claude Code (armadilhas, bugs); aposentar a instrução da seção "Aprendizados" em CLAUDE.md de projeto (ou mantê-la só para repos compartilhados com outros humanos).

### M5. Idioma sem convenção documentada; skill mais pesada 100% em chinês
Padrão de fato: skills de marketing em EN (adaptadas de marketplace), infra/arquitetura e camada Wizz em PT-BR. Não documentado em lugar nenhum. Caso extremo: `huashu-design` (393KB, maior do catálogo) inteiramente em chinês, inclusive o `description:` do frontmatter, que é o campo que o roteador lê para decidir ativação; e referencia `frontend-design`, que não existe no registry. **Correção:** documentar a convenção no topo do registry; adicionar description bilíngue (2 linhas) no frontmatter do huashu-design (corpo continua em chinês, zero perda).

### M6. Camada tripla de review adversarial sem mapa
`adversarial-reviewer` (skills-lib, standalone), `wizz-review-adversarial-general` (core-skills, componente do engine) e `wizz-code-review` (bmm-skills, orquestrador) têm descriptions quase idênticas. Servem propósitos genuinamente diferentes, mas nada explica quando usar qual. **Correção:** 2-3 linhas de cross-reference no topo de cada um + espelhar a distinção nos campos `when` do registry.

### M7. Monólitos do installer sobreviveram à dieta
`tools/installer/ui.js` (2.287 linhas), `modules/official-modules.js` (2.229), `core/installer.js` (1.789), contra o teto de 800 linhas das próprias regras do usuário. Não é urgente (código de instalação, não de runtime de tokens), mas é dívida no caminho crítico. **Correção:** fatiar por responsabilidade quando houver janela, protegido pelos testes existentes (`test:install`, `test:channels`).

### M8. Gate do Quick Update: comportamento real não documentado nem testado
`installer.js:309`: Quick Update não instala skills-lib/MCP/CLI (só install/Modify). Já gerou confusão de usuário registrada em memória. `docs/how-to/install-wizz.md:93` não menciona. Nenhum teste cobre (`grep isQuickUpdate test/` vazio). **Correção:** 1 frase no doc + 1 teste de smoke (`isQuickUpdate() === true` → `installSkillsLib` não chamado).

### M9. Fatiamento pendente em 19 skills monolíticas e no agente wizz-social
- 33/67 skills sem `references/`; 19 delas com SKILL.md > 8KB carregado integralmente na ativação. Piores: `graphify` (51KB no SKILL.md, zero references), `decision-maker` (26KB), `humanizer` (24KB), `impeccable` (24KB), `marketing-psychology` (22KB).
- `huashu-design`: mesmo com references, o SKILL.md de entrada tem 62KB (maior que qualquer outra skill inteira); precisa de um índice curto roteando para sub-references por modo de uso.
- `wizz-social` custa ~13.6k tokens na ativação (outros agentes: 1.2-1.7k) por causa de `knowledge/*` (blueprint de 19.6KB); confirmar se o knowledge é carregado sempre ou sob demanda, e fatiar se for sempre.
**Correção:** aplicar progressive disclosure (SKILL.md enxuto: quando usar + primeiro passo; detalhe vai para `references/`). Conteúdo 100% preservado, só muda o momento em que é lido.

### M10. Drift adicional repo↔global e ausência de guarda de sync
`decision-maker` global ainda usa nomes antigos (`wizz-dev`/`quick-dev`; repo: `wizz-agent-dev`/`wizz-quick-dev`). Junto com C1, mostra que o sync é manual e esquecível. **Correção:** um check leve (script `sync:check` que compara hashes repo vs global e avisa; rodar no pre-commit ou como lembrete no fim do `npm test`).

---

## D. Achados BAIXOS (lista curta)

1. `test/test-rehype-plugins.mjs` e `test/test-workflow-path-regex.js` órfãos (nenhum script os roda): ligar ou remover.
2. `test/README.md` documenta 2 de 10 arquivos de teste.
3. Squad `claude-code-mastery` é o único sem `squad.yaml` (11/12 têm): confirmar se quebra o party-mode.
4. CLI `claude-video` com `check:` apontando para `skills/watch`: confirmar diretório real de instalação.
5. Resíduos bmad em conteúdo: `wizz-customize/SKILL.md` recomenda `bmad-builder`; `skill-craftsman.md` (squad) ensina comandos `/bmad-*` inexistentes.
6. `wizz-router` instalado globalmente contraria a Doutrina de Instalação (regra 1: preferir local) sem exceção documentada: documentar a exceção (operacionalmente correta).
7. `module-help.csv` é tratado como schema de primeira classe por 5 arquivos do installer, mas só existe nos módulos core: confirmar se é contrato opcional e documentar.
8. Convenção estrutural não documentada (dirs numerados = fases bmm; nomeados = bibliotecas; EN = portável, PT-BR = camada Wizz): um `src/README.md` curto resolve.
9. `docs/reference/testing.md` não cobre o sistema de testes/evals do próprio repo.

---

## E. O que foi verificado e está SAUDÁVEL (sem achado)

- **Secrets:** nenhum token real em arquivos tracked nem no histórico completo (`git log --all -S` para padrões sk-/ghp_/EAAG/AKIA); todos os MCPs usam placeholders `${VAR}`; correções da auditoria anterior confirmadas (tokens migrados para env do shell).
- **Registry:** 67/67 consistente, zero órfãs, zero fantasmas; duplicações cross-área são intencionais e marcadas.
- **Hooks:** fail-open por design, sem estado compartilhado (sem corrida), custo por prompt já otimizado (~50-70 tokens); repo↔global em sync nos 3 hooks JS.
- **MCPs:** único binário externo (scrapling) tem o bloco `setup:` completo (detect→install→verify); os demais são npx com versão pinada, ausência de `setup:` é consistente.
- **CLIs:** instalação sempre opt-in, falhas não sobem exceção; pins de SHA em buttercut/voicebox/arcads; gate de plataforma funciona.
- **Docs:** estrutura Diátaxis correta; idioma do site consistente com a decisão registrada (EN).
- **Doutrina de portas (designer):** bem resolvida no registry (`entry`/`door`); o problema é só a tabela flat não respeitá-la (C1/A1).

---

## F. Fluxo Maestro→Skills→Agentes: avaliação consolidada

A hierarquia Diretor→Gerente→Agente é conceitualmente correta (triagem barata na frente, orquestração só quando necessário) e o fatiamento do registry por área funciona. Os pontos fracos do fluxo, em ordem de impacto:

1. Dupla consulta ao cérebro na mesma cadeia (A2): resolvível com protocolo de handoff.
2. Critérios de dispatch subjetivos sem trilha de auditoria (M1 + A3): resolvível com regra em duas cláusulas + trace opt-in + exemplos calibrados.
3. Handoff sem contrato: hoje a delegação não declara o que já foi carregado/decidido; um mini-contrato de handoff (origem, cérebro consultado, área, fatores contados) resolve A2, M2 e melhora A3 de uma vez. É a melhoria estrutural de melhor custo-benefício do fluxo.

---

## G. Priorização (impacto × risco)

**Onda 1: imediato, baixo risco, alto impacto**
1. Corrigir tabela flat (repo) + `sync:global` (C1)
2. `"files"` allowlist no package.json (C2)
3. CI rodar `npm test` completo + `validate:method-refs` (C3)
4. Pinar RTK + timeout no hook (M3)
5. CHANGELOG 1.4.1/1.4.2 + rebrand CONTRIBUTING.md + trademark do README (A7)
6. Documentar Quick Update + teste de smoke do gate (M8)
7. Frase de hierarquia de memória no CLAUDE.md global (M4)

**Onda 2: estrutural, risco moderado**
8. Fonte única da regra de dispatch + regra em duas cláusulas (A1 + M1)
9. Protocolo de handoff (cérebro 1x, campo origem, anti-loop) (A2 + M2)
10. Trace de roteamento opt-in (A3)
11. `eval:routing` heurístico no CI + `--llm` semanal (A6)
12. MP3/fontes para download sob demanda (A5)
13. `sync:check` de hashes repo↔global (M10)
14. Decisão sobre módulos externos: rótulo honesto ou forks próprios (A4)

**Onda 3: evolução contínua**
15. Progressive disclosure nas 19 skills monolíticas + índice interno do huashu-design + knowledge do wizz-social (M9)
16. Fatiar monólitos do installer (M7)
17. Cross-references da camada tripla de review (M6) + `when` enriquecidos no registry
18. Baixos da seção D

---

## H. Modelo de governança proposto (hoje inexistente)

1. **Fonte única formalizada:** `skills-registry.yaml` já é a fonte única de fato; formalizar em 1 página (`docs/explanation/governance.md`): todo componente novo entra pelo registry, e roteamento/instalação leem só de lá.
2. **Checklist de PR para componente novo** (template de PR, não gate):
   - Skill: diretório em `src/skills-lib/<id>` + entrada no registry com `area` e `when` desambiguador + `evals/evals.json` (3-5 casos) + `validate:skills` verde.
   - Agente: SKILL.md + customize.toml no padrão dos 9 existentes + entrada de área no registry + caso no dataset de evals de roteamento.
   - MCP: entrada com secret placeholder + `setup:` obrigatório se binário fora do npx.
   - CLI: pin (versão ou SHA) obrigatório + `check:` verificado na prática.
3. **Descontinuação:** remover/renomear exige entrada em `removals.txt` + nota no CHANGELOG. Citar o `removals.txt` no CONTRIBUTING.
4. **Versionamento:** adotar `release-please` ou `changesets` (changelog automático a partir de conventional commits, que o repo já usa).
5. **Sincronização:** `sync:global` deixa de ser lembrança e vira verificação (`sync:check` com hash) no `npm test`.
6. **Ciclo de auditoria:** rodar `eval:routing` no CI (grátis), evals LLM mensais, e auditoria 360 trimestral com este relatório como baseline.

---

## Anexo: custo por componente da cadeia de orquestração (estimado, bytes/4)

| Componente | Tokens |
|---|---:|
| Hook router-enforce (por turno) | ~50-70 |
| wizz-router SKILL.md | ~960 |
| wizz-maestro (SKILL + toml) | ~3.220 |
| cerebro SKILL.md | ~2.656 (pago 2x na cadeia hoje) |
| Índice + fatia de área do registry | ~1.350 |
| Agente de área médio (SKILL + toml) | ~1.300-1.700 |
| wizz-qa | ~1.718 |
| wizz-designer | ~1.978 |
| wizz-social (com knowledge/) | ~13.596 (outlier) |
| Skill final média | ~1.500-3.500 |
| **Total típico por pedido roteado** | **~14.100** |

Nota de método: estimativa por tamanho de arquivo, não medição em execução (não há projeto `_wizz/` instalado neste ambiente). Recomenda-se medição real antes de otimizar além do item A2.
