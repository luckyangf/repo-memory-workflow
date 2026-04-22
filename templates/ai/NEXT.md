# NEXT

This file controls the next automated relay round. Keep it narrow, but not
keystroke-level. The next `codex exec` round must execute only the first
actionable item below.

status: ready

## Next Action

1. Fill in the project-specific task goal in `.ai/TASK.md` and update `.ai/STATE.md`.

## Scope Guard

- Do not implement unrelated code.
- Do not execute more than this one action.
- This action must be one verifiable work slice, not one tiny edit. Include
  implementation + minimal validation when they belong together.
- For smoke tests, create/write/verify the target artifact in one round.
- End by rewriting this file with the next single action, or `status: complete`.

## Required Checkpoint

- Update `.ai/STATE.md`.
- Append `.ai/LOG.md`.
- Update `.ai/DECISIONS.md` only if a key decision changed.
- Rewrite `.ai/NEXT.md` for the next round.
