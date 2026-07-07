# Padrões Arquiteturais (P0-P3) e Estrutura de Pastas

Carregue este arquivo ao mapear um módulo novo a um padrão arquitetural, ou ao criar a estrutura de pastas do projeto.

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
