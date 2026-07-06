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

As que mais aparecem numa auditoria, com a correção direta. Use como triagem rápida.

| # | Falha | Severidade | Correção | Onde |
|---|-------|-----------|----------|------|
| 1 | SQL Injection | 🔴 Crítica (parada de linha) | Query parametrizada / query-builder, nunca interpolar string | seção 3 |
| 2 | IDOR (recurso por ID sem checar dono) | 🔴 Crítica (parada de linha) | Validar posse do recurso no servidor a cada request | seção 1 |
| 3 | Rate limit ausente (brute force grátis) | 🟠 Alta | Limite por IP **e** por conta + lockout/CAPTCHA no login | Rate Limiting |
| 4 | CORS refletindo o `Origin` | 🟠 Alta | Allowlist de origens, nunca ecoar o `Origin` recebido | CORS |
| 5 | PII/dado demais na resposta (até hash de senha) | 🟠 Alta | Retornar só os campos necessários (allowlist de saída) | Vazamento na resposta |
| 6 | JWT na URL / token vivo pós-logout | 🟠 Alta | Token no header `Authorization` + revogar no logout | auth-and-secrets |
| 7 | Enumeração de usuário (erro revela se e-mail existe) | 🟡 Média | Mensagem genérica + resposta em tempo constante | auth-and-secrets |
| 8 | Clickjacking (sem header) | 🟡 Média (1 min) | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` | Headers |

> As duas primeiras (SQLi e IDOR) são **parada de linha**: apareceu, corrige antes de qualquer coisa.

## 1. Broken Access Control
- Verifique permissões no servidor, nunca apenas no frontend
- IDOR (Insecure Direct Object Reference): valide se o usuário tem acesso ao recurso pelo ID
- Princípio do menor privilégio em todas as rotas
- Next.js: middleware não é a única barreira. Re-verifique auth dentro do route handler, Server Action ou página (bypass de middleware já teve CVE)

Exemplo anti-IDOR (Next.js + Clerk + Supabase):
```ts
// app/api/projects/[id]/route.ts
import { auth } from "@clerk/nextjs/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return new Response("Unauthorized", { status: 401 })
  const { id } = await params
  const { data } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", userId) // posse verificada na query, além do RLS
    .single()
  if (!data) return new Response("Not found", { status: 404 }) // 404, não 403 (não confirma que o recurso existe)
  return Response.json(data)
}
```

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
- React/Next.js escapa JSX por padrão. O risco real está em `dangerouslySetInnerHTML`: sanitize antes com DOMPurify (ou não use)
- URLs vindas do usuário em `href`/`src`: bloqueie esquemas `javascript:` e `data:` (valide que começa com `https://` ou caminho relativo)
- Content-Security-Policy: bloqueie inline scripts
- HttpOnly e Secure flags nos cookies de sessão

## 5. CSRF
- SameSite=Strict ou Lax nos cookies de sessão
- CSRF token em formulários state-changing
- Verifique Origin/Referer em requests sensíveis

## Headers de segurança obrigatórios

`X-Frame-Options: DENY` + `frame-ancestors 'none'` no CSP mata **clickjacking** (o site não pode ser embutido em `<iframe>` de outro domínio). Fix de 1 minuto, sempre presente.

```
Content-Security-Policy: default-src 'self'; frame-ancestors 'none'
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
- Login: limite por IP **e** por conta (só por IP não segura brute force distribuído; só por conta não segura scan de vários e-mails)
- APIs públicas: limite por IP e por token
- Endpoints de reset de senha: especialmente restritivos
- Endpoints de cobrança (checkout, portal): sempre com rate limit
- Next.js: `@upstash/ratelimit` no route handler, ou WAF da Vercel para regras por rota
- Fail closed: se o backend do rate limit cair (ex: Redis fora), rotas de escrita devem negar a request, não deixar passar
- Comparações de token/secret: `crypto.timingSafeEqual`, nunca `!==` (detalhe em auth-and-secrets)
- Sem rate limit = brute force de graça. Somar lockout/CAPTCHA após N falhas no login

## CORS
- **Nunca reflita o header `Origin` recebido** de volta em `Access-Control-Allow-Origin` (isso libera qualquer site a chamar sua API com credenciais)
- Use uma **allowlist explícita** de origens: compare o `Origin` recebido contra a lista e só então ecoe o valor exato daquela origem
- `Access-Control-Allow-Credentials: true` NUNCA junto de `Access-Control-Allow-Origin: *`
- Padrão = negar: origem desconhecida → sem headers CORS (o browser bloqueia sozinho)
```ts
const ALLOWED = new Set(["https://app.exemplo.com", "https://exemplo.com"])
const origin = req.headers.get("origin")
if (origin && ALLOWED.has(origin)) {
  res.headers.set("Access-Control-Allow-Origin", origin) // valor exato, nunca "*" com credentials
  res.headers.set("Vary", "Origin")
}
```

## Vazamento de dados na resposta (over-fetch / PII)
- Retorne **só os campos que a tela precisa**: monte um DTO/allowlist de saída, nunca devolva a row inteira do banco
- NUNCA inclua `password`, `password_hash`, tokens, secrets ou colunas internas na resposta de API (é a falha mais grave da lista de PII)
- Supabase: `.select('id, name, email')` explícito, nunca `.select('*')` em endpoint que responde ao cliente
- Objeto do usuário logado: serialize por um mapper que só expõe campos públicos
- Erros: não vaze stack trace, SQL nem nome de tabela pro cliente. Mensagem genérica no response, detalhe só no log do servidor

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
- [ ] Rotas de escrita de estado falham fechado se o rate limiter cair? (ex: `failOpen: false` na lib)

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
