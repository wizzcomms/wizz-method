# Changelog

Todas as mudanças relevantes do Wizz Method são registradas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.4.2] - 2026-07-07

### Adicionado

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
