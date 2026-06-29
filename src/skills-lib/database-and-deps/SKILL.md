---
name: database-and-deps
description: >
  Segurança de banco de dados e dependências. Usar quando: revisar queries de banco, checar SQL injection,
  auditar permissões de banco, criptografar PII, revisar pacotes vulneráveis, configurar Dependabot/Renovate,
  auditar RPCs Supabase, verificar menor privilégio no banco.
---

# Database and Dependencies Security

## Banco de dados

### SQL Injection
- Use sempre queries parametrizadas ou ORM com binding correto
- Nunca concatene input do usuário em SQL
- Mesmo com ORM: raw queries precisam de atenção
- Teste com payloads: `' OR '1'='1`, `'; DROP TABLE users;--`

### Stack Supabase — como prevenir SQLi
O Supabase client já é parametrizado por design:
```ts
// SEGURO — query-builder: valores passados como args separados
const { data } = await supabase
  .from("captou_leads")
  .select("*")
  .eq("workspace_id", workspaceId)  // parametrizado
  .ilike("name", `%${search}%`)     // parametrizado (não concatenado em SQL)

// SEGURO — RPC com params nomeados
await supabase.rpc("find_captou_extraction_job_by_run_id", { run_id: runId })

// PERIGOSO — raw SQL com interpolação (evitar)
await supabase.rpc("exec_sql", { sql: `SELECT * WHERE id = '${id}'` })
```

**Ressalva importante:** o corpo das funções RPC vive no Postgres (fora do repo). Auditar no dashboard do Supabase se alguma RPC usa `EXECUTE format('... %s', input)` com input do usuário — isso é SQL injection server-side.

### Princípio do menor privilégio
- Usuário da aplicação: apenas SELECT/INSERT/UPDATE/DELETE nas tabelas necessárias
- Nunca use usuário root/admin da aplicação
- Crie usuário separado para migrations (com ALTER TABLE, CREATE, DROP)
- Read replicas: usuário somente leitura
- Supabase: `SUPABASE_SERVICE_ROLE_KEY` bypassa RLS — só usar em server-side para operações admin; para operações de usuário, usar a `anon key` + RLS

### Dados sensíveis em banco
- Criptografe PII (CPF, dados de cartão) em repouso com AES-256
- Não armazene dados de cartão (use tokenização via gateway de pagamento)
- Logs e audit trail: guarde quem acessou/modificou dados sensíveis
- Backups criptografados: a cópia do banco não pode ser mais fraca que o banco
- `deleted_at timestamp` para soft delete — nunca apague dados reais; isto também é auditoria

### Checklist de segurança de banco
- [ ] Nenhuma query monta SQL com template literal/concatenação?
- [ ] `grep -r "\.sql\|\.query(\|raw(" src/` → revisar manualmente?
- [ ] RPCs Supabase auditadas no dashboard (sem `EXECUTE format(...)` inseguro)?
- [ ] RLS ativo nas tabelas de domínio? (`SELECT tablename, rowsecurity FROM pg_tables`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` usada apenas em server-side?

## Dependências

### Vulnerabilidades em pacotes
- `npm audit` / `pnpm audit` / `pip audit`: rode em CI em cada PR
- Dependabot ou Renovate: automatize atualizações de segurança
- Lock files (`package-lock.json`, `pnpm-lock.yaml`): sempre commite, garante reprodutibilidade

### Supply chain attacks
- Prefira pacotes com muitos downloads e manutenção ativa
- Verifique integridade: `npm install --ignore-scripts` para pacotes suspeitos
- SBOM (Software Bill of Materials): documente todas as dependências em produção

### Atualizações
- Dependências de segurança: atualize imediatamente
- Dependências menores: sprint a sprint
- Major versions: planeje com antecedência, não deixe acumular

### Checklist de dependências
- [ ] `pnpm audit` (ou `npm audit`) rodado e sem HIGH/CRITICAL abertos?
- [ ] Lock file commitado?
- [ ] Dependabot ou Renovate configurado no repo?
- [ ] Pacotes de dev não vão para produção (`devDependencies` correto)?
