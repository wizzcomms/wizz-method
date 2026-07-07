# Auditoria Completa do Framework Wizz Method: Parte 2 de 4

Data: 2026-07-07 · Versão auditada: 1.4.2 (main, `fb1d8e54`) · Método: 5 frentes de análise paralelas (MCPs, CLIs, memória, RTK, fluxo de contexto/duplicação) + síntese de arquitetura, escalabilidade, compatibilidade, n8n, casos extremos e red team.

Escopo desta parte: MCPs, CLIs, sistema de memória, RTK, fluxo de contexto, economia de tokens, preservação de conhecimento, arquitetura, escalabilidade, compatibilidade, avaliação do MCP do n8n, casos extremos e red team. A numeração de achados continua a da parte 1 (que parou em C3/A7/M10) para permitir referência cruzada.

Princípio mantido: nenhuma recomendação remove capacidade, especialização ou conhecimento. Tudo é reorganização, consolidação por referência, verificação ou lazy-loading.

---

## Sumário executivo

O desenho conceitual das camadas está certo: MCPs com pin e placeholder de secret, pipeline de MCP com verify antes de escrever config, CLIs opt-in que nunca abortam o install, RTK fail-open em 3 níveis, memória em camadas com fonte de verdade declarada. O problema não é o desenho: é que **quase nenhuma garantia é verificada em runtime ou CI**, então o desenho e a realidade já divergiram em vários pontos.

Os achados desta parte se concentram em 5 temas:

1. **O componente de maior privilégio é o menos governado.** O RTK reescreve todo comando de shell da máquina, é binário fechado, vive fora do repo e do `sync:global`, está 13 minor versions atrás do pin que o registry declara (0.30.1 instalado vs v0.43.0 pinado, e o `check:` não compara versão), e tem um bug reproduzível: em comando multi-linha só a primeira linha é reescrita, gerando saída mista sem aviso.
2. **Secrets com blast radius alto em MCPs de execução real.** O MCP do Supabase é gravado sem `--read-only`/`--project-ref` (token = SQL arbitrário na conta inteira) e o de Meta Ads é um pacote comunitário não-oficial com acesso a token de gasto de anúncios, compartilhado com a CLI `arcads`.
3. **Metade dos MCPs é "órfã de instrução"**: `scrapling`, `supabase` e `exa` existem no registry mas nenhum agente instrui quando/como usá-los; na direção oposta há MCPs fantasmas citados sem existir no registry (Stitch, shadcn/ui, playwright na tabela flat). O validador de referências não varre os arquivos onde os fantasmas moram.
4. **A memória não está cumprindo a própria hierarquia.** Contradições ativas entre camadas (3 versões de npm diferentes em arquivos de memória, nenhuma correta), índice do Cérebro com 324 linhas contra o limite autodeclarado de 150, mecanismo de descoberta do vault documentado mas quebrado, e o próprio projeto wizz-method ausente do Cérebro apesar do "Dever de Memória".
5. **A duplicação de instrução tem causa raiz técnica, não disciplinar**: o `resolve_customization.py` não tem `include`/`extends`, então a única forma de compartilhar uma regra entre 15 `customize.toml` é copiar texto. O drift previsto na parte 1 já começou: 5 variantes da regra ECONOMIA e 4 do template de ENCERRAMENTO em circulação.

Sobre o n8n: **não recomendado como MCP do framework** (nem obrigatório nem opcional default). Análise completa na seção J, com alternativas que cobrem os mesmos ganhos sem servidor novo, sem superfície nova de secrets e sem custo de tool definitions.

---

## A. Achados CRÍTICOS

### C4. RTK: privilégio máximo, governança mínima (drift ativo + bug reproduzível)

A parte 1 (M3) apontou o pin; a investigação desta parte achou problemas maiores:

- **Drift de versão ativo e indetectável**: o registry pinou `v0.43.0` em 2026-07-07 (`skills-registry.yaml:409`), mas o binário instalado é `rtk 0.30.1` de 18/mar/2026. O `check: "rtk --version"` só testa se o comando roda, não compara com o pin. O registry acredita estar protegido; a máquina roda outra coisa há 4 meses.
- **Fora de qualquer controle**: `rtk-rewrite.sh` não existe em `tools/hooks/` (fonte de verdade declarada no README de hooks), não está na tabela do README, e o `tools/sync-global.mjs` não o menciona. O hook que processa 22 mil+ comandos vive só em `~/.claude/hooks/`, instalado uma vez pelo instalador do rtk e nunca mais tocado. Num ambiente novo, `sync:global` não o leva junto.
- **Bug reproduzível de reescrita parcial**: em comando multi-linha (quebra de linha real, padrão comum do Claude Code), só a primeira linha é reescrita; as demais passam cruas. Resultado: saída mista (parte compacta, parte crua) sem sinalização, e o mesmo `git status` pode voltar em dois formatos na mesma sessão. Confirmado por teste direto no `rtk rewrite` (binário 0.30.1).
- **Sem rede de segurança para commit**: `rtk git commit` reduz a saída a `ok <hash>`; o diretório de tee (backup de saída crua em falha) só contém logs de vitest/lint, nenhum de `git_commit`. Este repo roda Husky pre-commit com `npm test` inteiro: se o commit falhar, a razão pode não sobreviver ao filtro.
- **Perdas de informação confirmadas**: `rtk ls -la` descarta permissões, dono e timestamp mesmo com a flag explícita; `git status` compacto tem limites de corte (`status_max_files=15`) cujo comportamento de aviso não é verificável (o `config.toml` "default" nem existe em disco); o limite `grep_max_results=200` anunciado não se aplicou num teste com 72.907 linhas (voltou tudo, ou seja, nesse caso o rtk não economizou nada).
- **Dados reais de ganho**: 582.5M tokens economizados em 111 dias (99%), mas 94% disso vem de um único padrão (`rtk grep` com outliers extremos). No escopo deste projeto o número honesto é **72.1%** de economia (690K de 957K). O recovery de falhas de parse é bom: 99.9% em 4.868 falhas históricas.

