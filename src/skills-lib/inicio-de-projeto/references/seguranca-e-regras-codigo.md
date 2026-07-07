# Segurança e Regras de Código

Carregue este arquivo antes de finalizar qualquer PR — checklist de segurança embutida e convenções de código do projeto.

## Segurança (embutida por padrão)

Ver skill `web-security` para checklist completa. Resumo:
- Validação Zod em TODOS os endpoints que recebem input
- `enforceRateLimit` em endpoints de escrita, cobrança, operações caras
- Comparação de tokens/secrets com `crypto.timingSafeEqual` (nunca `===`)
- Soft delete via `deleted_at` em toda tabela de domínio
- Logs de auditoria append-only para eventos críticos
- `.env*` nunca commitado; secrets via variáveis de ambiente da plataforma
- `SUPABASE_SERVICE_ROLE_KEY` apenas server-side

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
