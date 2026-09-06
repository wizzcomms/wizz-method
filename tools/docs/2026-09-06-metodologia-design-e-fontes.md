# Auditoria da metodologia — 2026-09-06

## Resultado

Corrigidos o dispatch de personas, a dependência do 21st/Magic e os pontos que permitiam tratar uma lista de catálogos como pesquisa de design concluída. O Impeccable local tinha instruções inexequíveis; agora usa procedimentos presentes no pacote.

## Causa do erro wizz-growth

O instalador copia `src/modules/wizz/agents/wizz-growth/SKILL.md` para o diretório de skills. Tipos nativos vêm de `src/modules/wizz/subagents/` e seguem `wizz-exec-*`. Portanto, o erro apresentado é compatível com usar o nome da skill como `subagent_type`; a lista do próprio erro confirma que os executores estavam disponíveis.

A invocação correta da persona é `Skill(skill="wizz-growth", args="<brief de CRO e shard>")`. Para isolamento, o maestro escolhe um executor da lista real e o instrui a carregar a skill de área. Sem executor, pode executar a skill na sessão. Sem a skill, informa a instalação faltante.

Essa distinção segue a [documentação oficial de subagentes](https://code.claude.com/docs/en/sub-agents). Context7 foi consultado antes da revisão. Não foi reproduzida a sessão original do usuário.

## Falhas de design corrigidas

- Registry dizia que `ui-ux-pro-max` puxava as skills de pesquisa, mas seu entrypoint só rodava a busca Python. Agora há dispatch explícito por tipo de trabalho.
- A busca Python consulta CSV local; não busca componentes na web. O fluxo agora distingue diretrizes locais de evidências externas.
- 21st era opcional em um arquivo e obrigatório em outros; havia ainda um checkpoint antigo de v0. Foram removidos das instruções ativas e do registry.
- Pesquisa exigia aprovação repetida e instruía tanto clone automático quanto clone somente após pergunta. O protocolo foi unificado: pesquisar dentro do escopo autorizado, isolar clones quando necessários, preservar caches com mudanças e perguntar por decisões materiais.
- Não havia artefato obrigatório de evidência. Agora são registrados busca, demo, código/registry, revisão/data, licença, dependências, avaliação visual, decisão e limitações.
- Impeccable referenciava scripts via placeholders não resolvidos e uma pasta `reference/` ausente. A adaptação agora contém seus workflows e declara que não inclui o runtime upstream.
- UI/UX Pro Max agora escolhe pesquisa por domínio/stack para tarefas pontuais, verifica relevância e avisa quando `--stack` é ignorado por `--design-system`. Esse último comportamento foi conferido no código local e no update upstream do dia.

## Fontes de skills verificadas

Foram encontrados 72 entrypoints em `src/skills-lib`: 47 associados a 14 repositórios públicos, com todos os 47 caminhos atuais retornando HTTP 200. Outros 25 não tiveram upstream confirmado nesta auditoria; isso não significa que estejam desatualizados.

O [snapshot estruturado](2026-09-06-skill-sources.json) registra caminhos antigos/atuais, revisões e SHA-256 do entrypoint local e remoto. É uma baseline de auditoria, não um lock de conteúdo importado. Diferença de hash pode refletir adaptações Wizz; sem uma revisão original de importação confiável não é possível afirmar que todo diff seja atualização faltante. A data abaixo é a do commit do repositório, não necessariamente de cada skill.

| Fonte | Revisão consultada | Data do commit | Skills mapeadas |
|---|---|---|---|
| [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/commit/5b2c0007766c6a1cf1d53fd8fc73e979e0821022) | `5b2c0007766c` | 2026-09-05 | 32 |
| [vercel-labs/skills](https://github.com/vercel-labs/skills/commit/435076e78988e1e6ec40d00b0b1d76bdbbc5419a) | `435076e78988` | 2026-08-18 | 1 |
| [remotion-dev/skills](https://github.com/remotion-dev/skills/commit/f54682712abc4a68cdc7c41513bd3b3298829873) | `f54682712abc` | 2026-09-05 | 1 |
| [supabase/agent-skills](https://github.com/supabase/agent-skills/commit/8331f910845103c08d51f6ca1d86ebb7d1f745e3) | `8331f9108451` | 2026-08-12 | 1 |
| [google-labs-code/stitch-skills](https://github.com/google-labs-code/stitch-skills/commit/0337446dadde6f8c94210444e2aa9d546126480f) | `0337446dadde` | 2026-08-17 | 2 |
| [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/commit/314307f156aeab0c6b567bbaa1ce4e7aabd5a636) | `314307f156ae` | 2026-09-06 | 1 |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable/commit/831cabee8b4bc1a2b66e5ae22003e9a19b57d464) | `831cabee8b4b` | 2026-09-05 | 1 |
| [alchaincyf/huashu-design](https://github.com/alchaincyf/huashu-design/commit/a790f704d85f277cc93d2081b0840d00036969bb) | `a790f704d85f` | 2026-08-25 | 1 |
| [delphi-ai/animate-skill](https://github.com/delphi-ai/animate-skill/commit/71bc617e7000e69b679549f13ea132e696420d6c) | `71bc617e7000` | 2026-01-28 | 1 |
| [blader/humanizer](https://github.com/blader/humanizer/commit/e2e92e7b4b8229253ed5c8e81dc65463fdeddda5) | `e2e92e7b4b82` | 2026-08-19 | 1 |
| [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser/commit/4726eceeb3274eef34ab082ee04d7288c54dec70) | `4726eceeb327` | 2026-09-06 | 1 |
| [anthropics/skills](https://github.com/anthropics/skills/commit/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f) | `41bbe19d1a1a` | 2026-09-03 | 2 |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill/commit/ccbc15639c97057cbfcf32ecebc38ef716e4bb37) | `ccbc15639c97` | 2026-08-24 | 1 |
| [kylezantos/design-motion-principles](https://github.com/kylezantos/design-motion-principles/commit/4a9ca879f24a361f4dca4174fe2da0f67b5ddee3) | `4a9ca879f24a` | 2026-05-30 | 1 |

### Mudanças que afetam uma atualização automática

- UI/UX Pro Max ampliou a base de dados e mudou o contrato de pesquisa. Foi incorporada a orientação de consultas focadas, inferência de stack e verificação de resultados, além do aviso de stack ignorado. A base CSV e o motor completo não foram substituídos.
- Impeccable upstream está na skill 4.2.1, com um novo runtime nativo. Foi corrigida a adaptação Wizz para funcionar com os arquivos embarcados; não foi instalado esse runtime.
- Marketing consolidou e renomeou várias skills; `page-cro` e `form-cro` convergem em `cro`. Os IDs públicos do Wizz foram preservados para não quebrar registry, handoffs e instalações existentes.
- Remotion e Stitch reorganizaram caminhos. O snapshot registra os endereços atuais.
- Os demais repositórios tiveram sua revisão e entrypoint conferidos; a comparação não constitui revisão integral de todos os scripts, assets e referências upstream.

| ID Wizz preservado | Caminho anterior | Caminho upstream atual verificado |
|---|---|---|
| `ab-test-setup` | `skills/ab-test-setup/SKILL.md` | [skills/ab-testing/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/ab-testing/SKILL.md) |
| `analytics-tracking` | `skills/analytics-tracking/SKILL.md` | [skills/analytics/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/analytics/SKILL.md) |
| `competitor-alternatives` | `skills/competitor-alternatives/SKILL.md` | [skills/competitors/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/competitors/SKILL.md) |
| `email-sequence` | `skills/email-sequence/SKILL.md` | [skills/emails/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/emails/SKILL.md) |
| `form-cro` | `skills/form-cro/SKILL.md` | [skills/cro/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/cro/SKILL.md) |
| `free-tool-strategy` | `skills/free-tool-strategy/SKILL.md` | [skills/free-tools/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/free-tools/SKILL.md) |
| `launch-strategy` | `skills/launch-strategy/SKILL.md` | [skills/launch/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/launch/SKILL.md) |
| `onboarding-cro` | `skills/onboarding-cro/SKILL.md` | [skills/onboarding/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/onboarding/SKILL.md) |
| `page-cro` | `skills/page-cro/SKILL.md` | [skills/cro/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/cro/SKILL.md) |
| `paid-ads` | `skills/paid-ads/SKILL.md` | [skills/ads/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/ads/SKILL.md) |
| `paywall-upgrade-cro` | `skills/paywall-upgrade-cro/SKILL.md` | [skills/paywalls/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/paywalls/SKILL.md) |
| `popup-cro` | `skills/popup-cro/SKILL.md` | [skills/popups/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/popups/SKILL.md) |
| `pricing-strategy` | `skills/pricing-strategy/SKILL.md` | [skills/pricing/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/pricing/SKILL.md) |
| `product-marketing-context` | `skills/product-marketing-context/SKILL.md` | [skills/product-marketing/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/product-marketing/SKILL.md) |
| `referral-program` | `skills/referral-program/SKILL.md` | [skills/referrals/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/referrals/SKILL.md) |
| `schema-markup` | `skills/schema-markup/SKILL.md` | [skills/schema/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/schema/SKILL.md) |
| `signup-flow-cro` | `skills/signup-flow-cro/SKILL.md` | [skills/signup/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/signup/SKILL.md) |
| `social-content` | `skills/social-content/SKILL.md` | [skills/social/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/social/SKILL.md) |
| `remotion-best-practices` | `skills/remotion/SKILL.md` | [skills/remotion-best-practices/SKILL.md](https://github.com/remotion-dev/skills/blob/f54682712abc4a68cdc7c41513bd3b3298829873/skills/remotion-best-practices/SKILL.md) |
| `enhance-prompt` | `skills/enhance-prompt/SKILL.md` | [plugins/stitch-utilities/skills/enhance-prompt/SKILL.md](https://github.com/google-labs-code/stitch-skills/blob/0337446dadde6f8c94210444e2aa9d546126480f/plugins/stitch-utilities/skills/enhance-prompt/SKILL.md) |
| `react-components` | `skills/react-components/SKILL.md` | [plugins/stitch-build/skills/react-components/SKILL.md](https://github.com/google-labs-code/stitch-skills/blob/0337446dadde6f8c94210444e2aa9d546126480f/plugins/stitch-build/skills/react-components/SKILL.md) |

### Upstream não confirmado

`adversarial-reviewer`, `ai-product-design`, `auth-and-secrets`, `caching-and-queues`, `cerebro`, `cloud-and-infra`, `ctc-align`, `database-and-deps`, `database-scaling`, `decision-maker`, `desktop-security`, `implementation-planner`, `infrastructure`, `inicio-de-projeto`, `launch-readiness`, `motion-3d-director`, `pesquisa-de-publico-do-piva`, `premium-landing-ui-researcher`, `security-audit-pentest`, `site-launch-kit`, `tracking-audit`, `ui-component-curator`, `web-security`, `wizz-offer-forge`, `wizz-router`.

Essas skills permanecem locais/adaptadas com origem não confirmada, sem inventar versão ou afirmar que estejam em dia.

## Verificação das fontes de componentes

As seis fontes GitHub abaixo estavam acessíveis. A existência do repositório não garante que todo componente seja adequado nem que sua licença permita o uso pretendido.

| Fonte | Revisão verificada |
|---|---|
| [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits/commit/0e69e737242df1d257b4e5e399b01ae1d7901375) | `0e69e737242d` |
| [nolly-studio/cult-ui](https://github.com/nolly-studio/cult-ui/commit/3b855612fb524cb042cc91b65f0cd575057471cc) | `3b855612fb52` |
| [aliimam-in/aliimam](https://github.com/aliimam-in/aliimam/commit/18ea470daa771363103c2d8c5262dce39725e81c) | `18ea470daa77` |
| [WatermelonCorp/watermellon-registry](https://github.com/WatermelonCorp/watermellon-registry/commit/0099addd50a985bf53bdb81140ab4b72fc0668ce) | `0099addd50a9` |
| [heyfabrika/styleui](https://github.com/heyfabrika/styleui/commit/3da5706548882038f448a8ff4e570680a06b25c4) | `3da570654888` |
| [bklit/bklit-ui](https://github.com/bklit/bklit-ui/commit/c57f66bfa7c3198edb677b567ce08cbf364ae159) | `c57f66bfa7c3` |

Amostragem estática: foram abertos [LiquidChrome do React Bits](https://github.com/DavidHDev/react-bits/blob/0e69e737242df1d257b4e5e399b01ae1d7901375/src/ts-default/Backgrounds/LiquidChrome/LiquidChrome.tsx) e [demo Hero Liquid Metal do Cult UI](https://github.com/nolly-studio/cult-ui/blob/3b855612fb524cb042cc91b65f0cd575057471cc/apps/www/registry/default/example/hero-liquid-metal-demo.tsx). O primeiro importa OGL e CSS próprio; o segundo importa um componente local e usa recursos de shader. Isso demonstra por que a mineração precisa ler o código exato antes de recomendar dependências. O path genérico `LICENSE` retornou 404; a árvore apontou `LICENSE.md`, que foi aberto: React Bits declara MIT + Commons Clause e Cult UI declara MIT. O catálogo foi corrigido para não apresentar a primeira como MIT sem condições adicionais. Não houve execução visual dessas demos nem integração em um app nesta tarefa.

## Aplicação em instalações existentes

O código-fonte e as próximas instalações usam o fluxo corrigido. Esta tarefa não publicou uma versão npm nem atualizou outros projetos ou instalações globais. Para levar as mudanças a um projeto existente, atualize-o a partir deste checkout validado.

O instalador trata `.mcp.json` como configuração compartilhada aditiva: retirar o provider do registry impede novas recomendações/instalações, mas não apaga configurações antigas, credenciais, CLI global ou skills externas já instaladas. Em um projeto com Magic antigo, inspecione seu escopo e remova apenas a configuração explicitamente identificada para desinstalação.

## Próxima conferência de fontes

Use o snapshot como ponto de partida: consulte o HEAD de cada repositório, confira se os caminhos ainda existem e revise os diffs relevantes desde a revisão registrada. Atualize as adaptações com seus IDs Wizz e preserve customizações; não copie automaticamente pacotes que mudaram de runtime, nomes ou licenças. Registre a revisão efetivamente incorporada separadamente da revisão apenas consultada.

## Validação executada

- `npm ci` e `npm run quality`: concluídos com sucesso (formatação, lint, build da documentação, instalação, URLs e referências/skills).
- Testes adicionais: hooks, MCP, CLI, paridade registry/lib e consistência de dispatch passaram.
- Busca Python exercitada em domínio UX e design-system com stack: retornou resultados e emitiu o aviso esperado; não persistiu arquivos.
- Resolução do registry real não oferece Magic/21st. Links internos e placeholders do Impeccable foram checados separadamente, pois o validador principal não cobre integralmente a biblioteca de terceiros.
- Limites preexistentes: o validador reporta um aviso MEDIUM em `wizz-set-feature`; `npm ci` reportou 13 vulnerabilidades no conjunto de dependências. Nenhuma atualização de dependência fora do escopo foi aplicada.