**Correção (preserva 100% da capacidade):**
1. Atualizar o binário para o pin (`v0.43.0`) e trocar o `check:` por comparação de versão mínima (padrão que o `setup.verify` do scrapling já usa).
2. Trazer `rtk-rewrite.sh` + `.rtk-hook.sha256` para `tools/hooks/` e incluir no `sync:global` (vira artefato versionado; o binário continua upstream, mas o hook passa a ser auditável).
3. Reportar o bug multi-linha upstream; enquanto isso, documentar em `token-economy.md` (1 linha): "saída de comando multi-linha pode vir mista".
4. Teste de fumaça no `npm test`: `rtk rewrite` de 3 comandos canônicos (single-line, multi-linha, destrutivo) com asserts do formato esperado; pega drift de comportamento a cada release.
5. Avaliar tee para `git_commit` (config do rtk) ou instruir os agentes a rodar `rtk proxy git commit` quando o pre-commit for pesado.

### C5. MCPs de execução real com blast radius desnecessário (Supabase sem read-only, Meta Ads comunitário)

- `supabase` (`skills-registry.yaml:326-330`): gravado no `.mcp.json` sem `--read-only` nem `--project-ref` nos `args`. O `SUPABASE_ACCESS_TOKEN` dá execução de SQL arbitrária em toda a conta. O próprio pacote oficial suporta os dois flags para reduzir escopo. Agravante: nenhum agente instrui quando usar (é órfão de instrução, ver A9), então o primeiro uso será improvisado, com o token mais poderoso possível.
- `meta-ads` (`skills-registry.yaml:286-290`): `mcp-meta-ads@1.0.0` é pacote comunitário (não é `@meta`/`@facebook`), com acesso ao `META_ACCESS_TOKEN` (gasto real de anúncios). O mesmo token é reaproveitado pela CLI `arcads` (linha 293): duas ferramentas de categorias diferentes, mesma credencial, nenhum documento amarrando isso.

**Correção:**
1. Supabase: adicionar `--read-only` e `--project-ref ${SUPABASE_PROJECT_REF}` como default nos `args` do registry; documentar no `when` que operações de escrita exigem remover o flag conscientemente. Zero perda de capacidade (o modo escrita continua a 1 edição de distância, mas deixa de ser o default silencioso).
2. Meta Ads: registrar a decisão de confiança (auditoria rápida do código do pacote na versão pinada, que já está fixa em 1.0.0) ou trocar por chamada via CLI própria; no mínimo, comentário no registry: "pacote comunitário, revisado em <data>, escopo do token: X".
3. Recomendar token Meta com escopo mínimo (ads_read para relatórios; ads_management só quando a campanha real for confirmada) na doc da área ads.

---

## B. Achados ALTOS

### A8. Supply chain incompleto: 3 CLIs sem pin nenhum + gates de validação que nunca rodam

Duas metades do mesmo problema (a garantia declarada não é verificada):

- **CLIs sem pin**: `hyperframes` (`skills-registry.yaml:135`), `claude-video` (`:139`) e `distribb` (`:189`) instalam via `npx skills add <repo>` puxando o HEAD do repo de terceiro no momento da instalação. Contradiz o padrão do próprio arquivo (buttercut/voicebox/arcads com SHA e comentário "Pin de supply chain 2026-07-06"). O rtk com `curl | sh` de tag melhorou, mas tag git pode ser movida à força; falta checksum.
- **Gates fantasma**: `AGENTS.md` afirma que `npm run quality` espelha o CI, mas `quality` não é chamado em lugar nenhum (nem pre-commit, nem CI). Consequência concreta: `validate:refs` (`validate-file-refs.js --strict`) e `validate:skills` **não rodam em nenhum gate automático**. São exatamente os validadores de integridade de skills e referências. Complementa o C3 da parte 1: mesmo depois de o CI rodar `npm test` completo, esses dois continuam de fora porque não estão no `test`.

**Correção:** (1) pinar os 3 `npx skills add` em SHA/tag (se a ferramenta `skills` não suportar, trocar por `git clone` + checkout como os outros 3 já fazem); (2) checksum do install.sh do rtk (baixar, `shasum -c`, executar); (3) incluir `validate:refs` e `validate:skills` no `npm test` (ou no job `validate` do CI junto com o `validate:method-refs`); (4) corrigir a frase do AGENTS.md ou fazer o CI chamar `quality` de fato.

### A9. Metade dos MCPs é órfã de instrução; fantasmas citados fora do registry escapam do validador

- **Órfãos de instrução** (existem no registry, nenhum agente/skill instrui uso): `scrapling` (growth), `supabase` (architect), `exa` (analyst). Os `customize.toml` desses 3 agentes têm zero menções a MCP. O critério de uso vive só no `when:` do YAML, que o agente não lê em runtime. Na prática: capacidade instalada que ou não é usada, ou é usada sem critério. Contraste: `wizz-ads` é o modelo certo (customize.toml instrui "Use o MCP meta-ads via ToolSearch" em 3 pontos).
- **Fantasmas** (citados, sem entrada no registry): "Stitch MCP" é hard dependency de `react-components/SKILL.md` (`allowed-tools: stitch*:*`) e citado no próprio registry (linhas 85, 103) só em texto; "shadcn/ui MCP" na descrição de `ui-ux-pro-max`; "playwright (browser E2E)" listado como "MCP comum" em `routing-table-flat.md:93`, contradizendo a proibição explícita do registry (`:339-341`, "browser SEMPRE via agent-browser, nunca Playwright").
- **Por que ninguém pegou**: `validate-method-refs.js:24-31` só varre `README.md`, `docs/`, o registry, `src/modules/wizz` e 2 skills. `react-components`, `find-skills` e `ui-ux-pro-max` ficam fora do escopo de varredura.

**Correção:** (1) 1-2 linhas de instrução de MCP no customize.toml de growth/architect/analyst, no padrão do wizz-ads (é onde o critério de uso passa a existir em runtime); (2) decidir o destino do Stitch: ou entra no registry como MCP da área designer (com `when` explicando que exige ambiente com Stitch disponível), ou o `react-components` ganha nota de pré-requisito; (3) remover "playwright" da tabela flat (mesmo em modo flat a doutrina agent-browser vale, e a memória global do usuário confirma); (4) ampliar `SCAN_ROOTS` do validador para `src/skills-lib/**/SKILL.md`.

### A10. Memória: contradições ativas entre camadas e regras autodeclaradas não cumpridas

O desenho de hierarquia (Cérebro = fonte de verdade cross-ferramenta; auto-memória = operacional; proposto na parte 1, M4) não está acontecendo na prática:

