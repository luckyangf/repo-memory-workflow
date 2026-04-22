# PROMPT_START

This is the fixed startup prompt for fresh `codex exec` relay rounds.

## Mandatory Startup

You are in a fresh non-interactive AI session. Do not rely on previous chat
history. Restore context only from repository files.

Read these files first, in order:

1. `AGENTS.md`
2. `.ai/TASK.md`
3. `.ai/STATE.md`
4. `.ai/DECISIONS.md`
5. `.ai/NEXT.md`
6. `.ai/PROMPT_START.md`

Read these only when relevant:

- `.ai/CONTEXT.md`
- `.ai/resources/_index.md`
- `.ai/RESOURCE_GUIDE.md`
- active task cards under `.ai/tasks/`
- `.ai/tests/`

## This Round's Scope

- Execute only the first actionable item in `.ai/NEXT.md`.
- Treat `.ai/NEXT.md` as the only per-round execution queue.
- Do not continue to a second task phase in the same round.
- Do not do unrelated refactors or documentation changes.
- The first actionable item must be a verifiable work slice, not a
  keystroke-level edit. If `.ai/NEXT.md` is too tiny (for example "create file",
  "write first line", "append second line"), batch the tiny steps into one
  verifiable action, record that correction in `.ai/STATE.md` and `.ai/LOG.md`,
  then complete that one action.
- A good relay round should include the implementation, minimal validation, and
  checkpoint updates for one small goal.

## Required Checkpoint Before Exit

Before ending, update:

- `.ai/STATE.md`
- `.ai/NEXT.md`
- `.ai/LOG.md`
- `.ai/DECISIONS.md` if a key decision changed

`.ai/NEXT.md` must contain exactly the next single action for the following
round, or a clear completion marker such as `status: complete`. That next action
must be sized as one verifiable work slice, not one keyboard action.

## Failure Handling

If a command, test, or implementation step fails:

1. Stop the current action.
2. Record the failure and known evidence in `.ai/STATE.md`.
3. Append a failed round entry to `.ai/LOG.md`.
4. Put the next recovery action in `.ai/NEXT.md`.
5. Do not guess your way around missing requirements.

## Not Allowed

- Do not depend on old chat history.
- Do not execute multiple `.ai/NEXT.md` actions.
- Do not silently skip checkpoint updates.
- Do not overwrite `.ai/LOG.md` or `.ai/DECISIONS.md`.
- Do not claim completion without verification evidence.
