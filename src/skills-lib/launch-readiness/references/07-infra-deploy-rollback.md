# Área 07 · Infra / Deploy / Rollback

Checa se, quando (não "se") algo der errado no dia do lançamento, o time consegue reverter ou recuperar rápido. Ausência de plano de rollback é o achado mais caro desta área: um bug em produção sem caminho de volta vira incidente longo.

## Checagens objetivas

1. **Pipeline de deploy existe e é repetível.** Deploy manual/artesanal sem script/CI para o ambiente de produção é 🟠.
2. **Rollback possível e testado.** Sem nenhuma forma de voltar pra versão anterior (revert de deploy, versionamento de release, feature flag) é 🔴 pra lançamento de risco alto (migração de banco, troca de fluxo de pagamento); 🟠 nos demais casos.
3. **Migração de banco reversível.** Migration que altera/apaga coluna sem plano de reversão, rodando junto do lançamento, é 🔴.
4. **Backup recente e testado.** Sem backup do banco de produção, ou backup nunca restaurado uma vez sequer pra validar que funciona, é 🔴 quando há dado de usuário real em jogo.
5. **Domínio/DNS/SSL apontando pro ambiente certo.** Confirma o achado #7 da área 03 pelo lado de infra: domínio configurado mas TTL alto sem plano de propagação a tempo do lançamento é 🟠.
6. **Paridade de ambiente (staging vs. produção).** Diferença conhecida entre o que foi testado em staging e o que vai pra produção (env var, versão de dependência, feature flag) é 🟠.
7. **Plano de quem responde no dia.** Sem ninguém definido pra monitorar/responder no horário do lançamento (mesmo que informal) é 🟡; sobe pra 🟠 se o lançamento é fora do horário comercial normal do time.
8. **Rate limiting / proteção contra pico na camada de infra.** Ausência de qualquer proteção (CDN, rate limit de borda) num lançamento com pico de tráfego esperado (campanha paga, imprensa) é 🟠.

## Regra de corte

"Rollback existe" só conta se alguém já testou o caminho de volta pelo menos uma vez, não só "em teoria dá pra reverter". Sem essa confirmação, marque PENDÊNCIA DE VERIFICAÇÃO em vez de 🟢.

## Formato de saída

```
| # | Item | Onde (arquivo/rota) | O que falta ou está errado | Severidade | Executor da correção |
```

Sem achado que passe na régua: responda só `NENHUM ACHADO NESTA ÁREA`.