- **Contradição ativa**: 3 arquivos de memória afirmam 3 versões diferentes do npm (`1.2.1`, `1.3.2`, `1.4.0`); a realidade é 1.4.1 publicado / 1.4.2 no repo. Nenhum foi atualizado ou marcado obsoleto; a única salvaguarda é o aviso genérico do harness ("memória tem N dias").
- **Regra de tamanho ignorada**: o `SKILL.md` do cerebro exige `CEREBRO.md < 150 linhas`; o arquivo real tem 324 linhas / 35KB. Nada verifica.
- **Mecanismo documentado quebrado**: o SKILL.md instrui descobrir o vault via `grep -m1 "^vault:" CEREBRO.md`, mas o CEREBRO.md real não contém nenhuma linha `vault:`. O fallback documentado nunca funcionou; sobrevive por path fixo hardcoded.
- **Dever de Memória descumprido no próprio framework**: a auto-memória do projeto tem 20 arquivos ricos (56KB) sobre wizz-method, mas o Cérebro não tem `projetos/wizz-method.md` nem lista o projeto no índice. Decisões de arquitetura recentes (hierarquia Diretor/Gerente, dieta de tokens) existem só na camada "operacional", violando a regra do CLAUDE.md global.
- **Sem TTL, sem dedupe, sem compressão em nenhuma camada** (grep por ttl/expira/dedup/obsolet nos arquivos de definição: zero ocorrências). `_index/sessions.md` e `_decisions/` crescem para sempre por design, o que é aceitável para log, mas o índice (CEREBRO.md) também só cresce, e ele é lido.

A resposta à pergunta do escopo ("a memória reduz custo sem reduzir qualidade?"): **o custo está controlado** (só índices entram automático: ~2.4-3k tokens/sessão somando as camadas; o conteúdo pesado é sob demanda, correto). **A qualidade é o risco**: memória desatualizada apresentada como fato é pior que ausência de memória, e hoje há 3 contradições ativas documentadas.

**Correção (sem apagar histórico):**
1. Passo de higiene no `/cerebro salvar`: ao salvar, checar se o CEREBRO.md passa de 150 linhas e mover excedente para `_index/` (transforma a regra em prosa num passo do fluxo).
2. Adicionar a linha `vault:` real ao CEREBRO.md (conserta o mecanismo documentado) ou remover a instrução do SKILL.md (escolher um; hoje há doc de mecanismo inexistente).
3. Criar `projetos/wizz-method.md` no vault e promover as 4-5 decisões de arquitetura da auto-memória para lá (é a aplicação da hierarquia M4 da parte 1).
4. Convenção de obsolescência barata: fatos voláteis (versão publicada, estado de release) sempre com data no texto e prefixo "em <data>:"; na releitura, o agente trata como snapshot, não como fato. 1 linha no protocolo de memória do CLAUDE.md global.
5. Merge de `feedback_no_narration.md` + `feedback_concise_communication.md` (mesma família, já se auto-referenciam).

### A11. Duplicação de instrução: 21 lugares para a regra de comunicação, e a causa raiz é falta de `include` no resolver

- A regra "não narrar / pausar no importante / resumo curto" existe em **21 lugares**: 15 cópias byte-idênticas (311B cada) nos `customize.toml`/overrides, + 5 paráfrases (token-economy.md, hook session-rules.js, MEMORY.md global, 2 arquivos de feedback) + a variante do SessionStart.
- A regra ECONOMIA (graphify → cerebro → grep → Read) já driftou: **5 variantes textuais** entre as 15 cópias (com/sem "offset/limit", com/sem prefixo WIZZ, verbosidades diferentes).
- O template de ENCERRAMENTO (✅/➡️/🎯/💾) foi reescrito à mão em 9 agentes, com 4 formulações distintas (173B a 327B).
- **Causa raiz técnica**: `resolve_customization.py` (238 linhas) não tem mecanismo de include/extends/shared. Não existe forma de um `customize.toml` referenciar um bloco comum; copiar texto é a única opção. O `_shared/token-economy.md` existe justamente para ser fonte única e **nenhum dos 15 toml o referencia**.
- Nota de custo honesta: as 15 cópias não se somam num mesmo request (só 1 agente ativa por turno). O desperdício real é **manutenção e drift** (15-21 pontos de edição para mudar 1 regra), não tokens por pedido. O que se soma verticalmente num pedido roteado já está dentro dos ~14.1k medidos na parte 1.

**Correção:** adicionar chave opcional `include = ["_shared/communication-rules.md"]` ao `resolve_customization.py` (aditivo, não quebra quem não usa; coberto pelo `test:hooks`); criar `_shared/communication-rules.md` com a linha COMUNICAÇÃO + template de ENCERRAMENTO parametrizado; trocar as 15 cópias por include + 1 linha específica do agente. Elimina ~4.3KB idênticos + ~6.3KB de "mesma ideia, texto diferente" e reduz o ponto de edição de 15 para 1.

### A12. Subagentes e party-mode trabalham cegos (perda de contexto sistêmica) e repagam skills inteiras

- `wizz-party-mode/references/mode-subagent.md:13` admite: o subagente só vê a mensagem do usuário + o que o orquestrador passar; **nenhuma instrução manda incluir o contexto do cerebro no brief**. Mesmo gap em `mode-agent-team.md` e, num mecanismo multi-agente separado, em `swarm-orchestrator.md:350` ("they do not inherit lead conversation"). Dois sistemas diferentes, mesmo buraco: é padrão sistêmico, não bug isolado.
- `swarm-orchestrator.md:196`: skills são injetadas **inteiras** no contexto de cada subagente (full content, not references). Cada subagente novo repaga o corpo completo de qualquer skill, mesmo que o pai já a tenha pago. É uma duplicação de custo (não de texto-fonte) que nenhuma dieta anterior tocou.

**Correção:** (1) 1 linha nos 3 arquivos de referência: "inclua no brief de cada subagente um resumo de 3 linhas do `/cerebro ver` + decisões já tomadas na cadeia" (é o mesmo protocolo de handoff do A2 da parte 1, estendido ao multi-agente); (2) para o custo de skill repaga: instruir o orquestrador a passar só a seção relevante da skill no brief quando o subagente tem tarefa estreita (progressive disclosure no spawn). Nenhuma capacidade se perde; muda o que é enviado, não o que existe.

---

## C. Achados MÉDIOS

