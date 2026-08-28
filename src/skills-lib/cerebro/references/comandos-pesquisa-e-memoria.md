# Comandos de Pesquisa e Memoria: /prospect, /memoria

Carregue este arquivo ao executar `/prospect` ou `/memoria`. Antes de tudo, releia a REGRA DE OURO e a seção Vault no SKILL.md principal — esses comandos dependem delas.

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

## /memoria

**Objetivo:** ler (e alimentar) a auto-memória do projeto a partir de **qualquer**
plataforma, não só do Claude Code.

A auto-memória guarda as duas linhas que não moram no vault: **armadilha de stack /
bug não-óbvio** e **preferência de trabalho / correção do usuário**. No Claude Code ela
carrega sozinha no início da sessão. Em Codex, OpenCode e Gemini não carrega nada, mas
o dado está lá: é um diretório comum de arquivos `.md` no disco local. Este comando é a
ponte de leitura. Não existe segunda cópia dos fatos — a fonte continua sendo uma só.

### Passo 1 — resolver o diretório de memória

```bash
PROJ_DIR="$(pwd)"
SLUG="$(printf '%s' "$PROJ_DIR" | sed 's/[/.]/-/g')"
MEM="$HOME/.claude/projects/$SLUG/memory"
# fallback: o slug histórico nem sempre normaliza espaço e ponto do mesmo jeito
[ -d "$MEM" ] || MEM="$(ls -d "$HOME"/.claude/projects/*"$(basename "$PROJ_DIR")"/memory 2>/dev/null | head -1)"
echo "$MEM"
```

Diretório inexistente = projeto sem auto-memória. Siga sem travar; não é problema a corrigir.

### Passo 2 — carregar só o índice

```bash
cat "$MEM/MEMORY.md"
```

O índice tem teto de 8 KB e é 1 linha por memória. **Nunca leia os arquivos individuais
em bloco.** Abra um arquivo só quando a linha do índice for relevante ao pedido da vez:

```bash
grep -rln "termo" "$MEM" --include="*.md" | head -5   # depois Read só o que casar
```

`_archive/` fica fora do índice de propósito. Só entre nele quando o índice não tiver a resposta.

### Passo 3 — gravar (mesma pasta, mesmo formato)

Vale o Dever de Memória e o teto: **40 memórias e 8 KB de índice por projeto**. Antes de
criar, `grep` no destino; se o fato já existe, atualize o arquivo que existe.

```markdown
---
name: <slug-em-kebab-case>
description: <resumo de uma linha, é o que decide a relevância na recuperação>
metadata:
  type: user | feedback | project | reference
---

<o fato. Para feedback/project, siga com as linhas **Why:** e **How to apply:**.
Ligue memórias relacionadas com [[nome-da-outra]].>
```

Depois de escrever o arquivo, acrescente 1 linha ao `MEMORY.md`:
`- [Título](arquivo.md) — gancho`

### Limites honestos

- É **pull, não push**: fora do Claude Code nada carrega sozinho, o agente precisa rodar o comando.
- Vale só para agente rodando na **mesma máquina**. Agente remoto não enxerga este disco.
- O teto e a poda continuam valendo igual, venha a escrita de qual plataforma vier.
