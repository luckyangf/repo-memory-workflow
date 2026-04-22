# TASKING GUIDE (How to create tasks)

## Goal
Turn a new requirement into a set of executable task cards under `.ai/tasks/`.

## Rules
1) Always create 3~10 tasks, do NOT create 1 giant task.
2) Each task must have:
   - Objective
   - Context / Inputs
   - Acceptance criteria
   - Current state
   - Next action (one verifiable work slice)
   - Open questions (if any)
3) Prefer tasks that can be parallelized.
4) Do NOT include large raw docs in tasks. Use `.ai/resources/` references.
   - Prefer referencing `.ai/resources/_index.md` keys and the **latest** active version paths
   - If you reference `frozen/deprecated`, state the reason (bugfix/audit/migration)
5) If a task depends on another, mark it in the task as "Blocked by".

## Relay round granularity (MUST)

`.ai/NEXT.md` controls a fresh `codex exec` relay round. Each round has fixed
startup cost: launch Codex, read checkpoint files, connect to the model, execute,
validate, and write checkpoints. Therefore:

- Do NOT split keystroke-level or single-line edits into separate relay rounds.
- Each NEXT action must be a verifiable work slice, not a tiny mechanical step.
- A good NEXT action usually includes implementation + minimal validation +
  checkpoint updates.
- For tiny smoke tests, create/write/verify in one round.
- Bad: "create a file", then "write first line", then "append second line".
- Good: "create `relay_test.txt` with two expected lines, verify exact content,
  then update STATE/NEXT/LOG".
- If a task would take only a few seconds manually, batch it with its validation
  into the same NEXT action.

## Naming
- Task file name format:
  - NNN_<short_title>.md
- NNN must be the next available number (monotonic increasing).
- Title should be short, action-oriented.

## Output
- Create/Update:
  - `.ai/TASK.md` Task board
  - `.ai/STATE.md` current state
  - `.ai/NEXT.md` first single next action
  - New `.ai/tasks/*.md` files
- Do NOT modify old archived epics.