### M11. `skills-registry.yaml` é ponto único de falha com degradação silenciosa
`ui.js:476-484` (`_loadSkillsRegistry`) engole qualquer erro de parse com `catch { return null; }` sem logar. Um YAML corrompido faz seleção de áreas, MCPs e CLIs voltarem vazias sem nenhum aviso; o usuário só vê "não apareceu nada para escolher". O mesmo arquivo alimenta roteamento E instalação: corrupção degrada os dois sistemas ao mesmo tempo, sem alarme. **Correção:** logar warning com a mensagem do parse error (3 linhas); 1 teste com YAML inválido.

### M12. Conflito de `id` de MCP entre áreas é resolvido silenciosamente (primeiro vence)
`mcp-config.js:41-60`: se duas áreas declararem o mesmo `id` com `server` diferente, o primeiro processado vence sem warning (o teste existente só cobre o caso de servers idênticos). Hoje nenhum id se repete, mas é exatamente o tipo de colisão que aparece quando o catálogo cresce. **Correção:** comparar `server` no merge; divergência = warning + teste.

### M13. `resolveBinPath` não cobre o fallback `pip install --user` no macOS
A cadeia de install do scrapling termina em `pip install --user`, que no macOS instala em `~/Library/Python/X.Y/bin`, não em `~/.local/bin` (único path fixo tentado além de `command -v`). Cenário real: instalação bem-sucedida, MCP descartado como "não encontrado". **Correção:** adicionar o path do macOS à lista de candidatos de `resolveBinPath` (`mcp-config.js:121-134`).

### M14. Assimetria de robustez entre os pipelines de MCP e de CLI
MCPs com `setup:` passam por DETECT→INSTALL→POST_INSTALL→VERIFY→RESOLVE antes de gravar config; CLIs (`cli-config.js`) só rodam `check` e `install`, sem re-verificação pós-install. Para ferramentas clone-and-run (buttercut, voicebox, arcads), "instalado" significa só "git clone funcionou": as dependências pesadas (ffmpeg, WhisperX, Ruby, Python 3.10+) vivem só em prosa no `when:` e a mensagem final "instalados: buttercut" é enganosa. **Correção:** permitir bloco `verify:` opcional nas entradas de CLI (reaproveitando a lógica do mcp-config, que o comentário do próprio cli-config.js já cita como irmão) e rodá-lo pós-install; para as clone-and-run, o verify pode ser o check de deps mínimas (ex: `command -v ffmpeg`).

### M15. Ferramentas internas com lógica triplicada e allowlist que apodrece
- `walkFiles` + skip-dirs reimplementado de forma divergente em `validate-method-refs.js` e `validate-file-refs.js`; `parseFrontmatter` reimplementado em `validate-method-refs.js` e 2x em `validate-skills.js`. Três validadores, três versões do mesmo walk.
- `installer.js` tem dois parsers de CSV convivendo (manual `parseCSVLine`/`escapeCSVField` nas linhas 1742-1786 e `csv-parse/sync` nas 543/592).
- `validate-method-refs.js:35-54`: allowlist hardcoded de tokens de CLI/MCP é **unida** aos ids do registry, nunca podada. CLI removida do registry continua "válida" para sempre; o validador perde a capacidade de pegar referência morta. Viola a fonte única que o registry declara.
**Correção:** extrair `tools/lib/` (walk + frontmatter), unificar CSV em `csv-parse/sync`, e derivar a allowlist do registry (com lista extra mínima só para tokens genuinamente fora dele, comentada item a item).

### M16. context7 pago em dobro (servidor duplicado + regra redundante)
Confirmado ao vivo: `context7` e `plugin:context7:context7` carregados simultaneamente com as mesmas 2 tools (4 definições no contexto), e `~/.claude/rules/context7.md` (1.3KB, sempre ativo) repete quase textualmente as instruções que o próprio MCP injeta. O installer não detecta context7 já provido por plugin antes de oferecer o seu. **Correção:** remover 1 dos 2 servidores da config da máquina + deletar `rules/context7.md` (é a única duplicação da auditoria que se resolve por exclusão pura); no installer, checar config global do cliente antes de recomendar context7.

### M17. Instruções sobre o RTK repetidas em ~20 lugares (~5.3KB)
RTK.md + CLAUDE.md + token-economy.md + wizz-router SKILL.md + 16 customize/overrides repetem "RTK reescreve shell automaticamente". Mesma classe de desperdício que o rtk existe para resolver, replicada pelo próprio framework. **Correção:** resolve junto com A11 (a linha vira parte do `_shared/communication-rules.md`/token-economy incluído por referência).

### M18. Imposto fixo por sessão: ~9.4KB (~2.360 tokens) antes de qualquer pedido
CLAUDE.md global (2.857B) + RTK.md (964B) + MEMORY.md global (2.097B) + rules/core.md (1.885B) + rules/context7.md (1.308B) + SessionStart hook (323B). Em projeto com CLAUDE.md típico (ex. MeJu, 12.5KB) o fixo sobe para ~5.475 tokens. Não é escandaloso, mas 1.3KB somem de graça com o M16, e o hook UserPromptSubmit soma ~200-230B **por turno** roteável (não por sessão), o que em sessões longas supera o custo do SessionStart. **Correção:** M16 + revisar se a mensagem do UserPromptSubmit pode ser mais curta (hoje repete a instrução completa a cada prompt; uma versão de 1 linha após o primeiro turno manteria o enforcement).

### M19. `graphify/SKILL.md`: boilerplate Python repetido 7x dentro do maior SKILL.md do catálogo
O mesmo bloco de carregamento de estado (`json.loads(Path('graphify-out/...').read_text())`) aparece 7x entre os Steps 4-9 (~1.1KB). Já era o pior caso do M9 da parte 1 (51KB); este é um fator concreto. Nota honesta do levantamento: nos outros monólitos (humanizer, impeccable, marketing-psychology, decision-maker) **não** há redundância literal; são catálogos legítimos de itens distintos. O fatiamento deles é progressive disclosure (M9), não deduplicação. **Correção:** no graphify, definir o bloco 1x no Step 4 e referenciar nos demais.

### M20. Portabilidade: `check:`/`install:` do registry são POSIX-only sem gate de plataforma
`test -d`, `ls`, `grep -qi`, `$HOME` em claude-video, voicebox, arcads e distribb; `command -v` no `resolveBinPath`. Em Windows nativo (cmd.exe, sem WSL/Git Bash), esses checks sempre falham e o usuário é eternamente convidado a reinstalar coisas já instaladas. O contraste interno prova que o time sabe fazer certo: `python-check.js` e `wsl-node-check.js` são exemplares em detecção cross-platform. Só `buttercut` declara `platform:`. **Correção:** (a) barata: declarar `platform: darwin-linux` (ou equivalente) nas entradas POSIX-only, para o installer nem oferecê-las onde o check não roda; (b) completa: rodar checks via Node (`fs.existsSync` com `os.homedir()`) em vez de shell string. A opção (a) é honesta e imediata; (b) quando houver demanda Windows real.

