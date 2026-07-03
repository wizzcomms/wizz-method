# Changelog

Todas as mudanças relevantes do Wizz Method são registradas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.2.2]

### Corrigido

- `wizz-router` e toda a `skills-lib` (copy, SEO, growth, ads) mais MCP/CLI por área não instalavam em installs via `npx`. Os gates dependiam do módulo `wizz`, que não é oferecido no seletor de módulos. Migrados para o módulo `bmm` (Wizz Method), que todo install marca. Agora o install traz o router e as 62 skills da biblioteca.

## [1.0.0]

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
