# Auditoria Completa do Framework Wizz Method: Parte 4 de 4 (Final)

Data: 2026-07-07 · Versão auditada: 1.4.2 (main, `fb1d8e54`) · Método: síntese das partes 1-3 + 2 verificações mecânicas dirigidas (mecanismos de robustez; observabilidade e governança) executadas em modelos de menor custo.

Escopo desta parte: identificação de lacunas contra frameworks modernos de sistemas multiagente, proposta de refatoração global, priorização consolidada, estimativa de impacto, matrizes de trade-off, checklist final, relatório final consolidado, pontuação e plano de ação. Este documento fecha a auditoria e serve de baseline para a próxima (recomendação: trimestral).

Princípio mantido: nenhuma recomendação remove capacidade, especialização ou conhecimento.

---

## 1. Identificação de Lacunas

Comparação com o estado da arte de frameworks multiagente (padrões consolidados em orquestradores de agentes, pipelines de LLM e plataformas de automação: separação triagem/orquestração, registry-driven, trace de decisão, evals contínuos, guardrails de entrada/saída, versionamento por componente, controle de custo por rota de modelo).

Resumo do inventário (verificado no código nesta parte):

| Mecanismo | Estado no Wizz Method | Prioridade | Quando |
|---|---|---|---|
| Observabilidade | Ausente (nenhuma decisão registrada; falhas silenciosas como modo default) | **Alta** | Agora |
| Logging estruturado | Ausente (só console.log/prompts.log; zero JSONL) | **Alta** | Agora (junto com observabilidade) |
| Auditoria de decisões do Maestro | Ausente (nenhuma instrução de registro no wizz-maestro) | **Alta** | Agora |
| Validação de entrada (registry) | Parcial (validate-skills/refs existem; sem schema formal; parse engolido em silêncio, M11) | **Alta** | Agora |
| Governança | Parcial (SECURITY.md bom; CONTRIBUTING de outro projeto; sem processo de componente novo) | **Alta** | Agora |
| Políticas de segurança | Parcial (SECURITY.md existe e é honesto sobre supply chain; execução diverge: C4/C5/A8) | **Alta** | Agora |
| Versionamento de MCPs | Existe (pins com data e comentário) mas o canal de atualização está congelado (A13) | **Alta** | Agora (A13) |
| Controle de contexto | Parcial (dieta feita nos eixos horizontal/vertical; eixo lateral aberto, A12) | **Alta** | Agora (A12) |
| Gerenciamento de dependências | Parcial (lockfile ✓, pins ✓, engines ✓; sem Dependabot/Renovate) | **Média** | Agora (esforço mínimo) |
| Controle de compatibilidade | Parcial (engines node>=20.12 ✓, semver no installer ✓; detect de CLI nunca compara versão, M27) | **Média** | Agora (M27) |
| Gerenciamento de configuração | Parcial (sync-global unidirecional, manual, não cobre rtk-rewrite.sh; sem verificação de drift) | **Média** | Agora (sync:check) |
| Controle de custos (rota de modelo) | Ausente no framework (preferência existe só na memória pessoal do usuário) | **Média** | Agora (barato) |
| Monitoramento de consumo de tokens | Parcial (rtk gain cobre só shell; a cadeia de orquestração nunca foi medida em execução) | **Média** | Fase 2 |
| Telemetria / métricas | Ausente (nenhuma coleta de uso do framework) | **Média** | Fase 2 (opt-in) |
| Versionamento de Skills | Parcial (metadata.version em parte das skills; registry `version: 1`; sem enforcement) | **Média** | Fase 2 |
| Mecanismos de retry | Ausente (fetches de rede do installer sem retry) | **Média** | Fase 2 |
| Validação de saída | Parcial (checklists nos workflows bmm; nada programático) | **Baixa** | Fase 3 |
| Versionamento de Agentes | Ausente (customize.toml sem campo version) | **Baixa** | Fase 3 |
| Versionamento de prompts/workflows | Ausente além do git | **Baixa** | Fase 3 (git basta hoje) |
| Cache inteligente | Parcial (deps-cache, tag cache, resolution cache; suficiente) | **Baixa** | Fase 3 |
| Mecanismos de fallback | Existe (fail-open consistente em hooks/CLIs/MCPs/rtk); falta só o aviso | Atende c/ ressalva | Aviso entra na observabilidade |
| Circuit breaker | Ausente; **não recomendado** (não há serviço residente para proteger) | Baixa | Não implementar |

### Detalhe por lacuna relevante

**Observabilidade + logging estruturado + auditoria do Maestro (tratar como uma única iniciativa).**
Por que: o achado transversal das partes 1-3 é que degradação silenciosa é o modo de falha default (tabela flat quebrada em produção por dias, registry corrompido sem aviso, rtk 13 versões atrás sem detecção, colisão de MCP silenciosa). Frameworks multiagente maduros registram cada decisão de roteamento e cada fallback acionado. Impacto: transforma debugging de "reler transcrição inteira" em "ler 1 linha de trace"; alimenta os evals de roteamento com casos reais; é pré-requisito para calibrar os 4 fatores de dispatch com dados. Forma mínima (proposta A3 estendida): sob `WIZZ_ROUTER_DEBUG=1`, hook grava `{ts, prompt_hash, isTrivial}` e maestro/agentes anexam 1 linha JSONL de decisão (`área, rota, fatores, origem`) em `_wizz/.router-trace.jsonl`; todo fallback/catch relevante ganha 1 warning visível. Custo zero quando desligado. Prioridade **Alta**, agora.

**Validação de entrada (schema do registry).**
Por que: `skills-registry.yaml` é a fonte única de roteamento E instalação; hoje um typo estrutural (campo renomeado, indentação) degrada os dois sistemas sem alarme. Um schema leve (pode ser função de validação própria com 30 linhas: campos obrigatórios por tipo de entrada skill/MCP/CLI, tipos, ids únicos) rodando no `npm test` fecha a classe inteira de erro. Não precisa de ajv/zod se quiser evitar dependência; precisa de mensagens claras. Impacto: alto (protege o SPOF). Prioridade **Alta**, agora.

**Governança.**
Por que: já desenhada na parte 1 (seção H); esta parte confirma que as peças existem soltas (SECURITY.md bom, removals.txt funcional, conventional commits em uso) e falta só o documento que as amarra + checklist de PR + changelog automático. Prioridade **Alta**, agora (é escrita de doc, não código).

**Dependabot/Renovate.**
Por que: o repo tem lockfile e pins, mas nenhum robô avisa de CVE ou bump disponível; a filosofia de "pin consciente" precisa de um fluxo de consciência, senão vira pin eterno (o drift do rtk provou). Dependabot com `versioning-strategy: increase` só para `package.json` + alertas de segurança é config de 15 linhas. PRs de bump continuam passando pelo gate humano. Prioridade **Média** (impacto alto, mas o registry YAML fica fora do alcance dele; cobre só o npm). Agora, porque o esforço é mínimo.

**Controle de custos por rota de modelo.**
Por que: a preferência "trabalho braçal em Haiku/Sonnet, Opus para review/arquitetura" existe só na memória pessoal do usuário; o framework não a codifica. Agentes que despacham subagentes (maestro, party-mode, swarm) não recebem nenhuma orientação de tier de modelo por tipo de tarefa. Impacto: custo direto de API em todo uso multi-agente. Forma mínima: 3-4 linhas no protocolo de handoff compartilhado ("tarefa mecânica/varredura → modelo barato; síntese/decisão → modelo do usuário") + campo opcional `model_hint` nos briefs. Prioridade **Média**, agora (é prosa no lugar certo, esforço baixo).

