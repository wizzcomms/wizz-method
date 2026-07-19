# Changelog

Todas as mudanças relevantes do Wizz Method são registradas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.7.0] - 2026-07-19

### Adicionado

- Bklit UI (`github.com/bklit/bklit-ui`, MIT) como fonte de componentes da skill `premium-landing-ui-researcher`: charts e utilitários React/TypeScript/Tailwind via registry shadcn (`npx shadcn@latest add @bklit/<chart>`, sem clone), ~15 tipos de gráfico; fonte prioritária para dashboards SaaS, data viz e seções de métricas, complementando o Recharts do stack default.
- Seção "Animation Engine Libraries" (libs npm, sem clone) nas fontes da `premium-landing-ui-researcher`:
  - GSAP (`npm i gsap @gsap/react`): 100% gratuito desde a v3.13 (Webflow), todos os plugins incluídos (ScrollTrigger, ScrollSmoother, SplitText, MorphSVG, DrawSVG); indicado para scroll storytelling, pinning, timelines cinematográficas e text reveal avançado.
  - anime.js v4 (`npm i animejs`, MIT, ~10kb core): stagger, springs, SVG motion, scroll observer; indicado para microinterações imperativas leves.
  - Regra de escolha documentada: Framer Motion/Motion para UI React declarativa → anime.js para efeitos leves imperativos → GSAP para scroll orquestrado e timelines longas.
- Mapa de decisão do Source-First Protocol ganhou 3 linhas novas (charts → Bklit UI; scroll/timeline → GSAP; microinteração/SVG → anime.js), e os três nomes entraram no description do SKILL.md (triggering), no `source-links.md` e no stack default.

### Alterado

- `motion-3d-director`: GSAP deixou de ser "apenas se necessário" no caminho 3D real (agora recomendado quando o scroll orquestra a cena, já que ficou gratuito); caminho Motion 2D premium ganhou stack recomendada explícita (Framer Motion/Motion, GSAP + ScrollTrigger/SplitText, anime.js v4).

## [1.6.0] - 2026-07-11

### Adicionado

- CLI `21st-cli` na área de design do registry (fonte PAGA complementar, gate de aprovação do usuário): busca, inspeção, instalação e publicação de componentes no 21st.dev via terminal (`search`/`get`/`add`/`publish`, registry do time `@wizzdigitalagency`); o install traz também as skills oficiais `21st-cli-use`, `21st-registry` e `21st-design-sync`. Complementa o Magic MCP (geração assistida) como caminho de catálogo/registry e fallback declarado quando o MCP está offline.
- Flag `recommended:` no registry de CLIs: entradas marcadas vêm PRÉ-marcadas no multiselect do installer (label `(recomendado)`), sem instalar nada à revelia — continua opt-in, `--yes`/sem TTY seguem recommend-only. Hoje só o `rtk` é flagado (o wizz-router assume RTK ativo no Passo 0); CLIs de área continuam desmarcadas por padrão.

### Alterado

- Fontes da skill `premium-landing-ui-researcher` atualizadas:
  - v0 removido do fluxo; 21st CLI documentada como caminho de catálogo/registry (mineração em 3 passos: `search` → `get` → `add`), com publicação de volta no registry do time via `21st publish`.
  - Componentry ganhou o caminho de instalação via MCP do shadcn (`pnpm dlx shadcn@latest mcp init` + registry `@componentry` no `components.json`), além do copy-paste.
  - Refero Styles (`styles.refero.design`, gratuito em beta) adicionado: biblioteca de `DESIGN.md` extraídos de sites reais (paleta, tipografia, spacing, motion, componentes) pra colar no contexto do agente; priorizado sobre inspiração visual pura.
  - Animmaster Lib registrada como fonte paga (mesmo gate do 21st.dev); fluxo de pesquisa reordenado com gratuitas primeiro e cache central em `~/.claude/design-sources/`.

## [1.5.2] - 2026-07-08

### Corrigido

- Módulo `wizz` (wizz-maestro + agentes de área) nunca instalava via `npx wizz-method install`: `OfficialModules.listAvailable()` só listava `core` e `bmm`, então o módulo bundled em `src/modules/wizz` (mesmo com `default_selected: true`) não aparecia no picker de módulos nem entrava nos defaults do `--yes`; `findModuleSource()` sabia resolvê-lo, mas nada o selecionava. Agora `listAvailable()` também descobre os módulos bundled em `src/modules/<code>/module.yaml`. Reparo de instalação existente sem TTY: `npx wizz-method install --yes --action update --directory <pasta> --tools claude-code --modules bmm,wizz` (Quick Update não adiciona módulo novo).

