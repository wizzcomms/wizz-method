# Padrões de Implementação: API Routes, Schemas Supabase, Formulários, Estado na URL

Carregue este arquivo ao escrever uma rota de API, uma tabela Supabase, um formulário, ou ao implementar estado em query params.

## Padrões de API Routes (Supabase + Zod)

Toda rota de API que recebe input de usuário:
```ts
// src/app/api/[modulo]/route.ts
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { handleRouteError } from "@/lib/api/handle-route-error"
import { ok, fail } from "@/lib/api/response"
import { enforceRateLimit } from "@/lib/security/rate-limit"

const schema = z.object({
  workspaceId: z.string().uuid(),
  campo: z.string().min(1).max(500),
})

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return fail("Não autenticado", 401)

  await enforceRateLimit({ key: `modulo:${userId}`, limit: 10, windowSeconds: 60 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail("Dados inválidos", 400)

  // lógica de negócio aqui — revalidar regras de negócio no servidor (P-005)
}
```

**Regras de API routes:**
- SEMPRE valide com Zod (`.safeParse()` ou `.parse()`)
- SEMPRE filtre por `workspace_id` nas queries Supabase
- NUNCA confie em cálculos do cliente — recalcule no server
- NUNCA vaze detalhes internos em mensagens de erro
- Webhooks SEMPRE verificam assinatura antes de processar o body

## Schemas Supabase (padrões)

Toda tabela de domínio:
```sql
CREATE TABLE [modulo] (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  -- campos do domínio
  deleted_at timestamp,          -- soft delete (P-007)
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- RLS obrigatório
ALTER TABLE [modulo] ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON [modulo]
  USING (workspace_id = (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
```

**Regras de dados:**
- Valores monetários SEMPRE em centavos (integer). Display com `formatCurrency()`
- Unidades físicas SEMPRE na menor unidade (integer) no banco
- Datas como `timestamp` (UTC). Display com dayjs no locale do usuário

## Formulários (React Hook Form + Zod)

```tsx
"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
  campo: z.string().min(1, "Preencha o campo"),
})

type FormData = z.infer<typeof schema>

export function MeuForm() {
  const form = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/meu-modulo", {
      method: "POST",
      body: JSON.stringify(data),
    })
    // tratar resposta
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* shadcn/ui Form components */}
    </form>
  )
}
```

## Estado na URL (P-006)

```ts
// Filtros, abas, paginação sempre em query params
// F5 mantém estado, link é compartilhável

// Exemplos de hooks canônicos:
useUrlState<"ativo" | "inativo">("status", "ativo")
useUrlListState("categoria")        // ?categoria=A,B
useUrlDateRange("criado")          // ?criadoDe=...&criadoAte=...

// Wizard multi-etapa: ?etapa=1
// Só persistir etapas navegáveis, não estados transientes (loading, sucesso)
```
