---
name: auth-and-secrets
description: >
  Segurança de autenticação e gestão de secrets. Usar quando: implementar auth, lidar com JWT/OAuth/SSO,
  guardar API keys ou credenciais, configurar Clerk/Supabase auth, revisar onde secrets estão armazenados,
  rotação de credenciais, checar se .env está seguro.
---

# Auth and Secrets

## Autenticação

### Senhas
- Hash com bcrypt (custo >= 12), Argon2id ou scrypt. Nunca MD5/SHA1 para senhas
- Minimum 8 caracteres, sem restrição de caracteres especiais
- Implemente bloqueio após N tentativas (lockout ou CAPTCHA)
- Oferece 2FA: TOTP (Google Authenticator) é o padrão mínimo

### JWT
- Assine sempre com RS256 (assimétrico) em produção, nunca HS256 com secret fraco
- exp curto para access token (15 min a 1h)
- Refresh token com rotação: ao usar, invalide o anterior e emita novo
- Nunca coloque dados sensíveis no payload (é base64, não criptografia)
- Blacklist de tokens invalidados: Redis com TTL igual ao exp do token

### OAuth / SSO
- Use biblioteca estabelecida, não implemente o flow manualmente
- Valide state parameter para prevenir CSRF
- PKCE obrigatório para flows em SPAs e apps mobile

### Stack Supabase + Clerk
- Auth gerenciada pelo Clerk: nunca reimplementar flows de auth manualmente
- Clerk webhook (`svix`) verificado por assinatura antes de processar — não confiar no body sem verificar
- Supabase RLS: toda tabela de domínio deve ter RLS ativo; queries devem filtrar por `workspace_id`/`user_id`
- `SUPABASE_SERVICE_ROLE_KEY` só usada em server-side (API routes, never client), nunca exposta no frontend
- `NEXT_PUBLIC_*` = seguro expor no cliente; tudo sem `NEXT_PUBLIC_` = server-only

## Secrets e credenciais

### O que nunca fazer
- Commitar .env no git (use .gitignore + git-secrets)
- Hardcodar API keys no código-fonte
- Logar credenciais mesmo em debug
- Usar mesmas credenciais em dev e produção

### Onde guardar secrets
- Produção: variáveis de ambiente da plataforma (Vercel: `vercel env add`)
- CI/CD: variáveis de ambiente criptografadas da plataforma (GitHub Actions Secrets, etc.)
- Dev local: arquivo `.env.local` nunca commitado — verificar com `git check-ignore -v .env.local`

### Cripto de credenciais de usuário (AES-256-GCM)
Se o app armazena credenciais de terceiros do usuário (ex: SMTP, WhatsApp API):
```ts
// src/lib/crypto.ts — ler chave do env, nunca hardcodar
const key = process.env.CREDENTIAL_ENCRYPTION_KEY
if (!key) throw new Error("CREDENTIAL_ENCRYPTION_KEY não configurada")
// AES-256-GCM: chave base64 de 32 bytes
```

### Rotação de credenciais
- Rotacione secrets de terceiros a cada 90 dias ou após qualquer saída de membro do time
- API keys de produção: uma por serviço/ambiente, nunca compartilhadas
- Database passwords: use IAM auth quando disponível no cloud provider

### Comparação de tokens
- NUNCA comparar tokens com `===` ou `!==` (timing attack)
- SEMPRE usar `crypto.timingSafeEqual`:
```ts
import { timingSafeEqual } from "crypto"
const expected = Buffer.from(process.env.MY_SECRET_TOKEN!)
const received = Buffer.from(token)
if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
  return new Response("Unauthorized", { status: 401 })
}
```

### Checklist de secrets
- [ ] `grep -r "sk_live\|sk_test\|service_role\|eyJ\|AAAA" src/` → vazio?
- [ ] `.env*` no `.gitignore`?
- [ ] `git log --all --diff-filter=A -- .env*` → vazio?
- [ ] Secrets de produção diferentes dos de dev?
- [ ] `SUPABASE_SERVICE_ROLE_KEY` nunca em variável `NEXT_PUBLIC_`?
