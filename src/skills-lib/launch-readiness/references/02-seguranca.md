# Área 02 · Segurança

Varredura de SUPERFÍCIE exposta antes do launch, não caça a vulnerabilidade com prova de exploração. Achado que exige um payload concreto pra provar (mass assignment, IDOR, injeção) NÃO se aprofunda aqui: registre a suspeita como 🟠 e aponte `security-audit-pentest` como executor do aprofundamento.

## Checagens objetivas

1. **Secret hardcoded no repositório.** Chave de API, token, senha ou string de conexão literal em código versionado é 🔴. Vale pra `.env` commitado por engano também.
2. **HTTPS e certificado.** Site/app sem HTTPS forçado (redirect HTTP→HTTPS ausente) é 🔴. Certificado expirando em menos de 15 dias (quando verificável) é 🟠.
3. **Painel admin/rota interna exposta sem autenticação.** Rota administrativa, dashboard interno ou endpoint de debug acessível sem login é 🔴.
4. **Headers de segurança básicos ausentes.** Sem `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, ou `Strict-Transport-Security` num app com dado sensível é 🟠; aponte `web-security` como executor.
5. **CORS aberto demais.** `Access-Control-Allow-Origin: *` numa API que aceita credenciais/token é 🔴; sem credenciais é 🟡.
6. **Rate limiting ausente em rota sensível.** Login, cadastro, recuperação de senha ou endpoint que custa dinheiro (IA, SMS, e-mail) sem limite algum é 🟠; aponte `web-security` como executor.
7. **Dependência com CVE crítica conhecida no caminho de produção.** Reforça o achado #7 da área 01 se aplicável a lib de auth/crypto especificamente: sobe pra 🔴.
8. **Indício de mass assignment, IDOR ou injeção não provado ainda.** Campo de update que aceita o objeto inteiro do cliente sem allowlist, ou query montada por concatenação de string: registre como 🟠 "suspeita, precisa de prova de exploração" e aponte `security-audit-pentest`.

## Regra de corte

Esta área NUNCA entrega "como se explora" com payload real: isso é escopo exclusivo de `security-audit-pentest`. Se durante a varredura você já teria o payload pronto, ainda assim não o inclua aqui: registre a suspeita e a referência, para não duplicar o formato de saída das duas skills.

## Formato de saída

```
| # | Item | Onde (arquivo/rota) | O que falta ou está errado | Severidade | Executor da correção |
```

Sem achado que passe na régua: responda só `NENHUM ACHADO NESTA ÁREA`.