## [1.5.1] - 2026-07-08

### Corrigido

- Instalação dos CLIs `hyperframes`, `claude-video` e `distribb` quebrada pelo pin de SHA da 1.5.0: a convenção `npx skills add <url>#<sha>` nunca funcionou (a CLI `skills` trata o fragmento como branch e o `git clone --branch <sha>` falha com "Remote branch not found"; não existe flag `--ref`). O `install:` agora faz clone temporário + `git checkout <sha>` + `skills add <path-local> -g -y --copy` (o `--copy` evita symlink para o diretório temporário apagado), mantendo o pin de supply chain de fato.
- `check:` do `hyperframes` era `npx --yes hyperframes --version`, que baixa o pacote do npm e passa sempre; o installer reportava "já instalado" sem as skills nunca terem sido adicionadas. Agora testa `test -d $HOME/.claude/skills/hyperframes`, e a entrada ganhou `platform: [darwin, linux]` (install virou POSIX, mesma regra das demais clone-and-run).

## [1.5.0] - 2026-07-07

> Consolida as fases 1, 2 e 3 do plano de auditoria de julho/2026. A 1.4.2 nunca foi publicada no npm; este release absorve aquele conteúdo.

### Adicionado

- Fase 3 da auditoria (refatoração do installer e experiência de instalação, tarefas 3.1-3.8):
  - `installer.js` reduzido de 1870 para ~1280 linhas com extração de módulos dedicados (`user-file-preservation`, `env-vars`, `banner`, entre outros); smoke test de MCP real no CI (`test:install-smoke-mcp`, workflow próprio fora do agregado).
  - Install atômico no fresh install: escreve em `_wizz.tmp-<pid>/` e faz swap só depois de gerar os manifests; em falha remove apenas o tmp e o `_wizz/` real nunca chega a existir; `skill-manifest.csv` deixa de gravar o nome do diretório temporário.
  - Env vars de MCP no install (`modules/env-vars.js`): extrai placeholders `${VAR}` dos servers selecionados, resolve por `process.env` → prompt com `password()` (valor nunca ecoado), grava em `.claude/settings.local.json`; skip em `--yes`/sem TTY; resumo por variável no fim do install (`test:env-vars`, 46 asserts).
  - Progressive disclosure em 19 skills (corpo enxuto + referências carregadas sob demanda), índice do `huashu-design` e blueprint lazy no `wizz-social`; dedup do graphify e cross-refs da tríade de review.
  - Medidor de roteamento opt-in no install: pergunta se liga o trace e grava `env.WIZZ_TRACE="1"` em `.claude/settings.local.json`; `npx wizz-method trace-report` agrega os traces; `--yes`/sem TTY nunca liga.
  - `metadata.version` opcional no validador de skills, seção "Gatilhos de reavaliação" em `docs/governance.md`, template de PR atualizado; testes diretos de `selectMcps`/`selectClis` e do parsing de `--mcps`/`--clis`.

- Fase 2 da auditoria (consolidação, tarefas 2.1-2.9 e 2.12):
  - `include = [...]` no `resolve_customization.py` + `_shared/communication-rules.md` como fonte única da regra de comunicação (15 cópias colapsadas em 1); protocolo de handoff compartilhado (`src/core-skills/_shared/handoff-protocol.md`: origem anti-loop, cérebro consultado 1x, decisões da cadeia, seção relevante da skill, `model_hint` opcional) referenciado por router, maestro, agentes, party-mode e swarm.
  - Regra de dispatch reescrita em 2 cláusulas (2+ áreas → maestro, sempre; senão 2+ dos 3 fatores → maestro) nas 4 cópias, com exemplos de borda calibrados e teste de consistência (`test:dispatch-rule`) que falha se as cópias divergirem.
  - `registry-resolve.js` unifica `resolveMcps`/`resolveClis`/`resolveSkillIds`; `tools/lib/` (walk + frontmatter) compartilhado pelos validadores; allowlist do `validate-method-refs` derivada do registry; CSV de leitura unificado em `csv-parse/sync`.
  - `min_version:` com comparação semver no detect de CLIs (fecha a causa raiz do drift do rtk) e bloco `verify:` pós-install fail-open; hash de conteúdo por server MCP no `skill-deps-cache.json` destrava update de pin sem sobrescrever customização do usuário.
  - `eval:routing` (heurístico) no CI + workflow semanal/manual do modo `--llm`; smoke test ponta a ponta do `install --yes` (`test:install-smoke`); checklist de evals no template de PR.
  - `sync:check` compara hashes repo↔`~/.claude` sem escrever (lembrete no fim do `npm test`); lista de sync única em `tools/lib/sync-targets.mjs`.
  - Assets lazy: MP3 do `huashu-design` e fontes do `canvas-design` fora do tarball npm (35.7MB → 5.0MB packed), baixados sob demanda via `npx wizz-method fetch-assets` com verificação sha256 (release `assets-v1`).
  - Retry de 1 tentativa com backoff em erro de rede transitório nos fetches do installer (registry npm, channels, git clone/fetch).
  - `platform: [darwin, linux]` nas CLIs POSIX-only (`claude-video`, `voicebox`, `distribb`, `arcads`); suporte oficial declarado macOS/Linux/WSL.

