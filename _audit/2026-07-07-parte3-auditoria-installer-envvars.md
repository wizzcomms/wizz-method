# Auditoria Completa do Framework Wizz Method: Parte 3 de 4

Data: 2026-07-07 · Versão auditada: 1.4.2 (main, `fb1d8e54`) · Método: 4 frentes de análise paralelas (arquitetura do installer, cadeia de resolução skills/MCP/CLI, design da feature Smart Env Var Detection, cobertura de testes) + síntese.

Escopo desta parte: `tools/installer/**` (fluxo de instalação, resolução de skills, resolução de MCPs, geração de arquivos, configuração do ambiente, UX de instalação) e avaliação de design da feature proposta **Smart Environment Variable Detection**. A numeração de achados continua a da parte 2 (que parou em C5/A12/M22).

Princípio mantido: nenhuma recomendação remove capacidade. Tudo é reorganização, extração de módulo, verificação ou comunicação melhor com o usuário.

**Nota de escopo importante:** a feature Smart Env Var Detection **não existe no código**. Não há `promptMissingEnvVars` em lugar nenhum de `tools/` ou `test/`. A filosofia atual do `mcp-config.js` é o oposto declarado: "SECRETS STAY PLACEHOLDERS" (`mcp-config.js:12-13`) — o `.mcp.json` é gravado com `${VAR}` verbatim do registry. Portanto a seção B desta auditoria é uma **auditoria de design pré-implementação**, não de código. E ela encontrou um problema que invalida metade da proposta como está escrita (ver C7).

---

## Sumário executivo

O installer é deliberadamente conservador e isso é a maior força dele: merge aditivo que nunca sobrescreve config do usuário, detect-first que nunca reinstala binário existente, no-op quando o registry falta, backup de arquivos custom antes de update. O problema é o padrão inverso do que a parte 2 achou nos MCPs: aqui **as garantias existem, mas o custo delas nunca foi comunicado nem compensado**. O merge aditivo que protege o usuário também congela pins de segurança para sempre (A13). O Quick Update que é rápido porque pula skills/MCP/CLI nunca conta isso a ninguém (C6). As falhas parciais que não abortam o install também não aparecem no exit code (M24).

Cinco temas concentram os achados:

1. **O gate silencioso do Quick Update é o único CRÍTICO de código.** Já era conhecido por memória de projeto ("atualizei e não veio skill"); esta parte confirma que o silêncio é total: nem hint no menu, nem log durante, nem menção no resumo final.
2. **O design proposto para env vars tem uma premissa quebrada.** O Claude Code expande `${VAR}` do `process.env` ao ler `.mcp.json`, mas **não carrega `.env` automaticamente**. Gravar secret em `.env` e encerrar o install "resolvido" cria falsa sensação de configuração: na próxima sessão o placeholder continua sem valor. `~/.wizz-env` é pior: secret órfão que nada lê. O design precisa decidir o mecanismo de **entrega** (não só de armazenamento) antes de qualquer linha de código.
3. **`installer.js` (1789 linhas) é god-object confirmado**, com 8+ responsabilidades e 3 parsers CSV coexistindo no mesmo arquivo (dois manuais + `csv-parse/sync`).
4. **A lógica de resolução por área existe em 3 cópias divergentes** (`resolveMcps`, `resolveClis`, `resolveSkillIds`) — o mesmo algoritmo, três implementações, nenhuma abstração compartilhada. É o mecanismo pelo qual o drift institucional temido nos comentários do próprio código vai acontecer.
5. **75% dos módulos do installer não têm teste direto** (31 de ~41 arquivos), incluindo o orquestrador `commands/install.js` e o entry `wizz-cli.js`. O que é testado, é bem testado (mcp-config e cli-config têm cobertura real de merge, placeholders e setup blocks).

---

## A. Achados CRÍTICOS

### C6. Quick Update pula skills/MCP/CLI sem nunca dizer isso ao usuário

