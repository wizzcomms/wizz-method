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

### RLS: policy permissiva é pior que policy nenhuma
Ler os arquivos de migration/policy versionados e checar:
- Toda tabela de domínio tem `ENABLE ROW LEVEL SECURITY`?
- Nenhuma policy é permissiva: `USING (true)` ou `WITH CHECK (true)` libera geral, mas o painel do Supabase mostra a trava como "ativa". Amarre sempre ao dono: `USING (auth.uid() = user_id)`.
- Tabela criada em migration recente **sem** policy correspondente = exposta.

```sql
-- ERRADO: mostra RLS ativo no painel, mas libera qualquer um
create policy "read" on projects for select using (true);

-- CERTO: amarra o dono
alter table projects enable row level security;
create policy "own rows" on projects
  for select using (auth.uid() = user_id);
```

> RLS de verdade é estado do banco, não arquivo. O que está no repo é ponto de partida: confirme o estado real no dashboard/`\d+` do Postgres.

## 6. Mass Assignment (atribuição em massa)
O corpo da requisição inteiro repassado para o banco (`spread` do objeto, `update`/`create` com o payload completo) deixa o atacante setar qualquer coluna, mesmo as que não estão no formulário. Alvos clássicos: `role`, `is_admin`, `plan`, `balance`, `payment_status`, `user_id`/`owner_id`.

```ts
// ERRADO: o cliente manda { name: "x", role: "admin" } e vira admin
await supabase.from("users").update({ ...body }).eq("id", userId)

// CERTO: allowlist explícita, só os campos do formulário
const { name, bio } = updateSchema.parse(body) // Zod com só os campos permitidos
await supabase.from("users").update({ name, bio }).eq("id", userId)
```

Regra: **nunca** `...body` / `...req.body` num write. Sempre desestruture (ou valide com um schema que só contém os campos editáveis). Campos de papel, permissão, plano, saldo, status de pagamento e id de dono nunca vêm do cliente.

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
