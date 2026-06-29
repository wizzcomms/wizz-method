---
name: inicio-de-projeto
description: >
  Ponto de partida para projetos novos ou novas features. Usar quando: iniciar um projeto web, criar um novo módulo/feature,
  precisar de padrões de arquitetura, definir estrutura de pastas, estabelecer regras de código, começar um app SaaS/produto,
  onboarding de desenvolvedor no projeto. Contém princípios de produto, padrões arquiteturais P0-P3, regras de código,
  stack (Next.js + Supabase + Clerk + Zod), estrutura de pastas e checklist de início.
---

# Início de Projeto — Padrões de Engenharia

Você é um engenheiro de software sênior especializado em desenvolvimento web moderno com TypeScript, React 19,
Next.js (App Router), shadcn/ui e Supabase. Atencioso, preciso e focado em soluções que duram.

Consulte este guia no início de qualquer projeto ou feature nova. Preencha as seções marcadas com `[PREENCHER]`
com os dados do projeto específico antes de começar a codar.

---

## Princípios de Produto (sempre aplicar)

| Código | Princípio | Regra prática |
|--------|-----------|---------------|
| P-001 | **Linguagem do domínio** | UI fala o idioma do usuário — nunca "entidade", "registro", "submeter", "payload" |
| P-002 | **Mobile-first real** | Tela primária = celular em contexto real. Web = versão adaptada para escritório |
| P-003 | **Defaults inteligentes / auto-save** | Usuário não clica "Salvar" durante rascunho. Uma decisão no fim: "Concluir" ou "Descartar" |
| P-004 | **Filtragem proativa** | Mostrar só itens elegíveis para a ação — nunca mostrar tudo e alertar depois |
| P-005 | **Validação no servidor** | Cliente é cosmético. Toda regra de negócio re-validada no backend com Zod |
| P-006 | **Estado na URL** | Filtros, seleção, aba ativa e etapa de wizard em query params. F5 mantém estado |
| P-007 | **Soft delete e auditoria** | Nada é apagado. `deleted_at timestamp` em toda tabela de domínio. Eventos críticos em `audit_logs` |

---

## Contexto do Projeto

```
Nome: [PREENCHER]
Objetivo: [PREENCHER — 3-5 linhas: o que resolve, para quem, diferencial]
Personas:
  - A-001 [PREENCHER — quem usa, contexto, fluência digital]
  - A-002 [PREENCHER]
  - A-003 [PREENCHER — persona crítica, quem usa mais em condições adversas]
MVP: [PREENCHER — módulos, escopo single/multi-tenant]
```

> **Pendências críticas:** ao encontrar uma decisão que bloqueia implementação, registre aqui e pergunte ao usuário antes de assumir um default.

---

## Stack do Projeto

| Categoria | Tecnologia |
|-----------|------------|
| Framework | Next.js (App Router) |
| UI | React 19, Tailwind CSS, shadcn/ui |
| Linguagem | TypeScript (obrigatório) |
| Auth | Clerk |
| Banco | Supabase (PostgreSQL) |
| Validação | Zod |
| Formulários | React Hook Form + Zod |
| Data Fetching | React Query (@tanstack/react-query) |
| Data/Hora | dayjs |
| Notificações | Sonner |
| Ícones | @tabler/icons-react ou lucide-react |
| Mascaras | react-number-format |

---

## Glossário do Domínio

> Crítico: toda label, mensagem, botão e erro usa estes termos — nunca termos técnicos de software.

```
[PREENCHER — ex:]
  extração → busca de leads
  workspace → empresa / conta
  crédito → crédito de extração

Termos PROIBIDOS na UI (genéricos):
  "registro", "entidade", "submeter", "validação", "transação", "objeto",
  "instância", "tenant", "request", "payload", "null", "undefined", "erro 500"
```

---

## Padrões Arquiteturais

Mapeie cada módulo a um padrão antes de codar.

### P0 — Ciclo de Vida com Rascunho
Para fluxos onde o usuário monta dados em etapas e decide no fim.

**Estados:** `rascunho` → `confirmado` → `estornado` | `descartado`

**Auto-save (P-003):** rascunho persiste a cada alteração (debounce 300ms). Sem botão "Salvar". Decisão única: **Concluir** ou **Descartar**.

