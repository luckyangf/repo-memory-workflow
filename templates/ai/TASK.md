# TASK

This file is the long-running task pool. It is not the per-round execution
queue. The next automated round must be driven by `.ai/NEXT.md`.

## Task Board

- Active:
  - .ai/tasks/000_retrofit_existing_work.md
- Queued:
  - (none)
- Blocked:
  - (none)
- Done:
  - (none)

## Task Record Format

Every task card under `.ai/tasks/` must include:

- ID: stable numeric id, for example `001`
- Title: short action-oriented title
- Status: `todo`, `doing`, `blocked`, or `done`
- Dependencies: task ids or `(none)`
- Acceptance criteria: observable completion checks
- Next action: the next small action if this task becomes active

## Current Objective

- Initialize repo-memory-workflow state for long-running relay execution.
- Keep this file focused on task inventory, not transient session state.

## Operating Rules

- Use `.ai/STATE.md` for current facts.
- Use `.ai/NEXT.md` for the next single automated action.
- Use `.ai/LOG.md` for per-round summaries.
- Use `.ai/DECISIONS.md` for important technical decisions.

## Initial Next Step

- If this repo already has half-done work, execute Task 000 in retrofit mode.
- If this is a new requirement, split it into 3-10 task cards before coding.