`tools/installer/ui.js:236-241` apresenta o menu como um item seco `{ name: 'Quick Update', value: 'quick-update' }`, sem hint. O gate real em `tools/installer/core/installer.js:309` (`if (!config.isQuickUpdate() && (config.modules || []).includes('bmm'))`) pula a instalação de skills globais, MCPs e CLIs — e isso não é comunicado em nenhum dos três momentos possíveis: antes (menu), durante (log), depois (`install.js:124-131` só diz "Updated N modules with preserved settings").

O comportamento em si é uma decisão de arquitetura defensável (update rápido não deve reprovisionar ambiente). O problema é ser segredo. Já gerou confusão real registrada em memória de projeto ("atualizei e não veio skill") e existe até teste de regressão para o gate (`test/test-quick-update-gate.js`) — ou seja, o time sabe que o gate é sensível, mas o usuário continua no escuro.

**Correção (aditiva, zero risco):**
1. Hint no choice: `hint: 'Atualiza só os módulos instalados — não instala skills/MCPs/CLIs novos'`.
2. `prompts.log.info` no início de `quickUpdate()` (`installer.js:1387`) listando o que será e o que não será tocado.
3. Uma linha no resumo final: "Skills/MCPs/CLIs não foram alterados (Quick Update). Para provisioná-los, rode install → Modify."

### C7. Feature Smart Env Var Detection: a persistência proposta não entrega o valor ao runtime

Fato verificado (não suposição): o Claude Code expande `${VAR}` e `${VAR:-default}` em `command`/`args`/`env`/`url`/`headers` do `.mcp.json` a partir do **`process.env` da sessão** — e variável obrigatória ausente (sem default) faz o parse do server falhar. Isso valida a premissa 1 da proposta (placeholders funcionam). Mas o Claude Code **não carrega `.env` da raiz do projeto**; ele só enxerga o ambiente do shell e a chave `env` de `settings.json`/`settings.local.json`.

Consequência: os itens 5-6 da proposta (persistir em `.env` na raiz, fallback `~/.wizz-env`) armazenam o secret num lugar que o consumidor não lê:

- `.env` na raiz só funciona se o usuário usa direnv/`source` antes de abrir o Claude Code — condição que o installer não controla nem verifica. O usuário digita o token, vê "configurado ✓", e na próxima sessão o MCP falha igual.
- `~/.wizz-env` é estritamente pior: **nenhum código do framework nem do Claude Code lê esse arquivo hoje**. É um secret órfão em disco com falsa sensação de "já configurei". Não implementar.

**Correção de design (escolher explicitamente o alvo de entrega):**
- **Opção (a), recomendada:** persistir na chave `env` de `.claude/settings.local.json` do projeto (arquivo que o Claude Code de fato lê e mescla em todo subprocesso, e que já é gitignored por convenção do Claude Code). O secret chega ao runtime sem depender de disciplina de shell.
- **Opção (b):** manter `.env` apenas como conveniência para outras ferramentas (docker-compose, scripts) e imprimir instrução explícita no resumo ("adicione ao shell profile ou use direnv") — nunca apresentar como "resolvido".
- Em ambas: descartar `~/.wizz-env` até existir um loader real que o consuma.

Restante da avaliação de design (fluxo, API, regex, segurança, compatibilidade, testes) na seção E.

---

## B. Achados ALTOS

### A13. Merge aditivo do `.mcp.json` congela pins de segurança para sempre

`tools/installer/modules/mcp-config.js:280-283` (`writeMcpConfig`): se o id do server já existe no `.mcp.json`, é pulado. Isso protege customização do usuário (correto), mas também significa que **nenhum bump de pin do registry chega a projeto já instalado**. Os pins de supply chain que a parte 1/2 mandaram criar (`skills-registry.yaml:126` `@21st-dev/magic@0.1.0`, `:394` `@upstash/context7-mcp@3.2.2`, `:246` `scrapling==0.4.10`) viram letra morta no re-install: se um pin for bumped por CVE, o projeto continua rodando a versão vulnerável até o usuário apagar a entrada à mão. Não há marcador distinguindo "server gerenciado pelo wizz, nunca editado" de "server que o usuário customizou", então hoje não dá para atualizar nada com segurança.