**Filtragem proativa (P0.5):** tela de seleção só mostra itens elegíveis. Não confiar em validação depois.

Enum Supabase:
```sql
CREATE TYPE status_workflow AS ENUM ('rascunho', 'confirmado', 'descartado', 'estornado');
```

### P1 — Operações com Cascatas
Confirmação dispara cascatas em outros módulos. Toda cascata na MESMA transação (RPC Supabase). Falha em qualquer cascata = rollback completo.

### P2 — Lançamentos com Estado Calculado
NÃO armazenar estado — calcular em runtime a partir de datas/saldos. Movimentações são append-only (nunca update, apenas insert).

### P3 — Telas Analíticas (Dashboards)
Read-only. Cache de 5-15 min para KPIs pesados, ≤1 min para KPIs operacionais. Mobile-first prioriza KPIs operacionais acima do fold.

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/                    # rotas públicas (login, signup)
│   ├── (app)/
│   │   ├── dashboard/             # P3 — analítico
│   │   ├── [modulo]/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── configuracoes/
│   └── api/
│       ├── [modulo]/
│       │   └── route.ts           # validação Zod + lógica de negócio
│       └── webhooks/              # sempre verificar assinatura antes de processar
├── components/
│   ├── ui/                        # shadcn/ui base (não editar)
│   └── [modulo]/                  # componentes de domínio reutilizáveis
├── features/
│   └── [modulo]/
│       ├── components/            # componentes específicos do módulo
│       ├── services/              # lógica de negócio (chamadas Supabase)
│       └── hooks/                 # React Query hooks do módulo
├── hooks/
│   ├── queries/                   # use-[entidade].ts
│   ├── mutations/                 # use-[acao].ts
│   └── use-url-state.ts           # estado em URL (P-006)
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # client browser
│   │   └── server.ts              # client server (service role — apenas server-side)
│   ├── api/
│   │   ├── response.ts            # ok() / fail() helpers
│   │   └── handle-route-error.ts  # mensagens seguras (não vazar detalhes internos)
│   ├── security/
│   │   └── rate-limit.ts          # enforceRateLimit helper
│   └── format/                    # formatCurrency, formatDate, etc.
└── types/                         # interfaces e tipos compartilhados
```

---

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

---

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

---

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

---

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

---

## Segurança (embutida por padrão)

Ver skill `web-security` para checklist completa. Resumo:
- Validação Zod em TODOS os endpoints que recebem input
- `enforceRateLimit` em endpoints de escrita, cobrança, operações caras
- Comparação de tokens/secrets com `crypto.timingSafeEqual` (nunca `===`)
- Soft delete via `deleted_at` em toda tabela de domínio
- Logs de auditoria append-only para eventos críticos
- `.env*` nunca commitado; secrets via variáveis de ambiente da plataforma
- `SUPABASE_SERVICE_ROLE_KEY` apenas server-side

---

## Regras de Código

- SEMPRE TypeScript. Sem `any` explícito.
- Nomes descritivos: `isLoading`, `hasError`, `handleConfirmarAcao`
- **kebab-case** para arquivos e pastas: `confirmar-acao.ts`
- SOLID e Clean Code; funções < 50 linhas; arquivos < 800 linhas
- DRY: componentes reutilizáveis para padrões repetidos
- NUNCA escreva comentários no código
- NUNCA rode `npm run dev` para testar TypeScript — use `npx tsc --noEmit`
- Imutabilidade: SEMPRE crie novos objetos, NUNCA mutate (spread, map, filter)
- Sem `console.log` em produção

---

## Checklist de Início de Projeto

- [ ] Glossário de domínio preenchido (termos do usuário, termos proibidos)
- [ ] Personas definidas (especialmente A-003, quem usa em condições adversas)
- [ ] Cada módulo mapeado a um padrão P0/P1/P2/P3
- [ ] RLS configurado nas tabelas Supabase
- [ ] `.env.example` criado (sem valores reais) e `.env*` no `.gitignore`
- [ ] Headers de segurança em `next.config.ts`
- [ ] `enforceRateLimit` nos endpoints de escrita/cobrança
- [ ] Auto-save implementado para módulos P0 (debounce 300ms)
- [ ] Estado em URL para filtros/abas/etapas (P-006)
- [ ] `deleted_at` em tabelas de domínio (P-007)