### M21. `check:` do claude-video testa diretório com nome de outro pacote
`skills-registry.yaml:138` testa `$HOME/.claude/skills/watch` para um CLI chamado `claude-video`. Se o nome interno upstream mudar, a detecção quebra silenciosamente (era o baixo D4 da parte 1; confirmado como risco real de detecção). **Correção:** verificar o diretório real pós-install e comentar no registry por que o nome difere.

### M22. `.mcp.json` fica órfão no uninstall (design correto, contrato não documentado)
`installer.js:350-353`: `.mcp.json` fica fora do manifest por design (não apagar config do usuário), mas a consequência (entradas geradas pelo wizz-method sobrevivem ao uninstall e exigem limpeza manual) não está em doc nenhum. **Correção:** nota no output do uninstall listando as entradas que permaneceram + 1 parágrafo no doc de install.

---

## D. Achados BAIXOS

1. `find-skills/SKILL.md:163-172`: exemplos de `claude mcp add` sem pin (`@latest`, sem versão), contradizendo a disciplina do registry. Corrigir os exemplos (são o template que o usuário copia).
2. Naming confuso no installer: `cli-utils.js` (banner/logo) vs `modules/cli-config.js` (CLIs externas). Renomear `cli-utils.js` para `banner.js` ou similar.
3. `selectClis`/`selectMcps` e o parsing de `--clis`/`--mcps` (`ui.js:551-670`) sem nenhum teste direto (Set operations + branch de erro). Adicionar casos em `test-installation-components.js`.
4. Scripts npm órfãos (uso manual apenas, ok, mas documentar): `sync:global`, `rebundle`, `docs:dev`, `docs:preview`; aliases duplicados `wizz:install`/`install:wizz`.
5. Não há doc "como adicionar uma CLI nova" (nem no CONTRIBUTING nem no README do installer); o único lugar é comentário no registry. Entra no checklist de governança da parte 1 (seção H.2).
6. Dependência de `git`/`curl` no PATH não é checada antes dos installs; a falha ecoa stderr cru em vez de "instale o git primeiro".
7. `memlog.py` documenta explicitamente não ter lifecycle/compactação; ok para o uso atual, registrar como limitação conhecida.
8. Timeout ausente no bloco do rtk-rewrite.sh no settings.json (parte 1, M3) segue pendente; incluir no C4.

---

## E. O que foi verificado e está SAUDÁVEL

- **Pipeline de MCP com `setup:`** (scrapling): DETECT→INSTALL→VERIFY→RESOLVE antes de gravar; entrada que falha é descartada e **nunca** gera `.mcp.json` inválido; escrita é aditiva por id e nunca sobrescreve servidor do usuário; JSON inválido preexistente gera erro explícito. Bem coberto por teste (448 linhas).
- **Pins de MCP**: 6/6 MCPs do registry com versão exata e comentário de data. Nenhum secret real: todos placeholders `${VAR}`.
- **CLIs**: opt-in por design, falha nunca aborta o install (comentário de design explícito), gate de plataforma do buttercut funciona, pins de SHA em 3/6 das entradas git.
- **RTK (mecanismo)**: fail-open em 3 camadas, latência 9-40ms, idempotente (`rtk rtk` não acontece), guardas corretos para subshell/if/for e comandos destrutivos (não toca `rm -rf`, `git reset --hard`), recovery 99.9% quando o parse falha.
- **agent-browser vs Playwright**: além da prosa, o enforcement real é técnico (`settings.json` desabilita o plugin playwright inteiro), que não drifta e custa zero token.
- **Memória (custo)**: só índices entram automático; conteúdo pesado é sob demanda. A arquitetura de leitura está certa; o problema é higiene de escrita (A10).
- **CJS/ESM**: convenção limpa por extensão em `tools/`; sem problemas.
- **Skills grandes**: a hipótese de "exemplos redundantes em massa" foi testada e **rejeitada**; os catálogos grandes são cobertura legítima, não repetição (exceto graphify, M19).

---

## F. Fluxo de contexto: avaliação consolidada

Complementando a parte 1 (que mediu a cadeia vertical em ~14.1k tokens):

1. **Horizontal (por sessão)**: ~2.4k tokens fixos de índices e regras, dos quais ~1.3k são elimináveis sem perda (M16). Saudável no geral.
2. **Vertical (por pedido roteado)**: a mesma instrução de economia é reafirmada ~5x dentro de uma cadeia (CLAUDE.md → router → maestro → agente → cerebro). Não é custo novo além do medido, mas é onde o A11 corta.
3. **Lateral (multi-agente)**: o pior gap. Subagentes não herdam cerebro nem decisões da cadeia (A12) e repagam skills inteiras. É simultaneamente perda de contexto importante E excesso de contexto (skill full-content para tarefa estreita).
4. **Temporal (entre sessões)**: memória com contradições ativas (A10); o contexto que atravessa sessões é o menos confiável dos quatro eixos hoje.

Prioridade de correção nessa ordem: lateral (A12), temporal (A10), vertical (A11), horizontal (M16/M18).

---

## G. Preservação do conhecimento

Checagem explícita: nenhuma recomendação desta parte remove referência técnica, estratégia ou capacidade. Os pontos onde haveria tentação de cortar e a alternativa preservadora adotada:

- MP3/fontes do huashu-design e canvas-design: lazy download (parte 1, A5), não remoção.
- Monólitos de skill (humanizer, impeccable etc.): confirmado que são catálogos legítimos; a recomendação é progressive disclosure (mudar o momento da leitura), nunca poda de conteúdo.
- MCPs órfãos (scrapling/supabase/exa): a recomendação é **adicionar** instrução de uso, não remover os MCPs.
- Supabase read-only: capacidade de escrita preservada a 1 edição consciente de distância.
- Duplicações de instrução: consolidação por referência (include), com o texto canônico mantido integral em `_shared/`.
- Memória: nada de apagar histórico; higiene é mover excedente de índice para `_index/` e promover decisões para a camada correta.

---

## H. Arquitetura de software (princípios clássicos)