**Monitoramento de tokens da cadeia de orquestração.**
Por que: os ~14.1k tokens por pedido roteado (parte 1) são estimativa por tamanho de arquivo; nenhuma medição em execução existe. Sem medir, a próxima dieta será chute. Forma mínima: 2-3 execuções reais instrumentadas por trimestre num projeto Wizz real, registradas em `_audit/`. Não construir dashboard; é amostragem, não telemetria contínua. Prioridade **Média**, fase 2.

**Versionamento de skills/agentes/prompts.**
Por que separar: MCPs/CLIs já têm pin (o que falta é o canal de bump, A13/M27, já priorizado). Skills têm `metadata.version` inconsistente; agentes e workflows não têm nada. O valor real de versionar skills apareceria num cenário de distribuição independente (marketplace, updates parciais); hoje tudo viaja junto na versão do pacote npm, que o manifest.yaml já grava (`wizzVersion`). Recomendação honesta: **não investir agora**; padronizar `metadata.version` nas skills novas via checklist de PR (custo zero) e deixar versionamento por componente para quando houver distribuição desacoplada. Prioridade **Baixa**, fase 3.

**Retry.**
Por que: os pontos de rede do installer (npm registry lookup, git clone, fetchJson de channels) falham direto na primeira falha transitória. Um retry simples (1 re-tentativa com backoff curto, só em erro de rede) nos 3-4 call sites resolve. Não generalizar em biblioteca. Prioridade **Média**, fase 2.

**Circuit breaker.**
Por que NÃO implementar: circuit breaker protege chamadas repetidas a serviço degradado em runtime de produção. O framework não tem serviço residente nem loop de chamadas em volume; os consumidores de rede são o installer (execução única, interativa) e MCPs (gerenciados pelo cliente Claude Code, que já tem seu próprio ciclo). Adicionar seria complexidade sem cenário. Registrar como decisão consciente.

**Validação de saída.**
Por que parcial basta: os workflows bmm já validam por checklist (wizz-prd, wizz-create-story, document-project). Validação programática de saída de agente (schema de artefato) só compensa quando artefatos são consumidos por máquina; hoje são consumidos por humanos e agentes leitores. Prioridade **Baixa**; revisitar se surgir pipeline artefato→máquina.

---

## 2. Refatoração Global

**Veredicto: a arquitetura atual é adequada no desenho macro e não deve ser reorganizada por inteiro.** A separação em camadas (hook de triagem barato → router Diretor → maestro Gerente → agentes de área → skills → MCPs/CLIs, com registry como fonte única) é o padrão correto para o problema e sobreviveu bem ao red team da parte 2. Uma reorganização big-bang destruiria estabilidade sem ganho proporcional. O que se recomenda é **refatoração dirigida em 5 pontos**, todos já mapeados nas partes 1-3, mantendo API e comportamento:

### 2.1 O que fica como está (e por quê)

- **Topologia de diretórios `src/` por tipo de artefato** (bmm-skills fases numeradas, core-skills, modules, skills-lib, squads): convenção funcional; o problema é ela não estar escrita, não a convenção em si. Corrige-se com `src/README.md` de 20 linhas (baixo D8 da parte 1), não com moves.
- **Registry único (`skills-registry.yaml`)**: manter como SPOF consciente; a mitigação certa é schema + warning (lacuna acima), não fatiar em N arquivos (fatiar criaria o problema de consistência entre arquivos que o registry único evita).
- **Fail-open em toda a stack**: manter; adicionar aviso, nunca fechar.
- **CLIs opt-in, MCPs com placeholder, merge aditivo**: manter o desenho; A13 adiciona o canal de update sem tirar a proteção.
- **6 MCPs para 9 áreas**: parcimônia correta confirmada na parte 2; não preencher por completude.

### 2.2 As 5 refatorações dirigidas

1. **`tools/installer/modules/registry-resolve.js`** (A16): unifica as 3 cópias divergentes de resolução por área (`resolveMcps`/`resolveClis`/`resolveSkillIds`) numa função parametrizada; os três viram wrappers finos. É a refatoração de melhor razão risco/retorno do repo (3 suítes de teste já cobrem o comportamento).
2. **`tools/lib/`** (M15): walk de arquivos + parse de frontmatter compartilhados pelos 3 validadores; allowlist derivada do registry; CSV unificado em `csv-parse/sync`.
3. **Extração do god-object `installer.js`** (A15): 4 módulos por composição (`user-file-preservation`, `module-config-writer`, `help-catalog`, `quick-update`), levando teste junto na extração (A17).
4. **`include` no `resolve_customization.py` + `_shared/communication-rules.md`** (A11): a única forma hoje de compartilhar regra entre 15 customize.toml é copiar texto; o include é a correção de causa raiz do drift de prosa. Colapsa 21 cópias da regra de comunicação e 5 variantes da ECONOMIA em 1 fonte.
5. **Protocolo de handoff como documento compartilhado** (A2+A12+M2): um `src/core-skills/_shared/handoff-protocol.md` único que router, maestro, agentes, party-mode e swarm referenciam, com o contrato mínimo do brief: `origem` (anti-loop), `cérebro já consultado: <resumo 3 linhas>` (corta a dupla consulta), `decisões já tomadas na cadeia`, `seção relevante da skill` (progressive disclosure no spawn) e `model_hint` (controle de custo). Resolve de uma vez o gap lateral (o pior eixo do fluxo de contexto) e evita que cada mecanismo multi-agente novo recrie o mesmo buraco.

### 2.3 Novas interfaces propostas (todas aditivas)

- `resolveAreaEntries(registry, selectedAreas, opts)` (item 1).
- `include = [...]` no customize.toml (item 4; ignorado por quem não usa).
- Bloco `verify:` opcional em entradas de CLI do registry (M14) e campo `min_version:` (M27).
- Cadeia de providers de env var (`ProcessEnv → DotenvFile → prompt`) da feature env vars (parte 3, E3), sem plugin system.
- JSDoc typedef do contrato UI↔Installer (`{toWrite, toRecommend}`), formalização sem custo de runtime.

### 2.4 Comunicação entre componentes (Maestro, Agentes, Skills, MCPs, CLIs, Memória, RTK)

O diagnóstico consolidado é que a comunicação vertical (cadeia de delegação) e a horizontal (sessão) estão saudáveis após as dietas; os dois canais doentes são o **lateral** (subagentes cegos, A12) e o **temporal** (memória com contradições, A10). O protocolo de handoff (2.2.5) trata o lateral; a higiene do Cérebro (A10: passo de compactação no /salvar, linha vault:, promoção de decisões, convenção de datas) trata o temporal. RTK entra na comunicação como intermediário de shell: o contrato dele precisa virar verificável (C4: versão comparada, hook versionado no repo, teste de fumaça de reescrita).

---

## 3. Priorização Consolidada

Consolida as ondas das partes 1-3 + lacunas desta parte numa classificação única.

### Prioridade Alta (grande impacto, baixo risco, melhora imediata)

