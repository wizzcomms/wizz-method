#!/usr/bin/env bash
# rtk-hook-version: 2-wizz2
# RTK Claude Code hook — rewrites commands to use rtk for token savings.
# Requires: rtk >= 0.23.0, jq
#
# Fonte de verdade: tools/hooks/rtk-rewrite.sh neste repo. Instalado em
# ~/.claude/hooks/ via `npm run sync:global` (nunca editar a cópia global
# direto: ela é substituída no próximo sync). Isto é um FORK local do hook
# gerado pelo instalador upstream do rtk (que documenta "single source of
# truth = src/discover/registry.rs, não edite este arquivo"): mantemos a
# delegação da lógica de rewrite pro binário `rtk rewrite`, mas aplicamos 2
# patches locais que o upstream não tem (auditoria 2026-07-07, C4/RT1):
#
#   1. Bug de comando multi-linha: `rtk rewrite` (confirmado ainda presente
#      no binário 0.43.0, reportado
#      upstream) só reescreve a 1ª linha de um comando multi-linha; as
#      demais passam cruas, sem aviso, gerando saída mista. Correção: este
#      hook detecta comando multi-linha e chama `rtk rewrite` LINHA A LINHA,
#      preservando a reescrita completa em vez de só a primeira linha.
#   2. Timeout interno por linha (RTK_HOOK_TIMEOUT, default 3s): evita que
#      uma chamada travada a `rtk rewrite` prenda o prompt inteiro. Não
#      depende do `timeout`/`gtimeout` do GNU coreutils (ausente por padrão
#      no macOS) — usa um watcher em background portátil (bash puro).
#      Isso é além do timeout de 5s já configurado no bloco PreToolUse do
#      settings.json (defesa em profundidade, não substituição).
#
# Version guard (floor de compatibilidade do subcomando `rewrite`, 0.23.0):
# é diferente do pin de supply chain do registry (`cli_utility.rtk`, hoje
# v0.43.0) — aquele controla o que o installer OFERECE instalar; este
# controla o que ESTE hook aceita rodar sem quebrar.

RTK_HOOK_TIMEOUT="${RTK_HOOK_TIMEOUT:-3}"

if ! command -v jq &>/dev/null; then
  echo "[rtk] WARNING: jq is not installed. Hook cannot rewrite commands. Install jq: https://jqlang.github.io/jq/download/" >&2
  exit 0
fi

if ! command -v rtk &>/dev/null; then
  echo "[rtk] WARNING: rtk is not installed or not in PATH. Hook cannot rewrite commands. Install: https://github.com/rtk-ai/rtk#installation" >&2
  exit 0
fi

# Version guard: rtk rewrite was added in 0.23.0.
# Older binaries: warn once and exit cleanly (no silent failure).
RTK_VERSION=$(rtk --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
if [ -n "$RTK_VERSION" ]; then
  MAJOR=$(echo "$RTK_VERSION" | cut -d. -f1)
  MINOR=$(echo "$RTK_VERSION" | cut -d. -f2)
  # Require >= 0.23.0
  if [ "$MAJOR" -eq 0 ] && [ "$MINOR" -lt 23 ]; then
    echo "[rtk] WARNING: rtk $RTK_VERSION is too old (need >= 0.23.0). Upgrade: cargo install rtk" >&2
    exit 0
  fi
fi

# multiline_unsafe <cmd> — retorna 0 (unsafe) quando reescrever linha a
# linha pode corromper o comando: heredoc (linhas de corpo que parecem
# comando seriam reescritas, ex. `git status` dentro de `cat <<EOF`),
# continuação com `\` no fim da linha (a linha seguinte é argumento, não
# comando) ou aspas desbalanceadas numa linha (string atravessa a quebra).
# Nesses casos o comando passa INTACTO (fail-open), sem reescrita parcial.
multiline_unsafe() {
  local cmd="$1"
  case "$cmd" in
    *"<<"*) return 0 ;;
  esac
  local line dq sq
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      *\\) return 0 ;;
    esac
    dq=$(printf '%s' "$line" | tr -cd '"' | wc -c)
    sq=$(printf '%s' "$line" | tr -cd "'" | wc -c)
    if [ $((dq % 2)) -ne 0 ] || [ $((sq % 2)) -ne 0 ]; then
      return 0
    fi
  done <<RTK_HOOK_GUARD_EOF
$cmd
RTK_HOOK_GUARD_EOF
  return 1
}

# rewrite_one <line> — imprime a linha reescrita, limitada por
# RTK_HOOK_TIMEOUT segundos. Em timeout ou qualquer falha do rtk, imprime a
# linha original sem alteração (fail-open, mesma filosofia do resto do hook).
rewrite_one() {
  local line="$1"
  if [ -z "$line" ]; then
    printf '%s' ''
    return 0
  fi
  local tmp
  tmp=$(mktemp 2>/dev/null) || {
    printf '%s' "$line"
    return 0
  }
  ( rtk rewrite "$line" >"$tmp" 2>/dev/null ) &
  local pid=$!
  ( sleep "$RTK_HOOK_TIMEOUT"; kill -TERM "$pid" 2>/dev/null ) &
  local watcher=$!
  wait "$pid" 2>/dev/null
  local status=$?
  kill -TERM "$watcher" 2>/dev/null
  wait "$watcher" 2>/dev/null

  # Exit codes do `rtk rewrite`: 0 = reescrito (≤0.30.x), 3 = reescrito
  # (0.43.0+, apesar do --help ainda dizer 0), 1 = sem equivalente (sem
  # output). Qualquer outro status (timeout/SIGTERM=143, erro) = fail-open.
  if { [ "$status" -eq 0 ] || [ "$status" -eq 3 ]; } && [ -s "$tmp" ]; then
    cat "$tmp"
  else
    printf '%s' "$line"
  fi
  rm -f "$tmp" 2>/dev/null
}

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$CMD" ]; then
  exit 0
fi

case "$CMD" in
  *$'\n'*)
    # Comando multi-linha: reescreve linha a linha (bug RT1/C4), exceto
    # quando o guard detecta risco de corrupção (heredoc, continuação,
    # string multi-linha) — aí passa intacto. O heredoc do loop (não um
    # pipe) garante que ele roda no shell atual, não numa subshell, para
    # REWRITTEN sobreviver ao loop.
    if multiline_unsafe "$CMD"; then
      exit 0
    fi
    REWRITTEN=""
    first=1
    while IFS= read -r line || [ -n "$line" ]; do
      rewritten_line=$(rewrite_one "$line")
      if [ "$first" -eq 1 ]; then
        REWRITTEN="$rewritten_line"
        first=0
      else
        REWRITTEN="$REWRITTEN
$rewritten_line"
      fi
    done <<RTK_HOOK_EOF
$CMD
RTK_HOOK_EOF
    ;;
  *)
    REWRITTEN=$(rewrite_one "$CMD")
    ;;
esac

# No change — nothing to do.
if [ "$CMD" = "$REWRITTEN" ]; then
  exit 0
fi

ORIGINAL_INPUT=$(echo "$INPUT" | jq -c '.tool_input')
UPDATED_INPUT=$(echo "$ORIGINAL_INPUT" | jq --arg cmd "$REWRITTEN" '.command = $cmd')

jq -n \
  --argjson updated "$UPDATED_INPUT" \
  '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "allow",
      "permissionDecisionReason": "RTK auto-rewrite",
      "updatedInput": $updated
    }
  }'