**Correção:** gravar um marcador de conteúdo por server no `skill-deps-cache.json` (o cache já existe, `modules/deps-cache.js`) — hash do bloco que o installer escreveu. No re-install: se o bloco atual do `.mcp.json` bate com o hash (usuário nunca tocou), oferecer "atualizar pin X → Y"; se não bate, manter o comportamento atual e avisar. Preserva 100% da proteção ao usuário e destrava o canal de fix de segurança.

### A14. Sem instalação atômica: falha no meio deixa estado inconsistente e irreversível

`tools/installer/core/installer.js:41-143` (`install`): o catch externo (linha 126) só restaura backups de **arquivos do usuário** (custom/modified). Módulos já copiados para `_wizz/` (`_installOfficialModules:853`) e `.mcp.json` já mesclado (linha 354) não são desfeitos. Se `generateManifests` (linha 455) falhar depois disso, o resultado é: módulos no disco, MCPs escritos, **sem `manifest.yaml` válido** — e o próximo install vai ler esse estado como "instalação existente" corrompida.

**Correção:** escrever a árvore nova em `_wizz.tmp-<pid>/` e fazer swap (`fs.rename`) só depois do manifest gerado; o merge do `.mcp.json` (que vive fora de `_wizz/`) fica por último, após o swap. Em erro, remover só o tmp. Para updates, o swap exige merge com `_wizz/` existente — é a parte com risco real, tratar em PR separado do fresh-install.

### A15. `installer.js` é god-object de 1789 linhas com 3 parsers CSV

A classe `Installer` mistura: orquestração (`install`, `_installAndConfigure`), detecção de arquivos custom (`detectCustomFiles:968-1078`), geração de YAML por módulo (`generateModuleConfigs:1085-1173`), merge de catálogos de help em CSV (`mergeModuleHelpCatalogs:1182-1288`), parsing manual de CSV (`parseCSVLine`/`escapeCSVField:1742-1786`), backup/restore de arquivos do usuário e todo o `quickUpdate` (1387-1554). Três implementações de parse CSV coexistem no arquivo: duas manuais (`detectCustomFiles`, `readFilesManifest:911-960`) e `csv-parse/sync` (`_readSkillManifestRows:592`, `_cleanupSkillDirs:543`).

**Correção (extração por composição, sem herança):**
- `core/user-file-preservation.js` ← `detectCustomFiles` + `_backupUserFiles` + `_restoreUserFiles`
- `core/module-config-writer.js` ← `generateModuleConfigs`
- `core/help-catalog.js` ← `mergeModuleHelpCatalogs` + unificação dos 3 parsers em `csv-parse/sync` (já é dependência)
- `core/quick-update.js` ← `quickUpdate`, consumindo `Installer` por composição

Risco: referências a `this.installedFiles`/`this.manifest` exigem injeção explícita; validar manifests gerados byte-a-byte antes/depois.

### A16. A lógica de resolução por área existe em 3 cópias que já divergiram

`resolveMcps` (`mcp-config.js:35-69`), `resolveClis` (`cli-config.js:87-118`) e `resolveSkillIds` (`skills-lib.js:36-52`) implementam literalmente o mesmo algoritmo: sentinel `wantAll` → `chosen = wantAll ? Object.keys(areas) : selectedAreas` → dedupe por `Map` acumulando `areas[]` → inclusão de lista cross-cutting (`mcp_utility`/`cli_utility`/`utility`). Só muda o campo lido e a validação de "actionable". O próprio código comenta o medo institucional de divergência ("Mantê-los lendo o MESMO arquivo garante que roteamento e instalação nunca divirjam") — mas a lógica de resolução em si já está em 3 cópias.

**Correção:** extrair `modules/registry-resolve.js` com `resolveAreaEntries(registry, selectedAreas, { listKey, utilityKey, isActionable })`; os três viram wrappers finos. Bônus na mesma linha: `detectClis` (`cli-config.js:140-148`) e o passo DETECT de `prepareMcp` (`mcp-config.js:169-171`) resolvem o mesmo problema (binário existe?) com implementações distintas — compartilhar um helper de detecção; e o padrão de seleção `toWrite/toInstall vs toRecommend` duplicado em `ui.js:551-670` cabe num helper genérico (~60 linhas a menos).

### A17. 75% dos módulos do installer sem teste direto (31 de ~41 arquivos)