| # | Item | Origem | Justificativa da classificação |
|---|---|---|---|
| 1 | Corrigir tabela flat do router + sync:global | C1 | Bug ativo em produção pessoal; correção é edição de markdown |
| 2 | `files` allowlist no package.json | C2 | Corta 9MB+ do pacote; 1 campo de config; reversível |
| 3 | CI rodar `npm test` completo + validate:method-refs/refs/skills | C3+A8 | Fecha a classe de regressão que permitiu C1; só config de CI |
| 4 | RTK: atualizar binário, check com versão, hook versionado, checksum, timeout | C4+M3 | Maior privilégio da stack com maior drift; correções pequenas e independentes |
| 5 | Supabase `--read-only`/`--project-ref` + nota de confiança meta-ads | C5 | Redução de blast radius de secret com 2 linhas de YAML |
| 6 | Pinar hyperframes/claude-video/distribb | A8 | Fecha execução de HEAD de terceiro; padrão já existe no arquivo |
| 7 | Quick Update comunicado (hint + log + resumo) | C6 | Confusão real já registrada; correção aditiva de 30 min |
| 8 | Trace de roteamento opt-in JSONL + warnings em todo fallback/catch | A3+M11+lacuna | Ataca o padrão sistêmico (degradação silenciosa); custo zero desligado |
| 9 | Schema/validação formal do registry no `npm test` | lacuna | Protege o SPOF dos dois sistemas (roteamento + instalação) |
| 10 | Governança: governance.md + checklist de PR + release-please + CONTRIBUTING rebrand + CHANGELOG | A7+H | Só escrita e config; destrava contribuição externa |
| 11 | Instrução de MCP nos toml de growth/architect/analyst + remover playwright da tabela flat + SCAN_ROOTS | A9 | Capacidade instalada sem uso vira capacidade usada; poucas linhas |
| 12 | Hierarquia de memória declarada + higiene do Cérebro | M4+A10 | Memória errada apresentada como fato é o risco de qualidade nº 1 |

### Prioridade Média (importante, mais esforço ou com dependências)

| # | Item | Origem | Justificativa |
|---|---|---|---|
| 13 | `include` no resolver + `_shared/communication-rules.md` + colapsar 15 cópias | A11+M17 | Causa raiz do drift de prosa; exige teste do resolver e edição dos 15 toml |
| 14 | Protocolo de handoff compartilhado (origem, cérebro 1x, disclosure no spawn, model_hint) | A2+A12+M2+lacuna custo | Melhor custo-benefício estrutural, mas toca 5+ arquivos de mecanismo |
| 15 | Marcador de conteúdo para update de pins no `.mcp.json` | A13 | Destrava canal de fix de segurança; risco médio (merge) |
| 16 | `registry-resolve.js` + `tools/lib/` + CSV único | A16+M15 | Refatoração protegida por testes; médio esforço |
| 17 | `min_version` no detect de CLIs + `verify:` opcional + prefixos brew/pip no resolveBinPath | M27+M14+M25+M13 | Fecha a causa raiz do drift do rtk para todas as CLIs |
| 18 | eval:routing heurístico no CI + `--llm` periódico + smoke test de install `--yes` | A6+A17 | Qualidade de processo; depende do CI já corrigido (item 3) |
| 19 | Dependabot (npm) + retry nos fetches de rede do installer | lacunas | Baixo esforço, mas em cadência própria (PRs de bump recorrentes) |
| 20 | Falhas parciais → `results` com status warn + catches com aviso | M24+M23 | Sinal estruturado para automação; toca contrato de saída |
| 21 | Decisão módulos externos: rótulo `upstream-org` ou forks | A4 | Decisão do usuário; ambas as rotas são simples, mas a escolha é estratégica |
| 22 | MP3/fontes para download sob demanda | A5 | Corta 27MB+; exige hospedar assets e testar primeiro uso |
| 23 | `sync:check` de hashes repo↔global | M10 | Depende de decidir a semântica (avisar vs falhar) |
| 24 | Gates de plataforma nas CLIs POSIX-only + declarar suporte macOS/Linux/WSL | M20 | Honestidade imediata; solução completa (checks em Node) fica para depois |
| 25 | Medição real da cadeia de orquestração (amostragem trimestral) | lacuna | Pré-requisito para a próxima dieta ser baseada em dados |

### Prioridade Baixa (incremental ou preparatório)

| # | Item | Origem | Justificativa |
|---|---|---|---|
| 26 | Extração do god-object installer.js (4 módulos) | A15+M7 | Dívida real, mas código de instalação, não de runtime; risco médio sem urgência |
| 27 | Install atômico (tmp + swap) | A14 | Alto esforço, cenário raro; fazer fresh-install primeiro, update depois |
| 28 | Feature env vars (design corrigido: settings.local.json) | C7+E | Valiosa, mas nasce para 4 variáveis; depende dos itens 15-17 |
| 29 | Progressive disclosure nas 19 skills monolíticas + huashu index + wizz-social knowledge | M9 | Ganho por skill ativada; trabalho de formiga, zero risco, sem pressa |
| 30 | Dedup do graphify (7 blocos repetidos) | M19 | Localizado e pequeno |
| 31 | Cross-references da camada tripla de review | M6 | Clareza, não correção |
| 32 | `metadata.version` padronizado em skills novas (via checklist) | lacuna | Preparatório para distribuição desacoplada futura |
| 33 | Validação programática de saída de artefatos | lacuna | Sem consumidor máquina hoje |
| 34 | Job de CI com install de fumaça em container Linux | parte 2 J | Cobre gap de mocks; custo de manutenção de CI |
| 35 | Baixos das partes 1-3 (testes órfãos, naming, docs pontuais) | D | Higiene contínua |

---

## 4. Estimativa de Impacto

Legenda: ++ melhora forte, + melhora, 0 neutro, − piora aceitável. Colunas: Arq = arquitetura, Perf = performance, Tok = consumo de tokens, Man = manutenção, Esc = escalabilidade, DX, Seg = segurança, Cx = complexidade de implementação (− = adiciona complexidade).

