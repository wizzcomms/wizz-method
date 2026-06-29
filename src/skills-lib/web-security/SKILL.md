---
name: web-security
description: >
  Revisar segurança de apps web. Usar quando: auditar vulnerabilidades, antes de deploy/PR, implementar auth,
  adicionar endpoint de API, lidar com input de usuário, configurar headers, CSP, rate limiting, OWASP Top 10.
  Inclui checklist das 8 vulnerabilidades mais comuns e exemplos para stack Next.js + Supabase + Clerk.
---

# Web Security (OWASP Top 10)

## 1. Broken Access Control
- Verifique permissões no servidor, nunca apenas no frontend
- IDOR (Insecure Direct Object Reference): valide se o usuário tem acesso ao recurso pelo ID
- Princípio do menor privilégio em todas as rotas

## 2. Cryptographic Failures
- HTTPS em tudo, sem exceção
- HSTS header com includeSubDomains
- Não exponha dados sensíveis em URLs (query strings ficam em logs)

## 3. Injection
- SQL: queries parametrizadas sempre
- XSS: sanitize outputs, use Content-Security-Policy
- Command injection: nunca execute input do usuário como comando shell

## 4. Cross-Site Scripting (XSS)
- Escape HTML em todo output de dado do usuário
- Content-Security-Policy: bloqueie inline scripts
- HttpOnly e Secure flags nos cookies de sessão

## 5. CSRF
- SameSite=Strict ou Lax nos cookies de sessão
- CSRF token em formulários state-changing
- Verifique Origin/Referer em requests sensíveis

## Headers de segurança obrigatórios
```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Como adicionar em Next.js (`next.config.ts`):
```ts
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://js.clerk.dev https://js.stripe.com https://www.googletagmanager.com",
            "connect-src 'self' https://*.supabase.co https://api.clerk.dev https://api.stripe.com",
            "frame-src https://js.stripe.com https://hooks.stripe.com",
            "img-src 'self' data: https:",
            "style-src 'self' 'unsafe-inline'",
          ].join("; "),
        },
      ],
    },
  ]
},
```

> **Cuidado:** CSP errada quebra o app. Teste sempre em dev antes de subir. Ajuste os domínios (`script-src`, `connect-src`) conforme os serviços reais do projeto.

## Rate Limiting
- Login: máximo 5 tentativas por minuto por IP
- APIs públicas: limite por IP e por token
- Endpoints de reset de senha: especialmente restritivos
- Endpoints de cobrança (checkout, portal): sempre com rate limit
- Comparações de token/secret: use `crypto.timingSafeEqual` (nunca `!==`)

---

## Checklist das 8 vulnerabilidades mais comuns

Usar como auditoria rápida antes de deploy ou revisão de segurança.

### 1. HTTPS forçado
- [ ] A plataforma força HTTPS? (Vercel: sim por padrão)
- [ ] Header `Strict-Transport-Security` configurado explicitamente no código?
- [ ] Nenhuma URL `http://` hardcoded em redirects ou fetch?

### 2. Validação no servidor
- [ ] Todo endpoint de API valida input com Zod (`.parse()` ou `.safeParse()`)?
- [ ] `workspaceId`/`userId` validados como UUID antes de ir ao banco?
- [ ] Regras de negócio re-validadas no backend (nunca confiar só no cliente)?
- [ ] Supabase: RLS ativo nas tabelas? Queries sempre filtram por `workspace_id`/`user_id`?

### 3. Senha do banco / secrets no código
- [ ] Nenhum secret hardcoded em `.ts`/`.tsx`/`.js`?
- [ ] `.env*` no `.gitignore`? (`git check-ignore -v .env.local`)
- [ ] `.env.local` nunca aparece em `git log --all`?
- [ ] Cripto usa chave de `process.env`, sem fallback de string?
- [ ] Grep de segurança: `grep -r "sk_live\|sk_test\|service_role\|eyJ" src/` → vazio?

### 4. Rate limiting na API
- [ ] Endpoints de autenticação têm rate limit por IP?
- [ ] Endpoints de cobrança (checkout, portal Stripe) têm rate limit?
- [ ] Endpoints que disparam operações caras/externas têm rate limit?
- [ ] Endpoints de admin têm rate limit + comparação timing-safe?
- [ ] Rotas de escrita de estado usam `failOpen: false`?

### 5. Content Security Policy
- [ ] Header `Content-Security-Policy` configurado? (`next.config.ts` `headers()` ou middleware)
- [ ] `X-Frame-Options: DENY` configurado?
- [ ] `X-Content-Type-Options: nosniff` configurado?
- [ ] CSP testada em dev sem erros no console?

### 6. Upload sem verificação de tipo
- [ ] Se há upload: verifica MIME type no servidor (não só no cliente)?
- [ ] Limite de tamanho de arquivo imposto no servidor?
- [ ] Extensões permitidas em allowlist (não blocklist)?
- [ ] Se não há upload: confirmar que não há `<input type="file">` escondido?

### 7. SQL injection na busca
- [ ] Nenhuma query monta SQL com string interpolation/concatenação?
- [ ] Supabase: todo acesso via query-builder (`.from().select().eq()`) ou RPC com params nomeados?
- [ ] RPCs Postgres auditadas no dashboard: não usam `EXECUTE format(...)` com input do usuário?
- [ ] Grep: `grep -r "\.sql\|raw(\|\.query(" src/` → revisar resultados?

### 8. Backup automatizado
- [ ] Plano Supabase tem PITR ou backup diário habilitado? (verificar no dashboard)
- [ ] Retenção de backup documentada?
- [ ] Existe runbook de restauração?
- [ ] Credenciais de backup protegidas (não no repo)?

---

## Checklist de revisão rápida
- [ ] Todos os inputs do usuário são validados e sanitizados?
- [ ] Autenticação verificada em todas as rotas protegidas?
- [ ] HTTPS forçado com redirect de HTTP?
- [ ] Headers de segurança configurados?
- [ ] Logs não contêm dados sensíveis?
- [ ] Dependências auditadas?
