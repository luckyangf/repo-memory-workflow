---
name: repo-memory-workflow
description: Follows the .ai/ workflow for AI-assisted development. Use when the project has .ai/CONTEXT.md and .ai/TASK.md, or when the user says continue task, split requirement, 继续, 拆任务, retrofit, or context pack.
---

# Repo Memory Workflow

When the project root contains `.ai/CONTEXT.md` and `.ai/TASK.md`, follow this workflow strictly.

## Before any coding

1. Read `.ai/CONTEXT.md`
2. Read `.ai/resources/_index.md` and `.ai/RESOURCE_GUIDE.md` if present
3. Read `.ai/TASK.md`
4. Read the Primary active task file (first under Active in TASK.md)

## Execution rules

- Execute **only** the "Next actions" in the Primary active task
- If unclear, write to "Open questions" in the task—do NOT guess
- After each meaningful step, update:
  - The active task card: Current state + Next actions
  - `.ai/LOG.md`: append (never overwrite)
  - `.ai/DECISIONS.md`: only when architecture/schema/API changes
- Keep diffs minimal and incremental

## Resources rule (MUST)

- Default: only use `.ai/resources/_index.md` entries with **status=active** via their **latest** pointers
- Read `frozen/deprecated` only for bugfix/audit/migration (and state the reason)

## User intents → Actions

| User says | Do this |
|-----------|---------|
| Split requirement / 拆需求 / 规划 | Read `.ai/CONTEXT.md` + `.ai/TASKING_GUIDE.md`, split into 3~10 task cards under `.ai/tasks/`, update `.ai/TASK.md`. No code yet. |
| Continue / 继续 / next | Read CONTEXT + TASK + Primary active task, execute Next actions only |
| Context full / 切窗口 / new chat | Remind: update task card, append LOG, run `python3 .ai/make_context.py`, paste `.ai/CONTEXT_PACK.md` in new chat |
| Retrofit / 补档 | Set Task 000 as Active, run `make_context.py`, ask user to paste retrofit prompt (see START.md) |
| Test cases / 测试用例 | Read `.ai/tests/TESTING_GUIDE.md` (if present) + bound resource version path, then generate/update `.ai/tests/releases/<release_id>/cases.md` + `cases.csv` for review. No code changes. |
| Run tests / 跑测试 | Read `.ai/tests/test_config.yaml`, execute smoke/commands, write `.ai/tests/runs/<timestamp>_<release_id>/run.md` + `run.json`, update release `report.md` latest summary. |
| Export report / 导出报告 | Export `.ai/tests/releases/<release_id>/cases.csv` → xlsx and `report.md` → docx (write to `.ai/tests/exports/<release_id>/`). |

## Quick prompts (user can say these shortly)

- **"拆一下"** → Planning mode: split requirement into tasks, no code
- **"继续"** → Implementation mode: execute Primary active task Next actions
- **"生成上下文包"** → Run `python3 .ai/make_context.py`
- **"生成测试用例"** → Bind a resource version path, generate cases under `.ai/tests/releases/`
- **"跑测试"** → Execute configured smoke/commands and write a run record
- **"导出测试报告"** → Export xlsx/docx to `.ai/tests/exports/`
