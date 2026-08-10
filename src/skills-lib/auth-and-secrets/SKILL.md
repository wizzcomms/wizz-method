---
name: auth-and-secrets
description: >
  Segurança de autenticação e gestão de secrets. Usar quando: implementar auth, lidar com JWT/OAuth/SSO,
  token no header vs URL, revogação de token no logout, enumeração de usuário/mensagem genérica,
  guardar API keys ou credenciais, configurar Clerk/Supabase auth, revisar onde secrets estão armazenados,
  rotação de credenciais, checar se .env está seguro.
---

# Auth and Secrets

## Autenticação

### Senhas
- Hash com bcrypt (custo >= 12), Argon2id ou scrypt. Nunca MD5/SHA1 para senhas
- Mínimo de 8 caracteres, sem restrição de caracteres especiais
- Implemente bloqueio após N tentativas (lockout ou CAPTCHA)
- Ofereça 2FA: TOTP (Google Authenticator) é o padrão mínimo

### JWT
- Na verificação, aceite só o algoritmo esperado: rejeite `alg: none` e não deixe o token escolher o algoritmo (ataque de confusão de algoritmo)
- Prefira RS256 (assimétrico) quando mais de um serviço verifica o token. HS256 só com secret forte: 32+ bytes aleatórios, nunca uma palavra
- exp curto para access token (15 min a 1h)
- Refresh token com rotação: ao usar, invalide o anterior e emita novo
- Nunca coloque dados sensíveis no payload (é base64, não criptografia)
- **Token no header `Authorization: Bearer`, NUNCA na URL/query string** (a URL vaza em logs de servidor, histórico do browser, header `Referer` e analytics)
- **Logout de verdade revoga o token**: coloque na blacklist (Redis, TTL = exp do token) e invalide o refresh token. Sem isso o access token continua válido depois do logout até expirar sozinho

### Enumeração de usuário
Evita que um atacante descubra quais e-mails existem na base (login, signup, reset de senha).
- Resposta idêntica para e-mail existente e inexistente: "Se o e-mail existir, enviamos um link"
- No login use mensagem genérica ("credenciais inválidas"), nunca "e-mail não cadastrado" vs "senha incorreta"
- Responda em **tempo constante**: rode o hash da senha mesmo quando o usuário não existe (senão o tempo de resposta denuncia quem existe)
- Reforce com rate limit por IP **e** por conta (ver web-security) para barrar varredura de e-mails

### OAuth / SSO
- Use biblioteca estabelecida, não implemente o flow manualmente
- Valide state parameter para prevenir CSRF
- PKCE obrigatório para flows em SPAs e apps mobile

### Stack Supabase + Clerk
- Auth gerenciada pelo Clerk: nunca reimplementar flows de auth manualmente
- Toda rota protegida, Server Action e route handler chama `auth()` do Clerk no servidor. Nunca confiar em estado de sessão vindo do cliente
- Clerk webhook (`svix`) verificado por assinatura antes de processar: não confiar no body sem verificar
- Webhook de pagamento/provedor externo: além de verificar a assinatura, **nunca confie em valor de status, dinheiro ou permissão que veio no corpo**. Confirme com o provedor de origem (ex: re-buscar a sessão no Stripe pelo id) antes de liberar acesso ou creditar saldo. Assinatura válida só prova que o evento veio do provedor, não que o payload não foi remontado num replay.
- Supabase RLS: toda tabela de domínio deve ter RLS ativo; queries devem filtrar por `workspace_id`/`user_id`
- `SUPABASE_SERVICE_ROLE_KEY` bypassa RLS: só em server-side (API routes, jobs), nunca exposta no frontend
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
- Dev local: arquivo `.env.local` nunca commitado. Verificar com `git check-ignore -v .env.local`

### API keys emitidas pelo próprio app
Se o app gera API keys para os usuários:
- Guarde só o hash (SHA-256) da key no banco, nunca a key em texto plano
- Mostre a key completa uma única vez, na criação
- Use prefixo identificável (ex: `wz_live_`) para facilitar detecção em scan de repositório
- Permita revogar e listar keys por usuário

### Cripto de credenciais de usuário (AES-256-GCM)
Se o app armazena credenciais de terceiros do usuário (ex: SMTP, WhatsApp API):
```ts
// src/lib/crypto.ts: chave vem do env, nunca hardcodada
import { createCipheriv, randomBytes } from "crypto"

const key = process.env.CREDENTIAL_ENCRYPTION_KEY // base64, 32 bytes
if (!key) throw new Error("CREDENTIAL_ENCRYPTION_KEY não configurada")

export function encrypt(plain: string) {
  const iv = randomBytes(12) // IV aleatório por registro, nunca reutilizar
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "base64"), iv)
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  return { iv: iv.toString("base64"), data: enc.toString("base64"), tag: cipher.getAuthTag().toString("base64") }
}
// no decrypt: setAuthTag antes de final(), senão a integridade não é verificada
```

### Rotação de credenciais
- Rotacione secrets de terceiros a cada 90 dias ou após qualquer saída de membro do time
- Secret commitado por acidente: considere comprometido e rotacione na hora. Reescrever o histórico do git não basta
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
