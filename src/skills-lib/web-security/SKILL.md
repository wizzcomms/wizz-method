---
name: web-security
description: >
  Revisar segurança de apps web. Usar quando: auditar vulnerabilidades, antes de deploy/PR, implementar auth,
  adicionar endpoint de API, lidar com input de usuário, configurar headers, CSP, rate limiting, CORS, clickjacking,
  IDOR, SQL injection, vazamento de PII/dados na resposta, enumeração de usuário, OWASP Top 10.
  Inclui triagem de falhas recorrentes de pentest + checklist das 8 vulnerabilidades e exemplos para Next.js + Supabase + Clerk.
---

# Web Security (OWASP Top 10)

## Falhas recorrentes em pentest (rankeadas por severidade)

As que mais aparecem numa auditoria, com a correção direta. Use como triagem rápida — comece por aqui em toda revisão de segurança.

| # | Falha | Severidade | Correção | Onde |
|---|-------|-----------|----------|------|
| 1 | SQL Injection | 🔴 Crítica (parada de linha) | Query parametrizada / query-builder, nunca interpolar string | `references/owasp-top5-detalhado.md` §3 |
| 2 | IDOR (recurso por ID sem checar dono) | 🔴 Crítica (parada de linha) | Validar posse do recurso no servidor a cada request | `references/owasp-top5-detalhado.md` §1 |
| 3 | Rate limit ausente (brute force grátis) | 🟠 Alta | Limite por IP **e** por conta + lockout/CAPTCHA no login | `references/headers-rate-limit-cors.md` |
| 4 | CORS refletindo o `Origin` | 🟠 Alta | Allowlist de origens, nunca ecoar o `Origin` recebido | `references/headers-rate-limit-cors.md` |
| 5 | PII/dado demais na resposta (até hash de senha) | 🟠 Alta | Retornar só os campos necessários (allowlist de saída) | `references/headers-rate-limit-cors.md` |
| 6 | JWT na URL / token vivo pós-logout | 🟠 Alta | Token no header `Authorization` + revogar no logout | skill `auth-and-secrets` |
| 7 | Enumeração de usuário (erro revela se e-mail existe) | 🟡 Média | Mensagem genérica + resposta em tempo constante | skill `auth-and-secrets` |
| 8 | Clickjacking (sem header) | 🟡 Média (1 min) | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` | `references/headers-rate-limit-cors.md` |

> As duas primeiras (SQLi e IDOR) são **parada de linha**: apareceu, corrige antes de qualquer coisa.

## References (load on demand)

- `references/owasp-top5-detalhado.md` — detalhe + exemplo de código (Next.js + Clerk + Supabase) para as 5 categorias OWASP mais comuns: Broken Access Control, Cryptographic Failures, Injection, XSS, CSRF. Carregar ao aprofundar numa falha específica da tabela acima.
- `references/headers-rate-limit-cors.md` — headers de segurança obrigatórios (com config pronta para `next.config.ts`), rate limiting (login/API/cobrança, fail-closed), CORS (allowlist, exemplo de código), e como evitar vazamento de PII/over-fetch na resposta de API. Carregar ao implementar ou revisar qualquer um desses quatro pontos.
- `references/checklist-deploy.md` — checklist das 8 vulnerabilidades mais comuns (HTTPS, validação no servidor, secrets, rate limit, CSP, upload, SQL injection, backup), em formato de auditoria pré-deploy. Carregar antes de um deploy ou revisão de segurança formal.

## Checklist de revisão rápida
- [ ] Todos os inputs do usuário são validados e sanitizados?
- [ ] Autenticação verificada em todas as rotas protegidas?
- [ ] HTTPS forçado com redirect de HTTP?
- [ ] Headers de segurança configurados?
- [ ] Logs não contêm dados sensíveis?
- [ ] Dependências auditadas?
