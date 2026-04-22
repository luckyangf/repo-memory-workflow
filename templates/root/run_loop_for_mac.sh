#!/usr/bin/env bash
set -u

PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
MAX_ROUNDS="${MAX_ROUNDS:-10}"
ROUND_TIMEOUT="${ROUND_TIMEOUT:-1800}"
MAX_FAILURES="${MAX_FAILURES:-3}"
CODEX_BIN="${CODEX_BIN:-codex}"
STOP_FILE="${STOP_FILE:-.ai/STOP}"
LOG_DIR="${LOG_DIR:-.ai/run_logs}"

usage() {
  cat <<'EOF'
repo-memory-workflow run loop for macOS/Linux

Usage:
  ./run_loop_for_mac.sh [options]

By default each round runs: codex exec --cd <project> --skip-git-repo-check --full-auto -

Options:
  --max-rounds <n>       Maximum exec rounds (default: 10)
  --timeout <seconds>    Per-round timeout in seconds (default: 1800)
  --max-failures <n>     Consecutive failure limit (default: 3)
  --codex-bin <path>     Codex executable (default: codex)
  --stop-file <path>     Stop file path (default: .ai/STOP)
  -h, --help             Show help

Environment variables with the same names are also supported:
  PROJECT_ROOT, MAX_ROUNDS, ROUND_TIMEOUT, MAX_FAILURES, CODEX_BIN, STOP_FILE, LOG_DIR
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --max-rounds)
      MAX_ROUNDS="${2:-}"; shift 2 ;;
    --timeout)
      ROUND_TIMEOUT="${2:-}"; shift 2 ;;
    --max-failures)
      MAX_FAILURES="${2:-}"; shift 2 ;;
    --codex-bin)
      CODEX_BIN="${2:-}"; shift 2 ;;
    --stop-file)
      STOP_FILE="${2:-}"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "[run_loop] Unknown option: $1" >&2
      usage
      exit 2 ;;
  esac
done

cd "$PROJECT_ROOT" || exit 1
PROJECT_ROOT="$(pwd)"

require_file() {
  if [ ! -f "$1" ]; then
    echo "[run_loop] Missing required file: $1" >&2
    exit 1
  fi
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

next_is_complete() {
  if [ ! -f ".ai/NEXT.md" ]; then
    return 1
  fi
  grep -Eiq '^(status:[[:space:]]*(complete|done)|NO_NEXT_ACTION)' ".ai/NEXT.md"
}

fingerprint_or_zero() {
  if [ ! -e "$1" ]; then
    echo 0
    return
  fi
  cksum "$1" | awk '{print $1 ":" $2}'
}

build_prompt() {
  local round="$1"
  cat <<EOF
You are running repo-memory-workflow automated relay round ${round}.

This is a fresh non-interactive Codex exec session. Do not rely on previous
chat history. Recover context only from repository files.

First read these files, in this order:
- AGENTS.md
- .ai/PROMPT_START.md
- .ai/TASK.md
- .ai/STATE.md
- .ai/DECISIONS.md
- .ai/NEXT.md

This round must execute only the first actionable item in .ai/NEXT.md.
If .ai/NEXT.md is unclear, do not guess. Checkpoint the blocker instead.

The first actionable item must be one verifiable work slice, not a
keystroke-level edit. Do not split tiny edits such as "create a file", "write
first line", and "append second line" across separate relay rounds. For tiny
smoke tests, create/write/verify in this one round and record the corrected
granularity in STATE and LOG.

Before ending this round, you must update:
- .ai/STATE.md with current status, files changed, validation, risks, and next step
- .ai/NEXT.md with the single next action for the following round, or "status: complete"
- .ai/LOG.md with this round's summary
- .ai/DECISIONS.md if an important technical decision changed

If tests or commands fail, write the failure details and recovery suggestion to
.ai/STATE.md, .ai/NEXT.md, and .ai/LOG.md before exiting.

Do not do unrelated refactors. Do not execute multiple task phases in this round.
EOF
}

require_file "AGENTS.md"
require_file ".ai/TASK.md"
require_file ".ai/STATE.md"
require_file ".ai/DECISIONS.md"
require_file ".ai/NEXT.md"
require_file ".ai/PROMPT_START.md"

if ! command_exists "$CODEX_BIN"; then
  echo "[run_loop] Codex executable not found: $CODEX_BIN" >&2
  echo "[run_loop] Install Codex CLI or pass --codex-bin <path>." >&2
  exit 127
fi

mkdir -p "$LOG_DIR"

failures=0
round=1

echo "[run_loop] Starting relay loop"
echo "[run_loop] project_root=$PROJECT_ROOT"
echo "[run_loop] max_rounds=$MAX_ROUNDS timeout=$ROUND_TIMEOUT max_failures=$MAX_FAILURES codex_bin=$CODEX_BIN"
echo "[run_loop] codex_args=exec --cd \"$PROJECT_ROOT\" --skip-git-repo-check --full-auto -"

while [ "$round" -le "$MAX_ROUNDS" ]; do
  if [ -f "$STOP_FILE" ]; then
    echo "[run_loop] Stop file found: $STOP_FILE"
    exit 0
  fi

  if next_is_complete; then
    echo "[run_loop] NEXT indicates completion. Stopping."
    exit 0
  fi

  prompt_file="$LOG_DIR/round_${round}_prompt.md"
  output_file="$LOG_DIR/round_${round}_output.log"
  build_prompt "$round" > "$prompt_file"

  state_before="$(fingerprint_or_zero .ai/STATE.md)"
  next_before="$(fingerprint_or_zero .ai/NEXT.md)"
  log_before="$(fingerprint_or_zero .ai/LOG.md)"

  echo "[run_loop] Round $round starting"
  echo "[run_loop] Round $round prompt=$prompt_file output=$output_file"
  if command_exists timeout; then
    timeout "$ROUND_TIMEOUT" "$CODEX_BIN" exec --cd "$PROJECT_ROOT" --skip-git-repo-check --full-auto - <"$prompt_file" >"$output_file" 2>&1
    code=$?
  else
    "$CODEX_BIN" exec --cd "$PROJECT_ROOT" --skip-git-repo-check --full-auto - <"$prompt_file" >"$output_file" 2>&1
    code=$?
  fi

  state_after="$(fingerprint_or_zero .ai/STATE.md)"
  next_after="$(fingerprint_or_zero .ai/NEXT.md)"
  log_after="$(fingerprint_or_zero .ai/LOG.md)"

  if [ "$code" -eq 0 ] && { [ "$state_before" != "$state_after" ] || [ "$next_before" != "$next_after" ] || [ "$log_before" != "$log_after" ]; }; then
    echo "[run_loop] Round $round completed"
    failures=0
  else
    failures=$((failures + 1))
    echo "[run_loop] Round $round failed or did not checkpoint (exit=$code, failures=$failures)" >&2
    echo "[run_loop] See $output_file" >&2
    if [ "$failures" -ge "$MAX_FAILURES" ]; then
      echo "[run_loop] Consecutive failure limit reached" >&2
      exit 1
    fi
  fi

  round=$((round + 1))
done

echo "[run_loop] Maximum rounds reached: $MAX_ROUNDS"