O que existe é bom: `test-installation-components.js` (3680 linhas, 13 IDEs, preservação de hand-edits), `test-mcp-config.js` (448 linhas: merge/idempotência, placeholders `${VAR}` preservados, setup blocks, JSON corrompido), `test-cli-config.js` (gates de plataforma), `test-installer-channels.js`, `test-deps-cache.js`, `test-quick-update-gate.js`. Tudo roda no CI (`.github/workflows/quality.yaml:107` executa `npm test`, que é superset do `npm run quality` — corrige a impressão da parte 1 de que o CI rodava subconjunto).

Gaps críticos sem nenhum teste: `commands/install.js` (orquestra o fluxo inteiro), `wizz-cli.js` (entry), `modules/skills-lib.js` (cópia de skills — só testado via spy), `core/config.js`, `modules/official-modules.js`. Altos: `core/existing-install.js`, `modules/external-manager.js`, `modules/custom-module-manager.js`, `ide/_config-driven.js`. Em `mcp-config`, faltam: `prepareMcps` em lote (array) e resolução runtime de env vars.

**Correção:** priorizar 3 testes novos, nessa ordem: (1) smoke de `commands/install.js` com `--yes` em diretório temporário (pega quebra de fluxo ponta-a-ponta, o maior buraco), (2) `skills-lib.js` com fixture de registry mínimo, (3) `prepareMcps` em lote. Os demais gaps entram conforme os módulos forem extraídos do god-object (A15) — extrair sem levar teste junto é perder a janela.

---

## C. Achados MÉDIOS

### M23. Catches vazios engolem erros na detecção de customizações do usuário

`installer.js:1071` (`scanDirectory`), `:580`, `:1706`, `:1724`, `:1729`: `catch { }` silencioso. O pior é o `scanDirectory`: erro de permissão num subdiretório aborta a varredura de arquivos custom/modificados **sem sinalizar** — e essa varredura é o que decide o que será preservado num update. Falha silenciosa aqui = risco de perder customização do usuário. **Correção:** `prompts.log.warn` com path e erro em cada catch, mantendo o best-effort.

### M24. Falhas parciais reais saem com exit code 0 e `success: true`

`installer.js:317-378, 393-411, 420-432`: falhas em skills-lib, MCP e CLI viram `prompts.log.warn` e não tocam `result.success`. `install.js:142` só olha `result.success` → processo sai 0 mesmo com MCPs/CLIs essenciais quebrados. CI/automação não tem como detectar "sucesso com avisos" sem parsear texto. **Correção:** agregar essas falhas em `results` com status `'warn'` (padrão já usado no summary) e emitir contagem de warnings; manter exit 0 mas com sinal estruturado (ou exit code dedicado documentado como breaking change).

### M25. `resolveBinPath` não cobre os prefixos do Homebrew

`mcp-config.js:121-134`: fallback físico cobre só `command -v` (PATH herdado) + `~/.local/bin`. Não cobre `/opt/homebrew/bin` (Apple Silicon) nem `/usr/local/bin` (Intel). Se o installer roda via `npx` disparado por GUI/cliente com PATH pobre, um binário instalado via Homebrew dá falso-negativo e é **reinstalado** via uv/pipx/pip (binário duplicado) — exatamente a classe de bug ENOENT que motivou o `prepareMcp`. **Correção:** adicionar os dois prefixos brew à lista de fallback (3 linhas). Conecta com M13 da parte 2 (`pip --user` no macOS).

### M26. `prepareMcps` reprocessa servers que serão pulados pelo merge

`mcp-config.js:224-233`: roda DETECT→INSTALL→VERIFY→RESOLVE para todo item de `toWrite`, mesmo os ids que já existem no `.mcp.json` e serão pulados por `writeMcpConfig` (`:280-283`). Idempotente, mas paga subprocess + I/O em todo re-install à toa. **Correção:** filtrar ids já presentes no `.mcp.json` antes do prepare.

### M27. `detectClis` nunca compara versão com o pin (causa-raiz do drift do RTK)

