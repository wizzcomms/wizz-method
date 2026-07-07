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

## References (carregar sob demanda)

- `references/padroes-arquiteturais-e-pastas.md` — os 4 padrões arquiteturais P0-P3 (ciclo de vida com rascunho, cascatas, estado calculado, dashboards) e a estrutura de pastas completa do projeto. Carregar ao mapear um módulo novo ou criar a estrutura inicial.
- `references/implementacao-api-forms.md` — padrões de código para API routes (Supabase + Zod + rate limit), schemas Supabase (RLS, soft delete), formulários (React Hook Form + Zod) e estado na URL (P-006). Carregar ao escrever uma rota, tabela ou formulário.
- `references/seguranca-e-regras-codigo.md` — checklist de segurança embutida (resumo; ver skill `web-security` para a versão completa) e as regras de código do projeto (TypeScript, naming, tamanho de arquivo/função, imutabilidade). Carregar antes de finalizar qualquer PR.

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
