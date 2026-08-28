# Comandos de Pesquisa e Sync: /prospect, /sync

Carregue este arquivo ao executar `/prospect` ou `/sync`. Antes de tudo, releia a REGRA DE OURO e a seção Vault no SKILL.md principal — esses comandos dependem delas.

## /prospect

**Objetivo:** pesquisar e registrar prospect.

**Passos:**
1. Receber nome/empresa + objetivo (tudo de uma vez)
2. Pesquisar via web search (setor, presença digital, dores, oportunidades)
3. Write direto em `_prospects/YYYY-MM-DD-[slug].md`
4. Resumo executivo para o usuário (não precisa estar no arquivo)

**Template `_prospects/YYYY-MM-DD-[slug].md`:**
```markdown
# [Nome / Empresa]
> Data: [data] | Objetivo: [tipo] | Status: pesquisado

## Perfil
- Setor / Tamanho / Produto / Público-alvo

## Presença digital
- Site / Redes / Ads ativos

## Oportunidade e ângulo de abordagem
[o que oferecer e como entrar]

## Próximo passo
- [ ] [ação]
```

## /sync

**Objetivo:** espelhar CONTEXT.md → vault após sessão no Codex.

**Passos:**
1. Read `CONTEXT.md` no diretório atual (arquivo pequeno — OK ler completo)
2. `wc -l "$VAULT/projetos/$PROJ.md"` → tail Read das últimas 60 linhas
3. Identificar diferenças em: estado atual, pendências, decisões
4. Edit cirúrgico em `projetos/[nome].md` (só seções alteradas): sobrescrever o bloco `## Estado` no topo e acrescentar 1 linha na tabela Sessões
5. `grep -n "Última sessão\|Pendente" "$VAULT/CEREBRO.md" | grep -i "$PROJ"` → Edit linha
6. Confirmar em 2 linhas
