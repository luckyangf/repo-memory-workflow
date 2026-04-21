---
name: repo-memory-workflow
description: Follows the .ai/ workflow for AI-assisted development and codex exec relay. Use when the project has AGENTS.md and .ai/TASK.md, or when the user says continue task, split requirement, 继续, 拆任务, retrofit, context pack, or run loop.
---

# Repo Memory Workflow

When the project root contains `AGENTS.md` and `.ai/TASK.md`, follow this workflow strictly.

## Before any coding

1. Read `AGENTS.md`
2. Read `.ai/PROMPT_START.md`
3. Read `.ai/TASK.md`
4. Read `.ai/STATE.md`
5. Read `.ai/DECISIONS.md`
6. Read `.ai/NEXT.md`
7. Read `.ai/resources/_index.md` and `.ai/RESOURCE_GUIDE.md` if relevant

## Execution rules

- Execute **only** the first actionable item in `.ai/NEXT.md`
- If unclear, write to "Open questions" in the task—do NOT guess
- After each meaningful step, update:
  - `.ai/STATE.md`: current facts, blockers, files changed, validation
  - `.ai/NEXT.md`: the next single action for the following round
  - `.ai/LOG.md`: append (never overwrite)
  - `.ai/DECISIONS.md`: only when architecture/schema/API changes
- Keep diffs minimal and incremental

## Resources rule (MUST)

- Default: only use `.ai/resources/_index.md` entries with **status=active** via their **latest** pointers
- Read `frozen/deprecated` only for bugfix/audit/migration (and state the reason)

## User intents → Actions

| User says | Do this |
|-----------|---------|
| Split requirement / 拆需求 / 规划 | Read `AGENTS.md` + `.ai/CONTEXT.md` + `.ai/TASKING_GUIDE.md`, split into 3~10 task cards under `.ai/tasks/`, update `.ai/TASK.md`, `.ai/STATE.md`, and `.ai/NEXT.md`. No code yet. |
| Continue / 继续 / next | Read checkpoint files, execute only `.ai/NEXT.md` first action, then update checkpoint files |
| Auto relay / 自动续跑 | Use `repo-memory-workflow run` or `./run_loop.sh`; each round starts fresh `codex exec` and executes one NEXT action |
| Context full / 切窗口 / new chat | Remind: update STATE/NEXT, append LOG, run `repo-memory-workflow pack`, then continue from `.ai/NEXT.md` |
| Retrofit / 补档 | Set Task 000 as Active, run `make_context.py`, ask user to paste retrofit prompt (see START.md) |
| Test cases / 测试用例 | Read `.ai/tests/TESTING_GUIDE.md` (if present) + bound resource version path, then generate/update `.ai/tests/releases/<release_id>/cases.md` + `cases.csv` for review. No code changes. |
| Run tests / 跑测试 | Read `.ai/tests/test_config.yaml`, execute smoke/commands, write `.ai/tests/runs/<timestamp>_<release_id>/run.md` + `run.json`, update release `report.md` latest summary. |
| Export report / 导出报告 | Export `.ai/tests/releases/<release_id>/cases.csv` → xlsx and `report.md` → docx (write to `.ai/tests/exports/<release_id>/`). |

## Quick prompts (user can say these shortly)

- **"拆一下"** → Planning mode: split requirement into tasks, no code
- **"继续"** → Implementation mode: execute `.ai/NEXT.md` first action
- **"生成上下文包"** → Run `repo-memory-workflow pack`
- **"自动续跑"** → Run `repo-memory-workflow run`
- **"生成测试用例"** → Bind a resource version path, generate cases under `.ai/tests/releases/`
- **"跑测试"** → Execute configured smoke/commands and write a run record
- **"导出测试报告"** → Export xlsx/docx to `.ai/tests/exports/`