- **SRP/coesão**: violado nos 3 god files do installer (`ui.js` 2.287 linhas/5+ responsabilidades, `installer.js` 1.789/27+ métodos, `official-modules.js` 2.229), contra o teto de 800 das próprias regras. Já apontado na parte 1 (M7); esta parte adiciona o plano concreto de extração (fachadas `ModuleSelectionUI`/`DependencySelectionUI`/`DirectoryUI`/`ChannelGateUI`; `CsvManifestIO`/`SkillDirCleanup`/`UserFileBackup` no core) mantendo API pública.
- **DRY**: as violações têm causa raiz identificável: falta de `include` no resolver de customização (A11) e falta de `tools/lib/` compartilhada (M15). Corrigir a causa, não as cópias uma a uma.
- **Baixo acoplamento**: o contrato UI↔Installer é implícito (`{toWrite, toRecommend}`/`{toInstall, ...}` sem typedef/schema; cada arquivo redocumenta a forma em comentário). Um JSDoc typedef compartilhado formaliza sem runtime cost.
- **OCP/extensibilidade**: o padrão registry-driven é o ponto forte (nova skill/MCP/CLI = entrada YAML, sem tocar código). Exceções que quebram isso: allowlist hardcoded do validador (M15) e ausência de `verify:` para CLIs (M14).
- **Composição**: `cli-config.js` e `mcp-config.js` (funções puras, exec injetado, bem testados) são o padrão de referência interno; o restante do installer deveria convergir para ele.
- **Observabilidade**: continua o elo mais fraco (A3 da parte 1: zero trace de roteamento) e esta parte adiciona: degradação silenciosa do registry (M11), drift de versão do rtk invisível (C4), conflito de MCP silencioso (M12). Tema comum: **falhas que não gritam**.
- **Tolerância a falhas**: fail-open consistente e correto (hooks, CLIs, MCPs, rtk). O trade-off é que fail-open sem log é indistinguível de sucesso; a correção nunca é remover o fail-open, é adicionar o aviso.
- **Testabilidade**: excelente onde há injeção (config modules), fraca nos god files e zero nos prompts interativos (`selectClis` sem teste, D3).

---

## I. Escalabilidade

Crescimento previsto vs custo real hoje:

| Adicionar... | Custo hoje | Gargalo |
|---|---|---|
| Nova skill | Entrada no registry + diretório (bom) | Nenhum estrutural; falta só o checklist de PR (parte 1, H.2) |
| Novo agente | SKILL.md + customize.toml + **copiar à mão os blocos COMUNICAÇÃO/ECONOMIA/CEREBRO/ENCERRAMENTO** | A11: cada agente novo adiciona +1 cópia a manter; com include, vira 1 linha |
| Novo MCP | Entrada YAML com pin (bom) | M12 (colisão de id silenciosa) e A9 (nada força a instrução de uso no agente dono) |
| Nova CLI | Entrada YAML (bom) | M14 (sem verify), A8 (nada força pin), M20 (nada valida portabilidade do check) |
| Nova área | Fatia no registry + agente | Herda os custos de "novo agente" |
| Novo módulo customizável | wizz-modules.yaml | Risco latente sem guarda de config entre módulos (só 1 módulo customizável existe hoje; nenhum teste cobre o segundo) |
| Novo mecanismo multi-agente | party-mode e swarm já divergem | A12 mostra que cada mecanismo novo re-cria o mesmo gap de handoff; o protocolo de handoff (parte 1, F.3) deveria ser doc compartilhado que todo mecanismo referencia |

Conclusão: o eixo skill/MCP/CLI escala bem (registry-driven). O eixo **agente** e o eixo **mecanismo multi-agente** escalam mal, e ambos pela mesma razão: convenções replicadas por cópia em vez de por referência. As correções A11 + protocolo de handoff compartilhado resolvem os dois sem refatoração grande.

---

## J. Compatibilidade entre ambientes

- **macOS (ambiente real do usuário)**: funciona; único gap é o M13 (path do pip --user).
- **Linux**: equivalente ao macOS para tudo que importa; `~/.local/bin` até funciona melhor no resolveBinPath.
- **Windows nativo**: quebrado para os `check:` POSIX de 4 CLIs (M20) e para o `command -v` do resolveBinPath; o hook rtk exige bash+jq. O installer em si é portável (`os.homedir()` usado consistentemente; `python-check.js` trata win32 explicitamente). Recomendação: declarar suporte oficial "macOS/Linux/WSL" e gate de plataforma nas entradas POSIX até existir demanda Windows nativa real.
- **WSL**: bem tratado (o `wsl-node-check.js` detecta ativamente o cenário Node-do-Windows-no-WSL, com paths UNC e env vars; é o melhor código de portabilidade do repo).
- **Docker/CI**: `--yes`/não-interativo já existe e nada é escrito em modo CI (MCPs viram recomendação), o que é o comportamento certo. `$HOME/.claude/skills` em container efêmero zera entre runs (esperado, mas nenhum doc cobre). O teste de mcp-config mocka todo exec, então a suíte nunca exercita shell real: um job de CI em container Linux rodando 1 install de fumaça de ponta a ponta cobriria o gap mais barato.

---

## K. Auditoria de automações: MCP do n8n

**Recomendação: não integrar como MCP do framework (nem obrigatório, nem opcional default). Sob demanda por projeto, fora do registry, apenas se o projeto do usuário já usa n8n.**

Racional baseado nas características do framework:

