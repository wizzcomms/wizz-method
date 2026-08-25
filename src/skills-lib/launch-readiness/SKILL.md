---
name: launch-readiness
description: >
  Auditoria de prontidão pra lançamento (Pre-launch Audit), multi-área: técnico/build, segurança,
  SEO/descoberta, analytics/medição, conteúdo/copy/prova social, legal/LGPD, infra/deploy/rollback.
  Gate por estágio: só roda de verdade em pré-lançamento/lançamento (stage mvp/production no
  project-context.md); em descoberta/ideação, recuse com explicação. Use quando o pedido for "tá
  pronto pra lançar?", "auditoria de pré-lançamento", "checklist de release amplo", "o que falta
  antes de ir pra produção", considerando o projeto inteiro (não só o site). Saída: diagnóstico
  priorizado por severidade (vermelho bloqueia launch, laranja alto, amarelo médio, verde ok), nunca
  correção cega. Diferente de security-audit-pentest (caça vulnerabilidade com prova de exploração)
  e site-launch-kit (executa as 15 rodadas de UM site): esta DIAGNOSTICA o projeto inteiro e aponta
  o executor certo por achado. Persiste o resultado numa seção datada do project-context.md.
---

# Launch Readiness · Auditoria de Prontidão pra Lançamento

Sete áreas de checagem, cada uma com um passe fechado: escopo único, saída padronizada, régua de corte própria. No fim, um passo de fusão consolida tudo num diagnóstico priorizado e grava o resumo no `project-context.md` do projeto.

Não é skill de construção (isso é `premium-landing-ui-researcher` / `taste-skill` / `wizz-agent-dev`), não é a metodologia de caça a vulnerabilidade (isso é `security-audit-pentest`) e não executa as 15 rodadas corretivas de site (isso é `site-launch-kit`): aqui é diagnóstico amplo, com prioridade, pra decidir se dá pra lançar.

## Gate por estágio (ler ANTES de rodar)

Leia o estágio do projeto: `grep -m1 '^stage:' {project-root}/**/project-context.md` (fail-open, igual ao router/maestro).

- **`mvp` ou `production`:** rode a auditoria completa. É exatamente pra isso que a skill existe.
- **`prototype` ou sem arquivo `project-context.md`:** pare antes de rodar. Responda que o projeto ainda está cedo demais pra uma auditoria de lançamento (nada ou quase nada construído pra auditar) e aponte o caminho certo pra esse estágio: `inicio-de-projeto`, `wizz-forge-idea` ou `decision-maker` pra definir o produto primeiro. Só prossiga se o usuário insistir explicitamente, e nesse caso avise que os achados vão vir cheios de PENDÊNCIA por falta de superfície construída.
- **`maintenance`:** normalmente não é o caso de uso (produto já lançado, rodando). Só faz sentido se o pedido for sobre uma NOVA leva saindo do zero (feature grande, novo produto dentro do mesmo repo): confirme isso antes de rodar; senão, aponte `security-audit-pentest` (pentest periódico) ou o modo "Auditoria 360°" do `wizz-router` (auditoria ampla de codebase já em produção, não é sobre um evento de lançamento).

## Contrato comum (vale para as 7 áreas)

1. **Detecte o terreno lendo o repositório**, não perguntando: stack, onde moram as páginas/rotas públicas, onde ficam variáveis de ambiente, pipeline de deploy, se existe `project-context.md`.
2. **Nunca invente dado de negócio nem status de conformidade.** O que não dá pra verificar no repo (ex.: "o certificado SSL está configurado no provedor?", "o DPO foi nomeado?") vira PENDÊNCIA DE VERIFICAÇÃO MANUAL, nunca um chute de severidade. Não assuma que um arquivo `privacidade.md` está correto só por existir: leia o conteúdo antes de dar 🟢.
3. **Prova concreta por achado.** "Poderia ser melhor" não é achado. Cada linha cita arquivo:linha (ou rota/config específica) e a evidência do que falta ou está errado.
4. **Saída padronizada por área**, tabela markdown, sem texto antes:

```
| # | Item | Onde (arquivo/rota) | O que falta ou está errado | Severidade | Executor da correção |
```

5. **Régua de severidade** (a mesma nas 7 áreas):

