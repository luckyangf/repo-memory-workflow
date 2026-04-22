---
name: repo-memory-workflow
description: Guides users through repo-memory-workflow setup, task splitting, checkpointed AI development, and codex exec relay loops. Use when the project has AGENTS.md and .ai/TASK.md, or when the user says init, setup, Missing run_loop, continue task, split requirement, 继续, 拆任务, retrofit, context pack, run loop, 自动续跑, or asks where to run repo-memory-workflow commands.
---

# Repo Memory Workflow

Use this skill to help the user run repo-memory-workflow from the correct target project directory, initialize the `.ai/` workflow, split requirements into tasks, and optionally run the automated Codex relay loop.

## Setup and directory confirmation

When the user asks how to start, reports `Missing run_loop.sh`, says `repo-memory-workflow run` failed, or appears to be running commands from a home/downloads/tool directory:

1. Identify the **target project directory** first. This is the application/repo the user wants AI to modify, not the `repo-memory-workflow` package directory and not the user home directory.
2. If the target directory is unclear, ask for it before running `init` or `run`.
3. If you can inspect the filesystem, check the current directory with `pwd` and look for project markers such as `.git`, `package.json`, `pyproject.toml`, `pom.xml`, `go.mod`, source folders, or app files.
4. Explain that `repo-memory-workflow run` looks for project-local files such as `run_loop.sh` or `run_loop.ps1`, `AGENTS.md`, `.ai/TASK.md`, `.ai/STATE.md`, and `.ai/NEXT.md`.
5. Once the target directory is confirmed, run or instruct:

```bash
cd <your-project-directory>
repo-memory-workflow init
```

On Windows PowerShell:

```powershell
cd <your-project-directory>
repo-memory-workflow init
```

If `repo-memory-workflow` is being used from downloaded source and the command is not available, initialize the package first from the `repo-memory-workflow` source directory:

```bash
npm install
npm link
```

Then return to the target project directory and run `repo-memory-workflow init`.

## Required first conversation: split the requirement

After initialization, do **not** start the relay loop immediately. First help the user split the requirement:

1. Ask the user for the feature/bug/work goal if it is not already clear.
2. Read `AGENTS.md`, `.ai/CONTEXT.md`, and `.ai/TASKING_GUIDE.md`.
3. Split the requirement into 3-10 task cards under `.ai/tasks/`.
4. Update `.ai/TASK.md`, `.ai/STATE.md`, and `.ai/NEXT.md`.
5. Write exactly one concrete first action into `.ai/NEXT.md`.
6. Do not implement code during this planning step.

Only after `.ai/NEXT.md` has one concrete next action should the user run the automated loop.

## Running or supervising the loop

After task splitting, the user has two valid options:

- **Let Codex supervise:** run `repo-memory-workflow run --max-rounds 100 --timeout 3600` from the target project directory inside the current Codex-controlled terminal. Watch failures, inspect `.ai/run_logs/`, and continue from `.ai/NEXT.md` if the loop stops.
- **Let it run unattended:** tell the user to run the same command in a terminal opened at the target project directory. The loop starts fresh `codex exec` sessions and recovers state from `.ai/` files each round. To stop it, create `.ai/STOP` or interrupt the terminal.

Windows users can run the same command from PowerShell. The CLI uses `run_loop.ps1` on Windows and `run_loop.sh` on macOS/Linux.

## When already initialized

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
| Setup / init / Missing run_loop / 在哪里执行 | Confirm the target project directory first, then run `repo-memory-workflow init` there. Explain that commands must run from the project root. |
| Split requirement / 拆需求 / 规划 | Read `AGENTS.md` + `.ai/CONTEXT.md` + `.ai/TASKING_GUIDE.md`, split into 3~10 task cards under `.ai/tasks/`, update `.ai/TASK.md`, `.ai/STATE.md`, and `.ai/NEXT.md`. No code yet. |
| Continue / 继续 / next | Read checkpoint files, execute only `.ai/NEXT.md` first action, then update checkpoint files |
| Auto relay / 自动续跑 | Use `repo-memory-workflow run`; each round starts fresh `codex exec` and executes one NEXT action. The CLI chooses `run_loop.ps1` on Windows and `run_loop.sh` elsewhere. |
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
