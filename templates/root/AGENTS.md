# AGENTS.md

This repository uses repo-memory-workflow for long-running AI-assisted work.

## Project Goal

- Keep the project recoverable across fresh AI sessions.
- Treat repository files as the source of truth.
- Use `.ai/` checkpoint files to continue work without relying on chat history.

## Long-Term Rules

- Always read the relevant project files before changing code.
- Prefer small, reversible changes over broad rewrites.
- Preserve existing behavior unless a task explicitly changes it.
- Keep generated or derived files out of Git unless they are part of the workflow.
- Record important facts in `.ai/` instead of relying on memory.

## Not Allowed

- Do not depend on previous chat history for context.
- Do not do unrelated refactors while executing a checkpoint.
- Do not silently overwrite user-written `.ai/` files.
- Do not mark work complete without verification evidence.
- Do not continue past a blocker by guessing requirements.
- Do not execute more than the current `.ai/NEXT.md` action in one automated round.

## Code Change Principles

- Follow the repository's existing style and module boundaries.
- Keep diffs focused on the current task.
- Add tests when behavior changes.
- Prefer explicit file paths and concrete acceptance criteria.
- Update documentation when CLI behavior or workflow commands change.

## Testing And Acceptance

- Run the smallest useful verification first.
- Run broader checks before claiming completion.
- Log the exact commands and outcomes in `.ai/STATE.md` or `.ai/LOG.md`.
- If tests fail, record the failure, likely cause, and next recommended action.

## Failure Handling

- Stop and checkpoint when blocked.
- Write blockers to `.ai/STATE.md`.
- Write the next recovery step to `.ai/NEXT.md`.
- Append the failed round summary to `.ai/LOG.md`.
- Add decisions to `.ai/DECISIONS.md` only when a meaningful technical choice was made.

## Per-Round Execution Boundary

Each automated round is a fresh AI session. It must:

1. Read `AGENTS.md` and `.ai/PROMPT_START.md`.
2. Read `.ai/TASK.md`, `.ai/STATE.md`, `.ai/DECISIONS.md`, and `.ai/NEXT.md`.
3. Execute only the first actionable item in `.ai/NEXT.md`.
4. Verify what it changed when practical.
5. Update checkpoint files before ending.

## Required Checkpoint Updates

Before ending any implementation round, update:

- `.ai/STATE.md`
- `.ai/NEXT.md`
- `.ai/LOG.md`
- `.ai/DECISIONS.md` when decisions changed

If no code was changed, still update `.ai/LOG.md` with what was checked and why.