| Item | Arq | Perf | Tok | Man | Esc | DX | Seg | Cx | Esforço |
|---|---|---|---|---|---|---|---|---|---|
| 1 Tabela flat + sync | + | 0 | + | + | 0 | ++ | 0 | 0 | Baixo |
| 2 files allowlist | + | ++ (install) | 0 | + | + | + | + | 0 | Baixo |
| 3 CI completo | + | 0 | 0 | ++ | + | + | + | 0 | Baixo |
| 4 RTK governado | + | 0 | + | + | 0 | + | ++ | 0 | Baixo |
| 5 Supabase read-only / meta-ads | 0 | 0 | 0 | 0 | 0 | 0 | ++ | 0 | Baixo |
| 6 Pins das 3 CLIs | 0 | 0 | 0 | + | 0 | 0 | ++ | 0 | Baixo |
| 7 Quick Update comunicado | 0 | 0 | 0 | + | 0 | ++ | 0 | 0 | Baixo |
| 8 Trace opt-in + warnings | ++ | 0 | 0 (off) | ++ | + | ++ | + | − leve | Baixo-Médio |
| 9 Schema do registry | ++ | 0 | 0 | ++ | ++ | + | + | − leve | Baixo |
| 10 Governança + release-please | + | 0 | 0 | ++ | ++ | ++ | + | 0 | Baixo-Médio |
| 11 MCPs com instrução de uso | + | 0 | + | + | + | + | + | 0 | Baixo |
| 12 Hierarquia/higiene de memória | + | 0 | + | + | + | + | 0 | 0 | Baixo |
| 13 include + _shared | ++ | 0 | + | ++ | ++ | + | 0 | − leve | Médio |
| 14 Protocolo de handoff | ++ | + | ++ | + | ++ | + | 0 | − leve | Médio |
| 15 Update de pins .mcp.json | + | 0 | 0 | + | + | + | ++ | − médio | Médio |
| 16 registry-resolve + tools/lib | ++ | 0 | 0 | ++ | + | + | 0 | 0 (reduz) | Médio |
| 17 min_version + verify + paths | + | + | 0 | + | + | + | + | − leve | Médio |
| 18 Evals no CI + smoke install | + | 0 | 0 | ++ | + | + | + | − leve | Médio |
| 19 Dependabot + retry | 0 | + | 0 | + | + | + | ++ | − leve | Baixo |
| 20 Falhas parciais estruturadas | + | 0 | 0 | + | + | ++ | 0 | − leve | Baixo-Médio |
| 21 Módulos externos honestos | + | 0 | 0 | + | 0 | + | ++ | 0 (a) / − (b) | Baixo (a) / Médio (b) |
| 22 Assets lazy | 0 | ++ (install) | 0 | 0 | + | + | 0 | − médio | Médio |
| 23 sync:check | + | 0 | 0 | ++ | + | + | + | − leve | Baixo |
| 24 Gates de plataforma | 0 | 0 | 0 | + | + | ++ (Win) | 0 | 0 | Baixo |
| 25 Medição real da cadeia | + | 0 | ++ (habilita) | + | + | + | 0 | 0 | Baixo |
| 26 God-object fatiado | ++ | 0 | 0 | ++ | + | + | 0 | − médio | Alto |
| 27 Install atômico | ++ | 0 | 0 | + | + | + | + | − alto | Alto |
| 28 Feature env vars | + | 0 | 0 | + | + | ++ | + | − médio | Alto |
| 29 Progressive disclosure skills | + | + | ++ | + | + | + | 0 | 0 | Médio-Alto (volume) |

---

## 5. Matriz de Trade-offs

Onde há mais de uma solução viável, comparação explícita:

### 5.1 Módulos externos bmad-code-org (A4)

| | (a) Rótulo honesto `upstream-org` | (b) Forks sob wizzcomms |
|---|---|---|
| Vantagens | 5 min de trabalho; zero manutenção nova | Controle total de supply chain; imune a mudanças upstream |
| Desvantagens | Confiança segue delegada a terceiro | Custo permanente de sync com upstream |
| Riscos | Repo upstream some/muda de dono | Forks apodrecem se ninguém sincroniza |
| Arquitetura | Neutra | Neutra |
| Tokens | Zero | Zero |
| Manutenção | Zero | +1 tarefa recorrente |
| **Recomendação** | **(a) agora**; migrar para (b) só se algum módulo virar `defaultSelected: true` ou receber uso real | |

### 5.2 Persistência de env vars (C7)

| | (a) `.claude/settings.local.json` | (b) `.env` na raiz | (c) `~/.wizz-env` |
|---|---|---|---|
| Vantagens | Claude Code lê de fato; gitignored por convenção | Familiar; serve docker/scripts | Nenhuma real |
| Desvantagens | Específico do Claude Code | Claude Code NÃO lê; exige direnv/source | Nada lê; secret órfão |
| Riscos | Baixo | Falsa sensação de configurado | Falsa sensação + secret esquecido em disco |
| Segurança | Boa (escopo projeto) | Média (depende de gitignore) | Ruim |
| **Recomendação** | **(a)** como alvo primário; (b) só como conveniência declarada "não resolvido"; (c) descartar | | |

### 5.3 Portabilidade Windows (M20)

| | (a) Gate `platform:` nas entradas POSIX | (b) Checks reescritos em Node |
|---|---|---|
| Vantagens | Imediato, honesto, 1 linha por entrada | Portabilidade real |
| Desvantagens | Windows nativo fica sem essas CLIs | Reescrever e testar N checks |
| Riscos | Nenhum | Regressão em plataformas que funcionam |
| Manutenção | Zero | Média |
| **Recomendação** | **(a) agora**, (b) quando houver demanda Windows real; declarar suporte oficial macOS/Linux/WSL | |

### 5.4 Fonte única da regra de dispatch (A1)

| | (a) Geração no build a partir de 1 fonte | (b) Teste de CI que compara as 4 cópias |
|---|---|---|
| Vantagens | Impossível driftar | Não muda runtime nem build; barato |
| Desvantagens | Pipeline de build novo para markdown/toml | Drift ainda possível entre commits locais |
| Riscos | Build quebra publicação | Teste frágil se formato mudar |
| Complexidade | Média | Baixa |
| **Recomendação** | **(b) agora** (pega 100% dos merges); reavaliar (a) se o número de cópias crescer | |

### 5.5 Observabilidade: profundidade do investimento

| | (a) Nada (status quo) | (b) Trace opt-in JSONL + warnings | (c) Telemetria contínua com métricas |
|---|---|---|---|
| Vantagens | Zero custo | Debug + dados p/ evals; zero custo desligado | Visão completa de uso |
| Desvantagens | Falhas silenciosas continuam | Só cobre quem liga a flag | Infra nova; privacidade; contradiz filosofia local/stateless |
| Tokens | 0 | ~0 (escrita em disco, não em contexto) | Custo de agregação |
| **Recomendação** | | **(b)**; (c) não condiz com um framework local-first | |

### 5.6 Versionamento de componentes

| | (a) Versão só no pacote (status quo) | (b) Versão por skill/agente/prompt |
|---|---|---|
| Vantagens | Simples; manifest já grava wizzVersion | Updates parciais; changelog por componente |
| Desvantagens | Granularidade grossa | Burocracia em todo PR; ninguém consome hoje |
| **Recomendação** | **(a)** enquanto tudo viaja junto no npm; padronizar `metadata.version` só em skill nova (custo zero) como preparo | |

---

## 6. Checklist Final

