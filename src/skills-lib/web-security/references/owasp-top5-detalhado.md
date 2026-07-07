# OWASP — Detalhe das 5 categorias mais comuns

Carregue este arquivo ao aprofundar numa das falhas do triage rápido (seções 1-5 referenciadas na tabela do SKILL.md).

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