- `tools/validate-method-refs.js`, novo validador (`npm run validate:method-refs`) que checa referências cruzadas específicas do method (agentes, módulo `wizz`, skills). Corrigidas as referências quebradas encontradas em `README.md`, `docs/`, `src/modules/wizz/` e `src/skills-lib/decision-maker`.
- `tools/skills-catalog.md`: catálogo unificado de 116 skills com localização por plataforma (Claude/OpenCode/Obsidian), 60 duplicadas identificadas; referenciado por `routing-table-flat.md` para verificação de existência.
- Fase 1 do plano de auditoria (`_audit/`): allowlist `files` no `package.json` (pacote npm sem `build/` e squads); CI roda `npm test` completo + `validate:method-refs`; validador de schema do `skills-registry.yaml` (`test:registry-schema`) com falha explícita em YAML inválido; `.github/dependabot.yml` (npm semanal); trace de roteamento opt-in (`WIZZ_TRACE=1`) e warnings de fallback no hook do router; `docs/governance.md`, checklist de PR e rebrand final do `CONTRIBUTING.md`.
- Pacote RTK governado: hook `rtk-rewrite.sh` com fonte de verdade em `tools/hooks/` (fix do bug multi-linha, timeout interno, sidecar `.rtk-hook.sha256` regenerado pelo `sync:global`), `check:` do registry compara versão instalada com o pin, `install:` baixa e verifica SHA256 antes de executar, teste de fumaça `test:rtk-hook`.
- Quick Update comunicado: hint no menu, log durante a execução e linha no resumo final avisando que skills/MCPs/CLIs novos não entram (Modify Install os traz), com teste cobrindo o aviso.

### Segurança

- MCP do Supabase passa a rodar com `--read-only --project-id ${SUPABASE_PROJECT_REF}`; `hyperframes`, `claude-video` e `distribb` pinados por commit SHA; nota de risco datada no `meta-ads` (pacote comunitário, token compartilhado com `arcads`).

### Corrigido

- `.gitignore` ganhou patterns para `.env`, tokens, secrets e certificados (auditoria 360).
- Installer: catches silenciosos na detecção de customizações agora emitem warning; falhas parciais entram nos results e derrubam o exit code quando são erro real; `resolveBinPath` cobre Homebrew (`/opt/homebrew/bin`, `/usr/local/bin`) e `pip install --user` no macOS; `prepareMcps` deixa de reprocessar servers que o merge aditivo vai pular.
- Roteamento: tabela flat do router corrigida e sincronizada com a cópia global; playwright removido da tabela (browser é sempre `agent-browser`); 3 agentes (`wizz-growth`, `wizz-agent-architect`, `wizz-agent-analyst`) ganharam instrução de uso dos seus MCPs; `validate-method-refs` varre todas as skills de `src/skills-lib/`.
- Memória: hierarquia de 3 camadas declarada sem contradição, linha `vault:` no `CEREBRO.md` (mecanismo de descoberta volta a funcionar), convenção de datas `YYYY-MM-DD` e compactação do índice no `/salvar`.

## [1.4.1] - 2026-07-07

### Adicionado