| Critério | Veredicto | Justificativa |
|---|---|---|
| Arquitetura consistente | **Atende parcialmente** | Desenho macro correto e estável (camadas, registry-driven); inconsistências reais entre desenho e execução (pins não verificados, regras em N cópias, repo↔global driftado) |
| Responsabilidades bem definidas | **Atende parcialmente** | Diretor/Gerente/Agente bem separados; god-object no installer (1789 linhas, 8+ responsabilidades) e critérios de dispatch ambíguos (M1) |
| Baixo acoplamento | **Atende parcialmente** | Registry desacopla bem skills/MCPs/CLIs; contrato UI↔Installer implícito; skills-lib com referências cruzadas a MCPs fantasma |
| Alta coesão | **Atende parcialmente** | cli-config/mcp-config exemplares; ui.js e installer.js misturam 5+ preocupações cada |
| Modularidade adequada | **Atende** | Nova skill/MCP/CLI = 1 entrada YAML + diretório, sem tocar código; é o ponto forte estrutural |
| Escalabilidade | **Atende parcialmente** | Eixo skill/MCP/CLI escala bem; eixos agente e mecanismo multi-agente escalam por cópia manual (A11/A12) |
| Robustez | **Atende parcialmente** | Fail-open consistente, timeouts presentes, caches ok; sem retry em rede, sem install atômico, degradação silenciosa como default |
| Clareza das instruções | **Atende parcialmente** | Agentes e skills bem escritos; 5 variantes drifted da mesma regra, tabela flat quebrada, convenção de idioma não documentada |
| Comunicação eficiente entre componentes | **Atende parcialmente** | Vertical e horizontal saudáveis pós-dieta; lateral (subagentes cegos) e temporal (memória contraditória) doentes |
| Economia de tokens | **Atende** | Tema tratado com seriedade contínua (dietas sucessivas, rtk, hooks de ~50-70 tokens, progressive disclosure parcial); resta a cauda (14k/pedido roteado, 19 skills monolíticas) |
| Preservação do conhecimento | **Atende** | Nenhuma dieta removeu conteúdo; skills são catálogos legítimos; princípio respeitado em todas as recomendações das 4 partes |
| Segurança | **Atende parcialmente** | SECURITY.md honesto, placeholders, maioria pinada; RTK não verificado, 3 CLIs sem pin, Supabase sem read-only, tokens de blast radius alto |
| Manutenibilidade | **Atende parcialmente** | Registry-driven ajuda; 21 cópias de regra, 3 cópias de resolução, 3 parsers CSV, allowlist que apodrece |
| Testabilidade | **Atende parcialmente** | Excelente onde há injeção (mcp/cli-config); 75% dos módulos do installer sem teste direto; prompts interativos sem teste |
| Observabilidade | **Não atende** | Zero trace de decisão, zero logging estruturado, falhas engolidas em silêncio; é a lacuna mais consistente das 4 partes |
| Governança | **Não atende** | CONTRIBUTING de outro projeto, CHANGELOG parado, sem processo de componente novo, sem changelog automático; SECURITY.md e removals.txt são as exceções boas |
| Extensibilidade | **Atende** | Padrão registry + descoberta dinâmica de commands + setup blocks; exceções pontuais (allowlist hardcoded) já mapeadas |
| Compatibilidade multiplataforma | **Atende parcialmente** | macOS/Linux/WSL sólidos (wsl-node-check exemplar); Windows nativo quebrado para 4 CLIs e não declarado como fora de escopo |
| Boa experiência do desenvolvedor (DX) | **Atende parcialmente** | Installer cuidadoso (backup, detect-first, no-op seguro); Quick Update silencioso, falhas parciais com exit 0, secret de MCP sem assistência de configuração |

---

## 7. Relatório Final

### 7.1 Resumo executivo

O Wizz Method é um framework multiagente maduro no desenho e adolescente na verificação. As decisões arquiteturais grandes estão certas: triagem barata na frente, orquestração sob demanda, registry como fonte única, fail-open, opt-in, dieta de tokens contínua, conhecimento preservado integralmente. O padrão de falha que atravessa as 4 partes da auditoria é único e nomeável: **garantias declaradas em prosa ou config que nenhum mecanismo verifica em runtime ou CI**. Disso derivam os críticos (tabela de roteamento quebrada em produção, RTK 13 versões atrás do pin, pacote npm 5x maior que o necessário, Quick Update silencioso, design de env vars com alvo de persistência que o runtime não lê) e a lacuna estrutural número 1 (observabilidade zero). A boa notícia: quase todas as correções são pequenas, aditivas e de baixo risco, porque o desenho subjacente está certo. A prescrição em uma frase: transformar cada garantia de prosa em verificação barata (teste, schema, hash, warning, trace) sem mudar a filosofia.

### 7.2 Avaliação geral da arquitetura

Camadas corretas, hierarquia Diretor→Gerente→Agente conceitualmente sólida, registry-driven como espinha dorsal acertada. Nota global 7/10: perde pontos por execução da consistência (drift repo↔global, cópias manuais) e ausência de observabilidade, não pelo desenho.

### 7.3 Pontos fortes

1. Registry único e consistente (67/67 skills, zero órfãs/fantasmas internas) alimentando roteamento e instalação.
2. Economia de tokens como valor de engenharia contínuo (hooks de 50-70 tokens, dietas documentadas, rtk com 72% de economia real no projeto).
3. Fail-open disciplinado em toda a stack; nenhuma falha de otimização quebra o fluxo do usuário.
4. Installer conservador: merge aditivo, detect-first, backup de arquivos custom, validação de paths antes de copiar.
5. Pipeline de MCP com setup block (detect→install→verify→resolve) exemplar no scrapling.
6. Preservação de conhecimento levada a sério: catálogos grandes são cobertura legítima, confirmado por teste de hipótese.
7. Enforcement técnico onde importa (plugin playwright desabilitado por settings, não por prosa).
8. SECURITY.md honesto sobre supply chain; removals.txt como mecanismo real de descontinuação.
9. Código de portabilidade WSL de referência (wsl-node-check.js).
10. Testes profundos onde existem (test-installation-components com 3680 linhas, 13 IDEs).

### 7.4 Pontos fracos

1. Observabilidade inexistente; degradação silenciosa é o modo default.
2. Regras replicadas por cópia manual (21 cópias da regra de comunicação, 4 da regra de dispatch, 3 da resolução por área, 3 parsers CSV).
3. Sincronização repo↔global manual e esquecível, já divergida em produção.
4. O componente de maior privilégio (RTK) é o menos governado.
5. God-objects no installer contra as próprias regras do projeto.
6. Governança documental de outro projeto (BMAD) e changelog abandonado.
7. Subagentes trabalham cegos ao contexto da cadeia.
8. Memória com contradições ativas entre camadas.

### 7.5 Problemas críticos

C1 tabela flat quebrada (2 versões, 2 erros diferentes) · C2 pacote npm com 9MB de site vazado · C3 CI rodando subconjunto dos testes · C4 RTK com drift de versão indetectável + bug multi-linha + fora do sync · C5 Supabase sem read-only e meta-ads comunitário com token de gasto · C6 Quick Update silencioso · C7 design de env vars persistindo onde o runtime não lê.

### 7.6 Problemas moderados

A1-A17 das partes 1-3, destacando: dispatch em 4 cópias (A1), cérebro pago 2x na cadeia (A2), zero trace (A3), módulos de terceiro rotulados wizz-org (A4), 27MB de MP3 no pacote (A5), evals que nunca rodam (A6), governança (A7), 3 CLIs sem pin + gates fantasma (A8), MCPs órfãos de instrução (A9), memória contraditória (A10), 21 cópias de regra por falta de include (A11), subagentes cegos (A12), pins congelados pelo merge aditivo (A13), install não-atômico (A14), god-object (A15), resolução triplicada (A16), 75% do installer sem teste (A17).

### 7.7 Problemas menores

M1-M28 + baixos: ambiguidade dos 4 fatores, prevenção de loop só instrucional, hierarquia de memória não declarada, idioma sem convenção, camada tripla de review sem mapa, monólitos, gate órfão, drift adicional, SPOF silencioso do registry, colisão de MCP, paths de pip/brew, assimetria MCP/CLI, ferramentas triplicadas, context7 em dobro, imposto de sessão, boilerplate do graphify, POSIX-only, check do claude-video, .mcp.json órfão no uninstall, catches vazios, exit 0 com falhas, reprocesso do prepareMcps, detect sem versão, process.exit espalhado.

