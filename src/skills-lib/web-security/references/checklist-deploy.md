# Checklist das 8 Vulnerabilidades Mais Comuns

Carregue este arquivo para uma auditoria rápida antes de deploy ou revisão de segurança.

## 1. HTTPS forçado
- [ ] A plataforma força HTTPS? (Vercel: sim por padrão)
- [ ] Header `Strict-Transport-Security` configurado explicitamente no código?
- [ ] Nenhuma URL `http://` hardcoded em redirects ou fetch?

## 2. Validação no servidor
- [ ] Todo endpoint de API valida input com Zod (`.parse()` ou `.safeParse()`)?
- [ ] `workspaceId`/`userId` validados como UUID antes de ir ao banco?
- [ ] Regras de negócio re-validadas no backend (nunca confiar só no cliente)?
- [ ] Supabase: RLS ativo nas tabelas? Queries sempre filtram por `workspace_id`/`user_id`?

## 3. Senha do banco / secrets no código
- [ ] Nenhum secret hardcoded em `.ts`/`.tsx`/`.js`?
- [ ] `.env*` no `.gitignore`? (`git check-ignore -v .env.local`)
- [ ] `.env.local` nunca aparece em `git log --all`?
- [ ] Cripto usa chave de `process.env`, sem fallback de string?
- [ ] Grep de segurança: `grep -r "sk_live\|sk_test\|service_role\|eyJ" src/` → vazio?

## 4. Rate limiting na API
- [ ] Endpoints de autenticação têm rate limit por IP?
- [ ] Endpoints de cobrança (checkout, portal Stripe) têm rate limit?
- [ ] Endpoints que disparam operações caras/externas têm rate limit?
- [ ] Endpoints de admin têm rate limit + comparação timing-safe?
- [ ] Rotas de escrita de estado falham fechado se o rate limiter cair? (ex: `failOpen: false` na lib)

## 5. Content Security Policy
- [ ] Header `Content-Security-Policy` configurado? (`next.config.ts` `headers()` ou middleware)
- [ ] `X-Frame-Options: DENY` configurado?
- [ ] `X-Content-Type-Options: nosniff` configurado?
- [ ] CSP testada em dev sem erros no console?

## 6. Upload sem verificação de tipo
- [ ] Se há upload: verifica MIME type no servidor (não só no cliente)?
- [ ] Limite de tamanho de arquivo imposto no servidor?
- [ ] Extensões permitidas em allowlist (não blocklist)?
- [ ] Se não há upload: confirmar que não há `<input type="file">` escondido?

## 7. SQL injection na busca
- [ ] Nenhuma query monta SQL com string interpolation/concatenação?
- [ ] Supabase: todo acesso via query-builder (`.from().select().eq()`) ou RPC com params nomeados?
- [ ] RPCs Postgres auditadas no dashboard: não usam `EXECUTE format(...)` com input do usuário?
- [ ] Grep: `grep -r "\.sql\|raw(\|\.query(" src/` → revisar resultados?

## 8. Backup automatizado
- [ ] Plano Supabase tem PITR ou backup diário habilitado? (verificar no dashboard)
- [ ] Retenção de backup documentada?
- [ ] Existe runbook de restauração?
- [ ] Credenciais de backup protegidas (não no repo)?
