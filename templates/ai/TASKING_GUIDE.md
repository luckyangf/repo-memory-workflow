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
   - Next actions (<= 7 items, ordered, executable)
   - Open questions (if any)
3) Prefer tasks that can be parallelized.
4) Do NOT include large raw docs in tasks. Use `.ai/resources/` references.
5) If a task depends on another, mark it in the task as "Blocked by".

## Naming
- Task file name format:
  - NNN_<short_title>.md
- NNN must be the next available number (monotonic increasing).
- Title should be short, action-oriented.

## Output
- Create/Update:
  - `.ai/TASK.md` Task board
  - New `.ai/tasks/*.md` files
- Do NOT modify old archived epics.