- Dieta de tokens para roteamento e memória do method: `wizz-router-enforce` v2 detecta projeto Wizz (`_wizz/`) e injeta dica curta de delegação direta (maestro/agente) em vez do mandato completo do router (~250 → ~60 tokens/prompt fora de projeto Wizz); `session-rules` (SessionStart) absorve as regras de comunicação uma vez por sessão no lugar do `no-narration-enforce` por prompt; `security-defensive-context` v2 passa a ser genérico por projeto (v1 tinha a stack MeJu hardcoded). Nova fonte de verdade dos hooks em `tools/hooks/`, instalada via `npm run sync:global`.
- Installer agora fatia `skills-registry.yaml` em `_wizz/_config/registry/` (`index.yaml` + `<area>.yaml` + `_shared.yaml`): o maestro lê só o índice leve e a fatia da área, os 9 agentes leem a própria fatia com fallback no monólito. Área designer reorganizada em 3 portas de entrada (`entry: true` + `door:`): direção/construção/motion, sem fundir nenhuma skill.
- `evals/routing`: dataset de 48 prompts rotulados + runner determinístico/LLM para medir a qualidade do roteamento. `test:hooks` cobre `isTrivial` e o contexto por modo, e entrou no `npm test`.

### Segurança

- `npm audit` de 26 para 2 vulnerabilidades (correção do `js-yaml`); pins de versão/SHA para dependências de terceiros do registry (buttercut, voicebox, arcads, MCPs); remoção de caches com path pessoal; correção de metadata herdada do BMAD em `marketplace.json`, `README.md` e `build-docs`.
- Skills de segurança revisadas: `web-security` ganhou exemplo anti-IDOR com Clerk e XSS específico de React; `auth-and-secrets` corrigiu orientação de JWT (algorithm confusion) e ganhou seção de API keys; `desktop-security` corrigiu recomendação de `keytar` (abandonado, agora `safeStorage`) e adicionou hardening de navegação.

### Mudado

- Dieta de tokens em 3 skills-monólito: `wizz-router` 17.3KB → 3.8KB (-78%), `taste-skill` 87KB → 5.5KB (-94%), `premium-landing-ui-researcher` 86KB → 6.2KB (-93%). Conteúdo 100% preservado em `references/`, carregado sob demanda.

## [1.4.0] - 2026-07-05

### Adicionado

- Cobertura de segurança das falhas recorrentes de pentest em `web-security` e `auth-and-secrets`: triagem rankeada por severidade, CORS refletindo Origin (allowlist), vazamento de PII/hash na resposta, enumeração de usuário (mensagem genérica + tempo constante), JWT no header vs URL + revogação no logout, clickjacking (`frame-ancestors`), rate limit por IP **e** conta. Triggers atualizados no registry e no `wizz-router`.
- 5 skills novas na `skills-lib` (área designer + architect): `animate` (craft de motion, Emil Kowalski), `design-motion-principles` (auditor de movimento), `canvas-design` (PNG/PDF editável), `algorithmic-art` (visual generativo), e `ai-product-design` (bundle de 44 padrões de design de agente/IA + arquitetura de prompt + trust/safety, base Owl-Listener/ai-design-skills MIT).

## [1.2.2] - 2026-07-03

### Corrigido

- `wizz-router` e toda a `skills-lib` (copy, SEO, growth, ads) mais MCP/CLI por área não instalavam em installs via `npx`. Os gates dependiam do módulo `wizz`, que não é oferecido no seletor de módulos. Migrados para o módulo `bmm` (Wizz Method), que todo install marca. Agora o install traz o router e as 62 skills da biblioteca.

## [1.0.0] - 2026-06-19

Primeira versão do Wizz Method como projeto independente.

### Adicionado

- Camada Wizz sobre o motor BMad Method: 7 agentes de agência (`wizz-maestro`, `wizz-designer`, `wizz-copy`, `wizz-seo`, `wizz-growth`, `wizz-ads`, `wizz-memoria`).
- Encerramento padrão em todos os agentes (✅ o que fiz, ➡️ próximo passo, 🎯 comando).
- Idioma PT-BR, economia de token (graphify → cerebro → grep) e auto-load do cérebro na ativação.
- Roteamento via `wizz-maestro` para as skills globais da agência.
- `wizz-init` para aplicar a personalização Wizz de forma idempotente.

### Mudado

- Rebrand completo do fork: nome do pacote, CLI (`wizz` / `wizz-method`), documentação, site e identidade visual passam a ser Wizz.
- Domínio dos docs: `method.wizzcomms.com`.

### Origem

Fork independente do [BMad Method](https://github.com/bmad-code-org/BMAD-METHOD), de BMad Code, LLC. O motor permanece o BMAD, creditado em [TRADEMARK.md](TRADEMARK.md). O histórico de versões anterior ao fork está preservado no histórico do Git.