1. **Natureza da carga de trabalho.** O wizz-method é metodologia de dev-time: triagem, orquestração de agentes, skills de conhecimento, instalação de ferramentas. As tarefas repetitivas reais do framework identificadas nesta auditoria (sync:global, changelog, publish, evals, validações, limpeza de deploys) são **determinísticas e disparadas por eventos de git**, o habitat natural de npm scripts + GitHub Actions (que o repo já usa), com custo zero de tokens e zero infraestrutura nova. n8n não faz nenhuma delas melhor.
2. **Custo de contexto permanente por benefício esporádico.** Um MCP de n8n expõe dezenas de tools (workflows, execuções, credenciais, nodes). Esse é exatamente o perfil de MCP que a arquitetura do framework evita: tool definitions pagas em toda sessão da área para uso ocasional. Contradiz a dieta de tokens que é tema central das duas auditorias.
3. **Superfície de secrets.** n8n centraliza credenciais de N serviços (Meta, e-mail, CRMs). O C5 desta parte mostra que o framework ainda está amadurecendo a gestão dos 4 secrets que já tem. Adicionar um hub de credenciais de terceiros agora amplia o blast radius na direção errada.
4. **Dependência operacional nova.** n8n exige servidor rodando (self-hosted ou cloud pago). Todo o resto do framework é local e stateless por design (fail-open, opt-in, nada de serviço residente). Seria o primeiro componente com uptime próprio, monitoramento próprio e modo de falha próprio: um ponto único de falha novo para um framework que esta auditoria já criticou por falhas silenciosas.
5. **Onde n8n faria sentido (e como fazer sem MCP no registry).** As áreas growth/ads/social têm automações genuínas de runtime de negócio (agendar posts, coletar métricas de campanha, alimentar relatórios). Mas isso é automação **do projeto do cliente**, não do framework. Se um projeto específico já roda n8n, o caminho certo já existe no próprio framework: o protocolo de skill/MCP faltante do router (`find-skills` → proposta → confirmação do usuário), adicionando o MCP do n8n **àquele projeto** via `.mcp.json` local, com pin e escopo mínimo. O registro no framework não é necessário nem desejável.

**Alternativas que cobrem os mesmos ganhos:**
- Automação do repo: GitHub Actions (já existe; as correções C3/A8 aumentam a cobertura) + `release-please`/`changesets` para changelog (parte 1, H.4).
- Tarefas recorrentes pessoais: o Claude Code já tem agendamento nativo (rotinas/cron) sem servidor novo.
- Integrações de marketing por área: os MCPs/CLIs especializados já existentes (meta-ads, arcads, distribb) cobrem os casos com escopo menor e pin.

Gatilho para rever esta decisão: se 2+ projetos Wizz reais passarem a rodar n8n em produção, aí vale criar entrada opt-in (`defaultSelected: false`) na área growth com `when` restritivo, seguindo o padrão do registry.

---

## L. Casos extremos (consolidado)

| # | Cenário | Comportamento hoje | Correção |
|---|---|---|---|
| 1 | Comando Bash multi-linha | rtk reescreve só a 1ª linha; saída mista sem aviso | C4.3/C4.4 |
| 2 | `skills-registry.yaml` corrompido | Pickers voltam vazios, sem nenhum aviso | M11 |
| 3 | Dois MCPs com mesmo id e server diferente | Primeiro vence silenciosamente | M12 |
| 4 | scrapling instalado via pip --user no macOS | Instala com sucesso e é descartado como "não encontrado" | M13 |
| 5 | pre-commit rejeita commit sob rtk | Razão da falha pode não sobreviver ao filtro (sem tee de commit) | C4.5 |
| 6 | rtk desinstalado/ausente | Fail-open correto; aviso só em stderr que o agente pode não ver | Saudável; logar 1 linha visível |
| 7 | Uninstall do wizz-method | Entradas de `.mcp.json` ficam órfãs sem aviso | M22 |
| 8 | Windows nativo | 4 CLIs eternamente "não instaladas"; reoferta infinita | M20 |
| 9 | Memória desatualizada lida como fato | 3 contradições ativas hoje; só aviso genérico de idade | A10.4 |
| 10 | Vault movido de pasta | Descoberta quebra silenciosamente (fallback documentado nunca funcionou) | A10.2 |
| 11 | Subagente do party-mode sem contexto | Trabalha cego ao estado do projeto; retrabalho | A12 |
| 12 | Loop router→maestro→router | Só prevenção instrucional (parte 1, M2); nada novo encontrado, segue válido | M2 (parte 1) |
| 13 | Skill nova cita CLI removida | Allowlist hardcoded nunca poda; validador não pega | M15 |
| 14 | Registry oferece MCP cujo secret não existe no env | Config gravada; falha só no primeiro uso, no cliente MCP | M14 (verify de env var é extensão natural) |

---

## M. Red team (revisor adversarial)

Ataques tentados contra a arquitetura, do mais grave ao menos:

**RT1. "Eu controlo o upstream do rtk."** Tag v0.43.0 pode ser movida à força; o install é `curl | sh` sem checksum; o binário resultante reescreve **todo comando shell** da máquina com `permissionDecision: allow`, ou seja, herda aprovação automática. E o check nunca compara versão, então uma máquina comprometida ou desatualizada é indistinguível de uma saudável. É o ataque de maior impacto viável contra esta stack. Mitigação: C4 (checksum + verificação de versão + hook versionado no repo). Impacto: crítico. Custo da defesa: baixo.

**RT2. "Eu controlo um dos 3 repos de CLI sem pin."** `npx skills add` de HEAD (hyperframes, claude-video, distribb) = código arbitrário do terceiro executado na máquina do usuário na instalação, sem nenhuma inspeção. Somado ao A4 da parte 1 (6 módulos bmad-code-org como wizz-org), a superfície de terceiros não-pinados é maior do que o comentário "Pin de supply chain" do registry sugere. Mitigação: A8. Impacto: alto. Custo: baixo.

**RT3. "Eu roubo 1 env var e opero a conta."** `SUPABASE_ACCESS_TOKEN` = SQL arbitrário na conta inteira (sem read-only default); `META_ACCESS_TOKEN` = gasto de ads via um pacote comunitário E uma CLI clone-and-run. A parte anterior da auditoria (jun/2026) já achou tokens no env global do shell; a arquitetura atual ainda concentra poder demais por variável. Mitigação: C5 + escopo mínimo por token. Impacto: alto. Custo: baixo.

**RT4. "Eu envenenho a memória."** Qualquer sessão escreve na auto-memória e no Cérebro sem validação; as camadas se contradizem e nada verifica consistência; memórias são recuperadas como contexto factual em toda sessão futura. Um dado errado gravado uma vez (as 3 versões de npm provam que acontece sozinho, sem atacante) propaga por semanas. Mitigação: A10 (higiene + datas + promoção consciente entre camadas). Impacto: médio-alto (qualidade, não segurança). Custo: baixo.

**RT5. "Eu quebro 1 arquivo e cego o sistema inteiro."** O registry é SPOF com catch silencioso (M11); o rtk-rewrite.sh tem checksum próprio mas nada o verifica no fluxo do framework; a tabela flat do router já provou (C1 da parte 1) que um arquivo de referência quebrado opera em produção por dias sem alarme. Padrão sistêmico: **degradação silenciosa é o modo de falha default do framework**. A defesa transversal mais barata é a mesma da parte 1 (A3): trace/warning opt-in em toda decisão e todo fallback. Impacto: médio. Custo: baixo.