### 7.8 Redundâncias encontradas

Instrucionais: regra de comunicação (21), ECONOMIA (5 variantes), ENCERRAMENTO (4 formulações), RTK (~20 lugares, ~5.3KB), context7 (servidor + regra duplicados). De código: resolução por área (3), walk+frontmatter (3), CSV (3), detecção de binário (2), padrão toWrite/toRecommend (2). De custo: cérebro 2x por cadeia, skills repagas inteiras por subagente. Causa raiz comum: compartilhamento por cópia em vez de por referência (sem include no resolver, sem tools/lib).

### 7.9 Oportunidades de economia de tokens

1. Handoff com cérebro 1x: ~2.6k/pedido roteado (A2). 2. Progressive disclosure nas 19 skills monolíticas + huashu + wizz-social (M9): variável, alto por ativação. 3. Disclosure no spawn de subagentes (A12): elimina skill inteira repaga por subagente. 4. context7 único + deletar rules/context7.md: ~1.3k/sessão (M16). 5. Mensagem do UserPromptSubmit encurtada após 1º turno (M18): ~200B/turno. 6. Consolidação por include (A11): economia de manutenção, não de request. Total estimável nos itens 1+4: ~4k tokens por pedido roteado típico, sem perda de capacidade.

### 7.10 Oportunidades de melhoria arquitetural

As 5 refatorações dirigidas da seção 2.2 (registry-resolve, tools/lib, extração do god-object, include no resolver, protocolo de handoff compartilhado) + schema do registry + canal de update de pins (A13) + install atômico (A14).

### 7.11 Oportunidades de simplificação sem perda de capacidades

Exclusão pura: context7 duplicado + rules/context7.md (única da auditoria). Simplificação por referência: todas as redundâncias da seção 7.8. Simplificação de superfície: `files` allowlist (pacote 55MB → ~19MB; com assets lazy → ~5MB), src/squads fora do pacote (2.2MB arquivado). Simplificação de decisão: dispatch em 2 cláusulas (M1).

### 7.12 Riscos futuros

1. Supply chain do RTK (RT1: tag móvel + curl|sh + privilégio máximo). 2. Crescimento de agentes multiplica cópias manuais até o drift virar bug de comportamento (A11). 3. Cada mecanismo multi-agente novo recria o gap de handoff (A12). 4. Pins congelados viram CVEs permanentes em projetos instalados (A13). 5. Memória contraditória corrói confiança nas camadas de memória (A10). 6. Colisões silenciosas conforme o catálogo cresce (M12). 7. Segundo módulo customizável sem guarda de config (parte 2, I). 8. Windows nativo gerando issues de "eternamente não instalado" se a base de usuários crescer (M20).

### 7.13 Lacunas identificadas

Seção 1 completa. Ausentes: observabilidade, logging estruturado, auditoria do maestro, telemetria, retry, circuit breaker (decisão: não implementar), versionamento de agentes/prompts, Dependabot, controle de custos por rota de modelo, monitoramento de tokens da cadeia. Parciais: validação de entrada/saída, versionamento de skills, compatibilidade, config, cache, contexto, governança, segurança.

### 7.14 Melhorias recomendadas

Itens 1-25 da priorização (Alta + Média), com destaque para o pacote "verificação barata de garantia declarada": CI completo, schema do registry, sync:check, min_version, checksum do rtk, teste das 4 cópias de dispatch, trace opt-in.

### 7.15 Melhorias opcionais

Itens 26-35 (Baixa): god-object, install atômico, feature env vars, progressive disclosure em massa, dedup graphify, cross-refs de review, metadata.version, validação de saída, smoke em container, baixos das partes 1-3.

### 7.16 Sugestões para evolução futura

1. Distribuição desacoplada de skills (marketplace interno) quando houver 2+ consumidores do registry; aí sim versionamento por componente. 2. Evals LLM como gate de release (não só CI heurístico). 3. Dataset de roteamento alimentado pelo trace real (fecha o ciclo A3→A6). 4. Windows nativo se houver demanda. 5. Telemetria opt-in agregada se o framework ganhar usuários externos. 6. Providers de secret manager (Vault/Doppler/1Password) na cadeia de env vars já projetada (parte 3, E3).

### 7.17 Recomendação sobre integração do MCP do n8n

**Não integrar** (análise completa na parte 2, seção K). Nem obrigatório nem opcional default: as automações reais do framework são determinísticas e git-driven (habitat de npm scripts + Actions), o MCP pagaria dezenas de tool definitions por sessão para uso esporádico, ampliaria a superfície de secrets na direção errada e introduziria o primeiro componente com uptime próprio numa stack local/stateless. Caminho existente para projeto que já usa n8n: find-skills → .mcp.json local do projeto, com pin e escopo mínimo. Gatilho de reavaliação: 2+ projetos Wizz reais rodando n8n em produção.

### 7.18 Avaliação do installer e da experiência de instalação

Nota 7/10. Força: conservadorismo correto (merge aditivo, detect-first, backups, no-op seguro, validação de paths antes de copiar, --yes/CI-safe). Fraquezas: custo das garantias nunca comunicado (Quick Update silencioso C6, exit 0 com falhas parciais M24, .mcp.json órfão M22), god-object (A15), resolução triplicada (A16), 75% sem teste direto (A17), sem atomicidade (A14). Plano de correção na parte 3, seção F (itens 1-4 cabem num único PR de hardening).

### 7.19 Avaliação da estratégia de gerenciamento de variáveis de ambiente

Nota 4/10 (é a área menos madura). O que existe: placeholders `${VAR}` no .mcp.json (correto e verificado: o Claude Code expande do process.env). O que falta: qualquer assistência de configuração; o usuário descobre a var faltante no primeiro erro do MCP. A feature proposta (Smart Env Var Detection) tem a ideia certa e o alvo de persistência errado (C7): `.env` não é lido pelo Claude Code e `~/.wizz-env` não é lido por nada. Design corrigido pronto na parte 3 (seções E1-E7): alvo `settings.local.json`, extração pura + resolução com providers + persistência separadas, masking com o `password()` já existente e nunca usado, skip automático de `${VAR:-default}`, zero prompt sem TTY.

### 7.20 Avaliação da cobertura de testes

Nota 5.5/10. Excelente em profundidade onde existe (installation-components 3680 linhas, mcp-config 448 com merge/placeholder/setup/JSON corrompido, cli-config com gates de plataforma, quick-update-gate). Ruim em largura: 31/41 módulos do installer sem teste direto, incluindo o orquestrador do fluxo e o entry; evals existem e nunca rodam; hook central testado localmente mas fora do CI até a correção do C3; zero teste de fumaça de ponta a ponta com shell real. As 3 adições de melhor retorno: smoke de `install --yes` em dir temporário, fixture de skills-lib, eval:routing heurístico no CI.

### 7.21 Avaliação de segurança

Nota 6/10. Postura declarada boa (SECURITY.md, placeholders, pins com data, opt-in, plugin playwright desabilitado). Execução com furos conhecidos e corrigíveis em horas: RTK não verificado com privilégio de reescrita de todo shell (RT1), 3 CLIs em HEAD de terceiro (RT2), tokens de blast radius alto sem escopo mínimo (RT3: Supabase full-account, Meta em pacote comunitário), memória envenenável sem validação (RT4). Nenhum secret real em repo ou histórico (verificado). Corrigidos os itens 4-6 da prioridade Alta, a nota sobe para ~8.

