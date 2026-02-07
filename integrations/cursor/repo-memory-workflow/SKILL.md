---
name: repo-memory-workflow
description: Follows the .ai/ workflow for AI-assisted development. Use when the project has .ai/CONTEXT.md and .ai/TASK.md, or when the user says continue task, split requirement, 继续, 拆任务, retrofit, or context pack.
---

# Repo Memory Workflow

When the project root contains `.ai/CONTEXT.md` and `.ai/TASK.md`, follow this workflow strictly.

## Before any coding

1. Read `.ai/CONTEXT.md`
2. Read `.ai/TASK.md`
3. Read the Primary active task file (first under Active in TASK.md)

## Execution rules

- Execute **only** the "Next actions" in the Primary active task
- If unclear, write to "Open questions" in the task—do NOT guess
- After each meaningful step, update:
  - The active task card: Current state + Next actions
  - `.ai/LOG.md`: append (never overwrite)
  - `.ai/DECISIONS.md`: only when architecture/schema/API changes
- Keep diffs minimal and incremental

## User intents → Actions

| User says | Do this |
|-----------|---------|
| Split requirement / 拆需求 / 规划 | Read `.ai/CONTEXT.md` + `.ai/TASKING_GUIDE.md`, split into 3~10 task cards under `.ai/tasks/`, update `.ai/TASK.md`. No code yet. |
| Continue / 继续 / next | Read CONTEXT + TASK + Primary active task, execute Next actions only |
| Context full / 切窗口 / new chat | Remind: update task card, append LOG, run `python3 .ai/make_context.py`, paste `.ai/CONTEXT_PACK.md` in new chat |
| Retrofit / 补档 | Set Task 000 as Active, run `make_context.py`, ask user to paste retrofit prompt (see START.md) |

## Quick prompts (user can say these shortly)

- **"拆一下"** → Planning mode: split requirement into tasks, no code
- **"继续"** → Implementation mode: execute Primary active task Next actions
- **"生成上下文包"** → Run `python3 .ai/make_context.py`