**RT6. "Eu abuso da confiança entre camadas de prosa."** As garantias mais citadas (agent-browser nunca Playwright, dispatch 2+ áreas, não narrar) vivem majoritariamente em prosa replicada; a única com enforcement técnico é a do Playwright (plugin desabilitado no settings.json). Prosa drifta (5 variantes da ECONOMIA já em circulação). Direção correta: sempre que uma regra puder virar trava técnica barata (include único, teste de CI comparando cópias, plugin off), preferir a trava. Mitigação: A11 + A1 (parte 1). Impacto: médio. Custo: baixo-médio.

**RT7. Decisões frágeis questionadas e sustentadas.** (a) "Fail-open em tudo" sobrevive ao questionamento: a alternativa (fail-closed) quebraria o fluxo do usuário por falha de otimização; a correção certa é logar, não fechar. (b) "CLIs recommend-only por default" sobrevive: instalar pesado sem opt-in seria pior. (c) "`.mcp.json` fora do manifest" sobrevive com ressalva de documentação (M22). (d) "6 MCPs para 9 áreas, 3 áreas sem MCP" sobrevive: é parcimônia correta, não lacuna; a área qa recusar MCP de browser é decisão explícita e boa.

---

## N. Priorização (impacto × risco)

**Onda 1: imediato, baixo risco, alto impacto**
1. Atualizar rtk para o pin + check com versão mínima + hook versionado em tools/hooks + timeout no settings (C4)
2. `--read-only`/`--project-ref` no MCP supabase + nota de confiança no meta-ads (C5)
3. Pinar hyperframes/claude-video/distribb + checksum do install.sh do rtk (A8)
4. `validate:refs` e `validate:skills` no gate automático + corrigir AGENTS.md (A8)
5. Remover `rules/context7.md` + resolver context7 duplicado (M16)
6. Warning no catch do `_loadSkillsRegistry` (M11)
7. Instrução de MCP nos toml de growth/architect/analyst + remover playwright da tabela flat + SCAN_ROOTS ampliado (A9)

**Onda 2: estrutural, risco moderado**
8. `include` no resolve_customization.py + `_shared/communication-rules.md` + colapsar as 15 cópias (A11, resolve M17 junto)
9. Handoff de contexto no party-mode/swarm (3 linhas) + progressive disclosure no spawn (A12)
10. Higiene do Cérebro: passo de compactação no /salvar, linha `vault:`, projetos/wizz-method.md, convenção de datas (A10)
11. `verify:` opcional para CLIs + check de deps das clone-and-run (M14)
12. `tools/lib/` compartilhada + allowlist derivada do registry + CSV único (M15)
13. Warning em colisão de id de MCP (M12) + path pip macOS (M13)
14. Gates de plataforma nas CLIs POSIX-only (M20)

**Onda 3: evolução contínua**
15. Fatiamento do installer conforme plano de extração da seção H (M7 da parte 1, agora com mapa)
16. Dedup do graphify (M19) junto com o M9 da parte 1
17. Nota de uninstall do .mcp.json (M22) + baixos da seção D
18. Job de CI com install de fumaça em container Linux (seção J)
19. Reavaliar n8n apenas se o gatilho da seção K acontecer

---

## Anexo 1: inventário consolidado de MCPs

| MCP | Área | Pin | Secret | Setup | Instrução de uso em agente? | Avaliação |
|---|---|---|---|---|---|---|
| magic (21st.dev) | designer | 0.1.0 | MAGIC_API_KEY | não | Sim (2 skills-porta) | Saudável; concentração de risco num provedor único das 2 skills de maior tráfego |
| scrapling | growth | 0.4.10 | nenhum | completo (referência do repo) | **Não** (órfão) | Melhor pipeline, pior adoção |
| meta-ads | ads | 1.0.0 | META_ACCESS_TOKEN | não | Sim (modelo a seguir) | Pacote comunitário + token de gasto (C5) |
| supabase | architect | 0.8.2 | SUPABASE_ACCESS_TOKEN | não | **Não** (órfão) | Sem read-only default (C5) |
| exa | analyst | 3.2.1 | EXA_API_KEY | não | **Não** (órfão) | Baixo risco, baixo uso |
| context7 | cross-cutting | 3.2.2 | nenhum | não | Sim | Duplicado na máquina (M16) |

Fantasmas (citados sem registro): Stitch (hard dep do react-components), shadcn/ui (soft), playwright (tabela flat, contradiz doutrina), v0-platform (histórico, documentado como removido).

## Anexo 2: inventário consolidado de CLIs externas

| CLI | Área | Pin | Verificação pós-install | Gate plataforma | Risco principal |
|---|---|---|---|---|---|
| hyperframes | designer | **nenhum** | não | não | A8 |
| claude-video | designer | **nenhum** | não (check testa dir `watch`) | não | A8 + M21 |
| buttercut | designer | SHA | não (só `test -d`) | darwin-arm64 ✓ | deps pesadas não checadas (M14) |
| voicebox | designer | SHA | não | não | M14 |
| arcads | ads | SHA | não | não | token compartilhado com meta-ads (C5) |
| distribb | seo | **nenhum** | não | não | A8 |
| rtk | cross-cutting | tag v0.43.0 (instalado: 0.30.1) | check não compara versão | não | C4 |
| agent-browser | qa | npm 0.27.0 exato | `--version` ✓ | não | melhor pin da lista |

## Anexo 3: números-chave desta parte

| Métrica | Valor |
|---|---:|
| Imposto fixo por sessão (índices + regras sempre carregados) | ~9.4KB ≈ 2.360 tokens |
| Idem em projeto com CLAUDE.md típico | ~21.9KB ≈ 5.475 tokens |
| Cópias da regra de comunicação | 21 (15 idênticas + 6 variantes) |
| Variantes drifted da regra ECONOMIA | 5 |
| Cópias de instrução sobre RTK | ~20 (~5.3KB) |
| Economia real do rtk neste projeto | 72.1% (690K de 957K tokens) |
| Economia global do rtk (distorcida por outliers de grep) | 99.0% (582.5M) |
| MCPs no registry / com instrução de uso em agente | 6 / 3 |
| CLIs externas / com pin forte | 8 / 4 |
| Falhas de parse do rtk com recovery | 99.9% (4.868 casos) |