### 7.22 Avaliação de DX

Nota 6.5/10. Para o usuário final: instalação guiada boa, áreas claras, resumo final decente; perde em silêncios (C6, M24) e em secret sem assistência (7.19). Para o contribuidor: registry-driven facilita adicionar componente, mas o processo não está escrito em lugar nenhum (engenharia reversa de installer + registry), CONTRIBUTING fala de outro projeto e não há changelog confiável. Para o mantenedor: 21 pontos de edição para 1 regra é o maior atrito. As correções 7, 10, 13 e 20 da priorização atacam exatamente esses três públicos.

### 7.23 Avaliação da escalabilidade

Nota 6.5/10. Escala bem: skills, MCPs, CLIs, áreas, IDEs (tudo registry/config-driven). Escala mal: agentes (cópia manual de 4 blocos por agente novo) e mecanismos multi-agente (cada um recria handoff do zero). Sem gargalo de performance relevante (installer é execução única; runtime é leitura de arquivos). O teto real de escala é organizacional: sem governança e sem observabilidade, crescer o catálogo aumenta a taxa de drift mais rápido que a capacidade de detectá-lo. Include + handoff compartilhado + trace resolvem a equação.

### 7.24 Plano de evolução recomendado

Seção 9 (Plano de Ação em 3 fases).

---

## 8. Sistema de Pontuação

| Critério | Nota | Fatores |
|---|---|---|
| Arquitetura | 7.5 | Camadas e hierarquia corretas, registry-driven acertado; desconta drift desenho↔execução e ausência de contratos formais |
| Organização | 7.0 | Estrutura de diretórios funcional e consistente; desconta convenções não documentadas e god-objects |
| Clareza | 6.5 | Agentes/skills bem escritos; desconta 5 variantes da mesma regra, tabela quebrada, docs de contribuição de outro projeto |
| Modularidade | 7.5 | Componente novo = entrada YAML; setup blocks; desconta exceções (allowlist hardcoded, sem verify de CLI) |
| Consistência | 5.5 | O tema mais fraco depois de observabilidade: repo↔global divergido, 21 cópias, 3 resoluções, pins declarados ≠ instalados |
| Robustez | 6.5 | Fail-open exemplar, timeouts, caches; desconta sem retry, sem atomicidade, falhas silenciosas |
| Escalabilidade | 6.5 | Eixo registry escala; eixo agente/multi-agente escala por cópia; teto organizacional sem observabilidade |
| Eficiência operacional | 7.0 | Instalação rápida, hooks de microssegundos, no-op seguro; desconta 55MB de pacote e reprocessos idempotentes |
| Economia de tokens | 7.5 | Valor de engenharia contínuo com resultados medidos; desconta a cauda (14k/pedido, monólitos, cérebro 2x) |
| Segurança | 6.0 | Postura declarada boa, zero secret vazado; desconta RTK/CLIs/tokens (RT1-RT3), todos corrigíveis em horas |
| Manutenibilidade | 6.0 | Registry ajuda muito; desconta 21 pontos de edição por regra e triplicações de código |
| Testabilidade | 5.5 | Profundo onde há injeção; 75% do installer descoberto, evals nunca rodam, zero e2e real |
| Observabilidade | 2.5 | Praticamente inexistente: sem trace, sem log estruturado, falhas engolidas; único crédito: rtk gain e avisos pontuais do installer |
| Governança | 4.0 | SECURITY.md e removals.txt bons; CONTRIBUTING alheio, CHANGELOG parado, sem processo de componente, sem automação de release |
| Orquestração do Maestro | 7.0 | Hierarquia e dispatch conceitualmente certos; desconta critérios ambíguos (M1), zero auditoria de decisão, loop só instrucional |
| Qualidade dos Agentes | 7.5 | 15 agentes consistentes entre si, registry-aware, com boas instruções; desconta blocos copiados e wizz-social outlier de custo |
| Qualidade das Skills | 8.0 | Catálogo grande, especializado e genuíno (hipótese de redundância testada e rejeitada); desconta monólitos sem disclosure e huashu sem description acessível |
| Integração dos MCPs | 6.5 | Pins, placeholders e setup block exemplar; desconta 3/6 órfãos de instrução, fantasmas citados, supabase sem read-only |
| Sistema de Memória | 6.0 | Arquitetura de leitura correta (índices baratos, conteúdo sob demanda); desconta higiene de escrita (contradições ativas, regras autodeclaradas descumpridas) |
| Estratégia de RTK | 5.5 | Mecanismo bom (fail-open, recovery 99.9%, 72% de economia real); desconta governança mínima do maior privilégio da stack (drift, bug multi-linha, fora do sync) |
| Installer | 7.0 | Conservadorismo correto e UX decente; desconta silêncios, god-object, cobertura de teste |
| Experiência do Desenvolvedor (DX) | 6.5 | Boa para usuário final; média para contribuidor (sem processo escrito); atrito real para mantenedor (edição em N lugares) |
| Gerenciamento de variáveis de ambiente | 4.0 | Só placeholders; nenhuma assistência; feature proposta com premissa de persistência quebrada (design corrigido disponível) |
| Preservação do conhecimento | 9.0 | Melhor critério do framework: nenhuma dieta removeu conteúdo, catálogos íntegros, princípio respeitado em 4 partes de auditoria |

**Média simples: 6.4/10.** Leitura: framework acima da média com dois bolsões críticos (observabilidade 2.5, governança/env vars 4.0) que puxam para baixo um núcleo sólido (arquitetura, skills, preservação 7.5-9.0). Os bolsões são os mais baratos de subir.

---

## 9. Plano de Ação

### Fase 1: Ganhos rápidos (1-2 semanas de trabalho intermitente)