| Símbolo | Nome | Critério |
|---|---|---|
| 🔴 | Bloqueia launch | Quebra o produto, expõe dado sensível, ou viola lei/política de plataforma. Não lança com isso aberto. |
| 🟠 | Alto | Não impede o lançamento tecnicamente, mas custa caro logo na primeira semana (perda de conversão, achado de segurança médio, indexação quebrada). Resolver antes ou no dia seguinte ao launch. |
| 🟡 | Médio | Deveria ser resolvido, mas não muda o resultado do lançamento. Vira backlog pós-launch. |
| 🟢 | Ok | Checado e conforme. Sem ação. |

6. **Nunca corrija cego.** O output é diagnóstico. Cada achado aponta o EXECUTOR certo (a skill/CLI que resolve), nunca a correção já aplicada por esta skill.
7. **Uma área por vez** ao investigar, mas rode as 7 em paralelo (subagentes) quando possível: elas são independentes entre si.

## As 7 áreas (rodar em paralelo)

| # | Área | Referência |
|---|---|---|
| 01 | Técnico / build / erros | [references/01-tecnico-build.md](references/01-tecnico-build.md) |
| 02 | Segurança | [references/02-seguranca.md](references/02-seguranca.md) |
| 03 | SEO / descoberta | [references/03-seo-descoberta.md](references/03-seo-descoberta.md) |
| 04 | Analytics / medição | [references/04-analytics-medicao.md](references/04-analytics-medicao.md) |
| 05 | Conteúdo / copy / prova social | [references/05-conteudo-prova-social.md](references/05-conteudo-prova-social.md) |
| 06 | Legal / LGPD | [references/06-legal-lgpd.md](references/06-legal-lgpd.md) |
| 07 | Infra / deploy / rollback | [references/07-infra-deploy-rollback.md](references/07-infra-deploy-rollback.md) |

Depois das 7:

| # | Passo | Referência |
|---|---|---|
| 08 | Fusão e priorização | [references/08-fusao-priorizacao.md](references/08-fusao-priorizacao.md) |
| 09 | Persistência no project-context.md | [references/09-persistencia-project-context.md](references/09-persistencia-project-context.md) |

## Como rodar

1. Confira o gate de estágio (seção acima). Sem `mvp`/`production`, pare ou avise antes de seguir.
2. Detecte quais das 7 áreas se aplicam ao projeto (ex.: projeto sem superfície web pública pode pular a área 03; projeto sem LGPD/dados pessoais pode encurtar a área 06, mas nunca pule sem justificar em 1 linha).
3. Dispare as 7 áreas como subagentes em paralelo, cada um carregando seu prompt de `references/`.
4. Colete as 7 tabelas.
5. Rode o passo 08 (fusão): dedup, ordena por severidade, monta a lista final priorizada com recomendação GO / GO COM RESSALVAS / NO-GO (a skill nunca decide sozinha; é uma leitura dos achados, quem decide é o dono do projeto).
6. Rode o passo 09 (persistência): grava o resumo datado no `project-context.md`.
7. Entregue o diagnóstico consolidado. As 7 tabelas por área ficam como anexo.

## Relação com as outras skills

- **`security-audit-pentest`**: aprofundamento de segurança. A área 02 aqui é uma varredura leve (superfície exposta); achados que precisam de prova de exploração ("como se explora") vão pra `security-audit-pentest`, não são recauchutados aqui.
- **`site-launch-kit`**: quando a superfície do achado é SITE (CTA, prova social, Open Graph, schema local, robots/sitemap, LGPD do site, medição), o executor da correção é `site-launch-kit`. Esta skill não repete as 15 rodadas: só aponta qual rodada resolve o achado.
- **`seo-audit`**: diagnóstico amplo de ranking/tráfego/core web vitals. A área 03 aqui é só indexabilidade básica (o site consegue ser encontrado), não é auditoria de SEO completa.
- **Modo "Auditoria 360°" do `wizz-router`**: auditoria ampla de um projeto já em produção, por área técnica (código, banco, design, growth...), sem o recorte de "estamos prestes a lançar" nem o gate de estágio. Use launch-readiness para o evento de lançamento; use o modo 360° para saúde geral de um projeto maduro.

## O que esta skill NÃO faz

- Não corrige nada sozinha; aponta o executor.
- Não decide GO/NO-GO pelo dono do projeto; entrega a leitura priorizada.
- Não substitui `security-audit-pentest` para segurança profunda nem `site-launch-kit` para execução das 15 rodadas de site.
- Não roda em projeto sem superfície construída (estágio de descoberta/ideação).
