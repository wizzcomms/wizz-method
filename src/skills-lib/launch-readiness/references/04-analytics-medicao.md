# Área 04 · Analytics / Medição

Checa se o time vai conseguir SABER se o lançamento funcionou. Um lançamento sem medição não é "menos grave", é um lançamento que ninguém consegue avaliar depois: trate ausência de medição em evento-chave como achado sério, não como nice-to-have.

## Checagens objetivas

1. **Ferramenta de analytics instalada e disparando.** Sem nenhum GA4/pixel/ferramenta equivalente carregando nas páginas públicas é 🔴 se o lançamento depende de medir aquisição; 🟠 caso contrário.
2. **Evento de conversão principal configurado.** O evento que representa o objetivo do lançamento (cadastro, compra, lead, download) não disparando ou não existindo é 🔴.
3. **Evento da página de obrigado/confirmação.** Página pós-conversão sem evento de "conversão confirmada" (distinto de só "visitou a página") é 🟠. Cruza com `site-launch-kit` rodada 15 quando a superfície é site.
4. **UTM/origem de tráfego rastreável.** Campanhas de lançamento sem UTM padronizado é 🟡: mede o quê aconteceu, mas não de onde veio.
5. **Monitoramento de erro em produção (Sentry ou equivalente).** Projeto que já usa uma ferramenta de erro mas não está ativa no ambiente de produção é 🟠. Projeto que nunca adotou nenhuma é 🟡 (não é recomendação pra adotar Sentry agora, é registro de lacuna: decisão de adoção é do time).
6. **Alerta de indisponibilidade/uptime.** Sem alerta configurado pra quando o produto cair no dia do lançamento (quando o tráfego é mais sensível) é 🟠.
7. **Dashboard ou canal combinado pra acompanhar o dia do lançamento.** Ausência não é achado técnico por si, mas se ninguém sabe onde olhar os números no dia, registre como 🟡.

## Regra de corte

Não invente que um evento "provavelmente dispara": rode/inspecione a implementação (código do evento, ou o próprio painel da ferramenta se houver acesso) antes de marcar 🟢. Sem conseguir verificar, marque PENDÊNCIA DE VERIFICAÇÃO.

## Formato de saída

```
| # | Item | Onde (arquivo/rota) | O que falta ou está errado | Severidade | Executor da correção |
```

Sem achado que passe na régua: responda só `NENHUM ACHADO NESTA ÁREA`.
