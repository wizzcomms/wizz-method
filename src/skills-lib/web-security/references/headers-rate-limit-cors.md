# Headers de Segurança, Rate Limiting, CORS, e Vazamento de Dados

Carregue este arquivo ao implementar/revisar headers de segurança, rate limiting, CORS, ou o formato de resposta de uma API (over-fetch/PII).

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