| Tarefa | Objetivo | Justificativa | Dependências | Prioridade | Esforço | Impacto |
|---|---|---|---|---|---|---|
| 1.1 Corrigir tabela flat + sync:global | Parar o bug ativo de roteamento | C1 opera em produção pessoal agora | Nenhuma | Alta | Baixo | Roteamento correto fora de projeto Wizz |
| 1.2 `files` allowlist no package.json | Pacote npm de 55MB → ~19MB | C2: build/ vaza, conteúdo não reprodutível | Nenhuma | Alta | Baixo | Install mais rápido, pacote determinístico |
| 1.3 CI = `npm test` completo + validates | Todo gate roda em todo PR | C3+A8: hook central e validadores fora do CI | Nenhuma | Alta | Baixo | Fecha a classe de regressão do C1 |
| 1.4 Pacote RTK: binário no pin, check c/ versão, hook em tools/hooks + sync, checksum, timeout, teste de fumaça | Governar o maior privilégio | C4+RT1 | Nenhuma | Alta | Baixo-Médio | Maior redução de risco da auditoria |
| 1.5 Supabase read-only + nota meta-ads + pins das 3 CLIs | Reduzir blast radius de supply chain e secrets | C5+A8+RT2/RT3 | Nenhuma | Alta | Baixo | Segurança 6→~7.5 |
| 1.6 Quick Update comunicado (hint+log+resumo) | Eliminar o silêncio do gate | C6, confusão real registrada | Nenhuma | Alta | Baixo | DX imediata |
| 1.7 Hardening do installer (catches c/ warn, brew/pip paths, filtro do prepareMcps, warns→results) | Falhas param de ser invisíveis | M23-M26 | Nenhuma | Alta | Baixo | Robustez sem mudança de comportamento |
| 1.8 Governança mínima: CONTRIBUTING rebrand, CHANGELOG em dia, governance.md, checklist de PR, trademark do README | Contribuição externa viável | A7 | Nenhuma | Alta | Baixo-Médio | Governança 4→6 |
| 1.9 Trace de roteamento opt-in + warning em fallbacks | Primeira observabilidade | A3 + lacuna nº1 | Nenhuma | Alta | Baixo-Médio | Debug + dados para evals |
| 1.10 Schema/validação do registry no npm test | Proteger o SPOF | M11 + lacuna | Nenhuma | Alta | Baixo | Falha de YAML grita em vez de degradar |
| 1.11 Instrução de MCP nos 3 toml órfãos + remover playwright da flat + SCAN_ROOTS | Capacidade instalada vira usada | A9 | 1.1 | Alta | Baixo | MCPs deixam de ser peso morto |
| 1.12 Memória: hierarquia declarada, linha vault:, projetos/wizz-method.md, convenção de datas, compactação no /salvar | Sanar o eixo temporal | M4+A10+RT4 | Nenhuma | Alta | Baixo | Memória confiável entre sessões |
| 1.13 Dependabot npm + context7 único | Higiene barata | lacuna+M16 | Nenhuma | Média | Baixo | CVEs avisados; ~1.3k tokens/sessão |

### Fase 2: Consolidação (3-6 semanas)

| Tarefa | Objetivo | Justificativa | Dependências | Prioridade | Esforço | Impacto |
|---|---|---|---|---|---|---|
| 2.1 `include` no resolver + `_shared/communication-rules.md` + colapsar 15 cópias | Regra em 1 lugar | A11: causa raiz do drift de prosa | test:hooks verde (1.3) | Alta | Médio | 21 pontos de edição → 1 |
| 2.2 Protocolo de handoff compartilhado (origem, cérebro 1x, disclosure no spawn, model_hint) | Sanar o eixo lateral + custo | A2+A12+M2 + controle de custos | 2.1 (mesmo mecanismo de shared) | Alta | Médio | ~2.6k tokens/pedido + subagentes com contexto |
| 2.3 Dispatch: 2 cláusulas + fonte única + teste de CI comparando as 4 cópias + exemplos calibrados | Dispatch determinístico | A1+M1 | 1.3 | Alta | Médio | Roteamento reprodutível |
| 2.4 registry-resolve.js + tools/lib/ + CSV único + allowlist derivada | Deduplicar código | A16+M15 | 1.3 (CI pegando regressão) | Média | Médio | 3 cópias → 1; validador para de apodrecer |
| 2.5 min_version + verify: de CLIs + marcador de update de pins no .mcp.json | Canal de atualização de segurança | M27+M14+A13 | 1.5 | Alta | Médio | Pins deixam de congelar |
| 2.6 eval:routing no CI + --llm periódico + smoke de install --yes | Qualidade com gate | A6+A17 | 1.3, 1.9 (trace alimenta dataset) | Média | Médio | Regressão de roteamento pega de graça |
| 2.7 sync:check de hashes repo↔global | Drift detectado, não lembrado | M10 | 1.4 (hook do rtk incluído) | Média | Baixo | Fim do sync esquecível |
| 2.8 Assets lazy (MP3/fontes) | Pacote ~19MB → ~5MB | A5 | 1.2 | Média | Médio | Install leve p/ área designer |
| 2.9 Gates de plataforma POSIX + suporte declarado macOS/Linux/WSL | Honestidade multiplataforma | M20 | Nenhuma | Média | Baixo | Fim da reoferta infinita no Windows |
| 2.10 Decisão módulos externos (rótulo vs forks) | Supply chain honesto | A4 | Decisão do usuário | Média | Baixo (a) | Narrativa e risco alinhados |
| 2.11 Medição real da cadeia de orquestração (2-3 execuções instrumentadas) | Dados para a próxima dieta | Lacuna de monitoramento | 1.9 | Média | Baixo | Substitui estimativa por medida |
| 2.12 Retry nos fetches de rede do installer | Robustez em rede ruim | Lacuna | Nenhuma | Média | Baixo | Menos falha transitória |

### Fase 3: Evolução (contínuo / sob demanda)

| Tarefa | Objetivo | Justificativa | Dependências | Prioridade | Esforço | Impacto |
|---|---|---|---|---|---|---|
| 3.1 Extração do god-object (4 módulos, teste junto) | Installer sustentável | A15+A17 | 2.4 | Baixa | Alto | Manutenibilidade do caminho crítico |
| 3.2 Install atômico (fresh primeiro, update depois) | Estado nunca inconsistente | A14 | 3.1 | Baixa | Alto | Elimina o cenário de manifest órfão |
| 3.3 Feature env vars (design corrigido: settings.local.json, providers, masking) | Onboarding de MCP sem beco | C7+E | 2.5 | Baixa | Alto | Env vars 4→7+ |
| 3.4 Progressive disclosure nas 19 skills + huashu index + wizz-social knowledge | Custo por ativação | M9 | Nenhuma | Baixa | Médio-Alto (volume) | Tokens por skill ativada |
| 3.5 Dedup graphify + cross-refs da camada de review + baixos remanescentes | Higiene contínua | M19+M6+D | Nenhuma | Baixa | Baixo | Incremental |
| 3.6 Smoke e2e em container Linux no CI | Cobrir o gap dos mocks | Parte 2 J | 2.6 | Baixa | Médio | Confiança de instalação real |
| 3.7 metadata.version padronizado via checklist + preparo p/ distribuição desacoplada | Futuro marketplace | Lacuna de versionamento | 1.8 | Baixa | Baixo | Preparatório |
| 3.8 Reavaliar n8n / telemetria opt-in / Windows nativo / secret providers | Gatilhos documentados | Seções 7.16-7.17 | Gatilhos externos | Baixa | n/a | Sob demanda |

---

## Critérios obrigatórios: verificação de conformidade desta auditoria

- Preservação de funcionalidades: nenhuma recomendação das 4 partes remove capacidade; padrões usados: lazy loading, consolidação por referência, verificação aditiva, comunicação melhor.
- Conhecimento especializado: catálogos confirmados como legítimos e mantidos integrais.
- Qualidade vs tokens: nenhuma recomendação troca qualidade por token; as economias vêm de duplicação e momento de leitura.
- Decisões atuais defendidas quando corretas: fail-open (manter), CLIs opt-in (manter), .mcp.json fora do manifest (manter com doc), 6 MCPs/9 áreas (manter), circuit breaker (não implementar), n8n (não integrar), registry único (manter com schema), topologia de src/ (manter com README).

*Fim da auditoria em 4 partes. Baseline para a próxima auditoria 360° (recomendação: outubro/2026). Verificações mecânicas desta parte executadas em modelos de menor custo; síntese e julgamento na sessão principal. Nenhum arquivo do repo foi modificado além deste relatório em `_audit/`.*