`cli-config.js:143-145`: `installed: true` é decidido só pelo exit code do `check` (`rtk --version` roda → instalado). Nunca compara com o pin do registry. É o mecanismo exato pelo qual o C4 da parte 2 aconteceu (rtk 0.30.1 rodando com pin v0.43.0): o detect-first nunca vai reinstalar versão desatualizada. **Correção:** campo opcional `min_version:` no registry + comparação semver no detect; quando abaixo do pin, mover para `toInstall` com mensagem "atualizando X 0.30.1 → 0.43.0".

### M28. Comandos com saídas espalhadas e descoberta dinâmica sem validação de shape

Dois achados menores de robustez: (1) `process.exit` espalhado sem convenção (install.js: 7 pontos; uninstall.js: 5; status.js: 4) — extrair helper `exitWith(code, message)`; (2) `wizz-cli.js:73-81` registra comandos de `commands/*.js` via require dinâmico sem validar `command.command`/`command.action` — arquivo malformado derruba o CLI com stack trace do commander em vez de diagnóstico direcionado. Padrão registry é bom; só falta o guard de 4 linhas.

**Baixo (registrado, sem urgência):** `mcp-config.js:274-275` — `typeof [] === 'object'`: um `.mcp.json` malformado com `mcpServers` como array faz o server "adicionado com sucesso" desaparecer silenciosamente no `JSON.stringify` (propriedade não-índice em array é descartada). Guard: `Array.isArray` no check.

---

## D. Mapa do fluxo de instalação (referência)

```
wizz-cli.js:73-96          descoberta dinâmica de commands/*.js (registry por diretório)
  └ commands/install.js:64-160   valida flags → ui.promptInstall(options)
      ├ ui.js:218-231            detecção de install existente → core/existing-install.js:45 (snapshot frozen do manifest)
      ├ ui.js:236-330+           menu Quick Update vs Modify → seleção módulos/IDEs/áreas → resolveMcps/resolveClis
      ├ core/config.js:60-82     Config.build → objeto frozen com isQuickUpdate()
      ├ core/install-paths.js:7-47   valida leitura/escrita ANTES de copiar (bom)
      └ core/installer.js:41     install()
          ├ _removeDeselectedModules:149 / _removeDeselectedIdes:194 / _validateIdeSelection:170
          ├ _prepareUpdateState:721 → _backupUserFiles:760        (backup só de arquivos do usuário)
          ├ _installAndConfigure:218
          │   ├ _installSharedScripts:800 / _installOfficialModules:853
          │   └ configTask:294-481
          │       ├ generateModuleConfigs:1085
          │       ├ GATE :309 (!isQuickUpdate && modules⊇bmm) → installSkillsLib + prepareMcps/writeMcpConfig + installClis
          │       ├ ManifestGenerator.generateManifests:455 → applySetOverrides:466 → mergeModuleHelpCatalogs:1182
          │       └ (falhas de skills/MCP/CLI = warn-only, não abortam)     ← M24
          ├ _setupIdes:508 → ide/manager.js setupBatch
          ├ _cleanupSkillDirs:542 → _restoreUserFiles:650
          └ renderInstallSummary:1295
Ponto sem volta: após a etapa de módulos, falha em generateManifests deixa _wizz/ populado sem manifest (A14).
```

---

## E. Design da feature Smart Env Var Detection (avaliação completa)

**Veredicto: ajustar antes de implementar.** A ideia central (detectar `${VAR}` faltante e assistir o preenchimento) é boa e cabe no installer. O bloqueador é o C7 (alvo de persistência errado). O restante da proposta precisa dos ajustes abaixo.

### E1. Fluxo de integração

A ordem proposta (resolução → `prepareMcps` → prompt → `.mcp.json`) está certa, com três refinamentos ancorados no código real:

1. Rodar **só sobre `toWrite`**, nunca `toRecommend` — respeita o contrato existente de `ui.js:544-545/583` (modo `--yes`/sem TTY nunca escreve `.mcp.json`, só recomenda `claude mcp add`).
2. Pular vars de servers cujo id já existe no `.mcp.json` (o merge aditivo vai ignorá-los; perguntar seria pedir secret que não será usado).
3. Prompt **depois** de `prepareMcps`: se o binário do MCP falhou no verify, não faz sentido pedir o token dele.

