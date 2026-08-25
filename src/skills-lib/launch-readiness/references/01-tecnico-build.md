# Área 01 · Técnico / Build / Erros

Checa se o projeto sobe, roda e se comporta como código de produção. Não é code review de arquitetura (isso é `wizz-code-review` / `adversarial-reviewer`): aqui é "isso quebra no ar?".

## Checagens objetivas

1. **Build limpo.** Rode o build de produção do projeto (`npm run build` ou equivalente). Qualquer erro é 🔴. Warning de build que aponta comportamento quebrado em produção (ex.: variável de ambiente ausente, import quebrado) é 🟠.
2. **Type check e lint verdes.** Erro de tipo é 🟠 (não bloqueia sempre, mas indica bug real na maioria dos casos); lint com regra de erro (não só estilo) é 🟠.
3. **Testes passando.** Suíte de testes existente rodando vermelha é 🔴 se cobre fluxo crítico (pagamento, cadastro, auth), 🟠 caso contrário. Ausência total de testes não é achado desta skill (é decisão de produto já tomada); registre como 🟡 observação, não invente cobertura.
4. **`console.log` e `debugger` em código de produção.** Presença em rota/componente que roda em produção é 🟡 (vaza informação em log de cliente/servidor, mas raramente quebra o produto).
5. **Variáveis de ambiente sem fallback silencioso perigoso.** Uma env var crítica (chave de API, DSN, secret) sem valor e sem erro explícito no boot é 🔴 se o app sobe mesmo assim mascarando a falha (ex.: pagamento processa sem gateway configurado). Se o app falha alto e explícito no boot, não é achado.
6. **Rotas/páginas quebradas.** Navegue (ou leia o roteamento) pelas páginas públicas principais listadas no `project-context.md` ou inferidas do roteador; 404/500 em página que deveria existir é 🔴. Link interno morto é 🟠.
7. **Dependências com vulnerabilidade conhecida de severidade alta/crítica.** Rode o audit de dependências do gerenciador de pacotes do projeto. Alta/crítica em pacote de produção é 🟠 (aponte `database-and-deps` como executor); dev-only é 🟡.
8. **Performance básica de carregamento.** Se existir métrica de Core Web Vitals já coletada (ferramenta do projeto, relatório de build), LCP/CLS ruim em página crítica é 🟡 e aponta `seo-audit` como aprofundamento; não meça do zero aqui, isso é escopo de `seo-audit`.

## Regra de corte

Sem rodar o build de verdade (ou ler o resultado do último CI verde/vermelho), não dê veredito de "🟢 build ok": marque como PENDÊNCIA DE VERIFICAÇÃO e explique o que faltou rodar. Não estime "provavelmente builda" sem evidência.

## Formato de saída

```
| # | Item | Onde (arquivo/rota) | O que falta ou está errado | Severidade | Executor da correção |
```

Sem achado que passe na régua: responda só `NENHUM ACHADO NESTA ÁREA`.