Pipeline final: `resolveMcps` → `selectMcps` → `prepareMcps(toWrite)` → `promptMissingEnvVars(toWrite, opts)` → `writeMcpConfig` → resumo.

### E2. Extração de placeholders

Regex recomendada: `/\$\{([A-Z_][A-Z0-9_]*)(?::-([^}]*))?\}/g`

- Grupo 1 = nome (convenção POSIX estrita, elimina falso positivo de `{bin}` e de templates não-env).
- Grupo 2 = default opcional. **Var com default nunca gera prompt** (o runtime do Claude Code resolve `${VAR:-default}` sozinho) — classificar como `skipped` automático.
- Onde procurar: `Object.values(server.env)` **e** `server.args` (defensivo; hoje o registry só usa env, mas nada impede `--token ${VAR}` num MCP futuro).
- Realidade atual do registry: 4 MCPs com env, todos 1 var na forma pura `${VAR}` (`MAGIC_API_KEY`, `META_ACCESS_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `EXA_API_KEY` — `skills-registry.yaml:129-130, 289-290, 329-330, 364-365`). A feature nasce pequena; o design não deve assumir mais que isso.

### E3. API

A assinatura monolítica `promptMissingEnvVars(mcps)` mistura extração (pura), resolução (I/O de leitura + prompt) e persistência (I/O de escrita) — intestável sem TTY. Decomposição recomendada, mantendo a assinatura original como orquestrador fino de compatibilidade:

```js
function extractEnvPlaceholders(mcps)
  // pura → [{ name, mcpIds: string[], hasDefault, default }]

async function resolveEnvVars(vars, { interactive, providers = [processEnv, dotenvFile], prompter })
  // → { filled, skipped, existing, toPersist: Record<string,string> }

async function persistEnvValues(toPersist, { projectDir, target })  // target: 'settings-local' | 'dotenv'
  // → filePath | null

async function promptMissingEnvVars(mcps, opts) { /* compõe as 3 acima, retorna { filled, skipped, existing, envFile } */ }
```

O retorno proposto (`filled/skipped/existing/envFile`) é bom; adicionar `mcpIds` por var no retorno interno permite o resumo dizer "MAGIC_API_KEY (usada por: magic)".

Seam para secret managers (só a interface, sem implementar nenhum provider agora):

```js
// { name, available(): Promise<bool>, get(varName): Promise<string|undefined> }
// cadeia: ProcessEnvProvider → DotenvFileProvider → (futuro: Vault/Doppler/1Password) → prompt
```

Quando Vault/Doppler chegarem, entram na cadeia sem mudar `resolveEnvVars`. Não criar registry de providers, config de providers nem plugin system — é overengineering para 4 variáveis.

### E4. Segurança

- **Masking já está pronto e sem uso:** `prompts.js:492-502` exporta `password()` do `@clack/prompts` e nenhum caller existe hoje. Esta feature seria o primeiro. Nunca usar `text()` para secret.
- Restrição da lib: `validate` de `text`/`password` deve ser **síncrona** (`prompts.js:763-765, 806-807` lança TypeError com Promise). Validações de formato de token respeitam isso; nunca ecoar o input na mensagem de erro.
- Nunca gravar valor real no `.mcp.json` (preserva o princípio atual do módulo).
- `chmod 600` no arquivo persistido: POSIX-only; no Windows é no-op — documentar e aceitar, não implementar icacls.
- Merge sem sobrescrever: chave já presente no arquivo destino nunca é trocada (usuário pode ter editado à mão); arquivo existente entra na cadeia de providers para não reperguntar o que já está lá.
- `.gitignore`: o installer **nunca tocou o `.gitignore` raiz** (único precedente é `_wizz/custom/.gitignore`, `installer.js:816-819`). Se a opção (b) do C7 for escolhida: checar cobertura existente (`.env`/`.env*`) antes de duplicar linha; criar minimalista se não existir; e rodar `git ls-files .env` — se o arquivo **já está versionado**, gitignore não retroage: warning explícito, não silêncio. Com a opção (a) (`settings.local.json`) o problema quase desaparece.
- Instalação **nunca** falha por env var pulada: placeholder fica no `.mcp.json` e o resumo aponta como configurar depois.

### E5. Compatibilidade

- Detecção não-interativa: reusar a fórmula que o installer já usa — `!!options.yes || !process.stdin.isTTY` (`ui.js:176`). Não inventar detecção de `CI=true`: GH Actions/GitLab/Docker já caem no caso sem TTY (não há um único grep hit de `process.env.CI` no installer hoje, e nunca fez falta).
- Sem TTY: zero prompt, todas as vars ausentes → `skipped`, um warning agregado, exit 0. Compatível com o contrato existente de que modo não-interativo nem escreve `.mcp.json`.
- Windows: `@clack/prompts` foi escolhido justamente por funcionar bem no Windows (`prompts.js:1-8`); `chmod` é a única concessão (acima).

### E6. DX e resumo final

Formato do resumo (uma linha por var, agrupado):

```
Env vars dos MCPs:
  ✓ SUPABASE_ACCESS_TOKEN   já existia no ambiente
  ✓ MAGIC_API_KEY           configurada agora (settings.local.json)
  ○ META_ACCESS_TOKEN       pulada — MCP meta-ads fica inativo até configurar
      → claude code: adicione em .claude/settings.local.json { "env": { "META_ACCESS_TOKEN": "..." } }
```

A linha "como configurar depois" por var pulada é o item de maior valor de DX da feature inteira: converte o skip de beco sem saída em tarefa de 30 segundos.

### E7. Testes da feature

- `extractEnvPlaceholders` (puros): var única; var compartilhada por 2 MCPs (dedup com `mcpIds` acumulado); `${VAR:-default}` → `hasDefault`; nome minúsculo ignorado; `{bin}` ignorado; env ausente; placeholder em `args`.
- `resolveEnvVars` (prompter fake injetado, sem TTY real): hit em `process.env` → `existing`; não-interativo + ausente → `skipped`; interativo + fornece → `filled` + `toPersist`; cancela → `skipped`; com default → `skipped` sempre.
- `persistEnvValues`: destino não existe → criado; existe com chaves alheias → merge; chave existente → preservada; permissões (skip no Windows via `process.platform`).
- Não-interativo: `--yes` com TTY ainda pula; sem TTY sem `--yes` pula.
- Regressão de segurança: capturar stdout do fluxo e assertar que o valor digitado nunca aparece.
- Se opção (b): `.gitignore` criado/não duplicado; `.env` já versionado → warning.

---

## F. Plano de refatoração consolidado (ordem sugerida)

| # | Item | Achado | Esforço | Risco |
|---|------|--------|---------|-------|
| 1 | Hint + logs do Quick Update | C6 | 30 min | zero |
| 2 | Warns → `results` + contagem no exit | M24 | 1-2 h | baixo |
| 3 | Prefixos brew no `resolveBinPath` + filtro no `prepareMcps` | M25, M26 | 1 h | zero |
| 4 | Catches vazios → warn com path | M23 | 30 min | zero |
| 5 | `registry-resolve.js` unificando as 3 resoluções | A16 | 2-3 h | baixo (3 suites já cobrem) |
| 6 | `min_version` no detect de CLIs | M27 | 2 h | baixo |
| 7 | Smoke test de `commands/install.js --yes` | A17 | 2-3 h | zero |
| 8 | Extração do god-object (4 módulos) | A15 | 1-2 dias | médio |
| 9 | Marcador de conteúdo p/ update de pins no `.mcp.json` | A13 | 1 dia | médio |
| 10 | Install atômico (tmp + swap) | A14 | 2-3 dias | alto (updates) |
| 11 | Feature env vars (design corrigido, C7 + E1-E7) | C7 | 2-3 dias | médio |

Itens 1-4 cabem num único PR "hardening do installer" sem mudança de comportamento além de mensagens. O item 11 só depois do 3 (compartilha `resolveBinPath`) e da decisão explícita do alvo de persistência (settings.local.json vs .env — recomendação: settings.local.json).

---

*Auditoria executada por 4 agentes paralelos (arquitetura, resolução, design da feature, testes) em modelos de menor custo, com síntese e verificação cruzada na sessão principal. Nenhum arquivo do repo foi modificado.*
