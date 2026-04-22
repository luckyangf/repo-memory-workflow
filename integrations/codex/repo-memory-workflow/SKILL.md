---
name: repo-memory-workflow
description: Guides users through repo-memory-workflow setup, task splitting, checkpointed AI development, and codex exec relay loops. Use when the project has AGENTS.md and .ai/TASK.md, or when the user says install this, initialize test, run a loop test, loop stuck, Round 1 starting, init, setup, Missing run_loop, continue task, split requirement, continue, split tasks, retrofit, context pack, run loop, auto relay, or asks where to run repo-memory-workflow commands.
---

# Repo Memory Workflow

Use this skill to help the user run repo-memory-workflow from the correct target
project directory, initialize the `.ai/` workflow, split requirements into
tasks, and optionally run the automated Codex relay loop.

This file is intentionally ASCII-only. Windows PowerShell 5.1 can mojibake
UTF-8 files without BOM when a nested `codex exec` reads skills, which makes
Chinese guidance unreadable to the child Codex process.

## Required User-Facing Setup Guide

When the user says anything like install this, initialize test, run a loop
test, auto relay, split requirement, loop stuck, or Round 1 starting, first
explain the workflow clearly in the user's language:

0. Step 0: confirm the target project directory. Commands must run in the real
   project root, not in the tool source directory and not in the user home
   directory.
1. Step 1: confirm the CLI is installed. Run `repo-memory-workflow --help` or
   `where repo-memory-workflow` / `which repo-memory-workflow`.
2. Step 2: ask whether to install or enable https://github.com/obra/superpowers
   for brainstorming-driven requirement analysis.
3. Step 3: if the user has Superpowers or wants it, use brainstorming first; if
   they decline, use `.ai/TASKING_GUIDE.md` for built-in task splitting.
4. Step 4: write the requirement into `.ai/TASK.md`, `.ai/tasks/`, and a single
   concrete `.ai/NEXT.md` action. Planning only; do not implement business code.
5. Step 5: run one small round or smoke test. The smoke test must be one
   verifiable work slice, for example: create `relay_test.txt`, write both
   expected lines, verify exact content, and update checkpoints in one round.
6. Step 6: only recommend a long `repo-memory-workflow run` after the smoke test
   passes.

Do not skip this explanation and jump straight to the loop. If the user reports
`Round 1 starting` stuck, read `.ai/run_logs/round_1_output.log` and
`.ai/run_logs/round_1_run.cmd` first, then decide whether Codex CLI is stuck or
the runner is broken.

## Relay Granularity Rule

This is the most important rule for automated relay:

- `.ai/NEXT.md` must contain one verifiable work slice, not one keystroke-level
  edit.
- Do not split tiny steps into separate relay rounds.
- Each relay round has fixed cost: launch Codex, read checkpoint files, connect
  to the model, execute, validate, write checkpoints, and exit.
- Bad NEXT sequence: create a file -> write first line -> append second line.
- Good NEXT action: create `relay_test.txt` with both expected lines, verify
  exact content, then update STATE/NEXT/LOG.
- A good NEXT action usually includes implementation + minimal validation +
  checkpoint updates for one small goal.
- If `.ai/NEXT.md` is too tiny, correct the granularity, record the correction
  in STATE and LOG, then execute the combined verifiable action.

For real development, task cards may contain many checklist items, but the relay
round should not be one checklist keystroke. It should be a small complete loop,
such as "implement the comment create API and run the minimal API test".

## Optional Superpowers Setup

If the user has not decided whether to use Superpowers, ask once:

> Do you want me to help install or enable Superpowers for Codex so we can use
> brainstorming before splitting the requirement?

If they decline, continue with the built-in `.ai/TASKING_GUIDE.md` workflow.

If they accept, follow the official Codex install path:

```text
Fetch and follow instructions from:
https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

Manual summary for Codex:

```bash
git clone https://github.com/obra/superpowers.git ~/.codex/superpowers
mkdir -p ~/.agents/skills
ln -s ~/.codex/superpowers/skills ~/.agents/skills/superpowers
```

Windows PowerShell junction:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.codex\superpowers\skills"
```

Tell the user to restart Codex after installing. If Superpowers is already
installed, ask whether to use its brainstorming workflow before writing `.ai/`
tasks.

## Setup And Directory Confirmation

When the user asks how to start, reports `Missing run_loop`, says
`repo-memory-workflow run` failed, or appears to be running commands from a
home/downloads/tool directory:

1. Identify the target project directory first. This is the application/repo the
   user wants AI to modify, not the `repo-memory-workflow` package directory and
   not the user home directory.
2. If the target directory is unclear, ask for it before running `init` or
   `run`.
3. If you can inspect the filesystem, check the current directory and look for
   project markers such as `.git`, `package.json`, `pyproject.toml`, `pom.xml`,
   `go.mod`, source folders, or app files.
4. Explain that `repo-memory-workflow run` looks for project-local files such as
   `run_loop_for_mac.sh` or `run_loop_for_win.ps1`, `AGENTS.md`, `.ai/TASK.md`,
   `.ai/STATE.md`, and `.ai/NEXT.md`.
5. Once the target directory is confirmed, run or instruct:

```bash
cd <your-project-directory>
repo-memory-workflow init
```

If `repo-memory-workflow` is being used from downloaded source and the command
is not available, initialize the package first from the `repo-memory-workflow`
source directory:

```bash
npm install
npm link
```

Then return to the target project directory and run `repo-memory-workflow init`.

## Required First Conversation: Split The Requirement

After initialization, do not start the relay loop immediately. First help the
user split the requirement:

1. Ask the user for the feature/bug/work goal if it is not already clear.
2. Read `AGENTS.md`, `.ai/CONTEXT.md`, and `.ai/TASKING_GUIDE.md`.
3. Split the requirement into 3-10 task cards under `.ai/tasks/`.
4. Update `.ai/TASK.md`, `.ai/STATE.md`, and `.ai/NEXT.md`.
5. Write exactly one concrete first action into `.ai/NEXT.md`.
6. Ensure the NEXT action is a verifiable work slice, not a tiny edit.
7. Do not implement code during this planning step.

Only after `.ai/NEXT.md` has one concrete next action should the user run the
automated loop.

## Running Or Supervising The Loop

After task splitting, the user has two valid options:

- Let Codex supervise: run `repo-memory-workflow run --max-rounds 100 --timeout
  3600` from the target project directory inside the current Codex-controlled
  terminal. Watch failures, inspect `.ai/run_logs/`, and continue from
  `.ai/NEXT.md` if the loop stops.
- Let it run unattended: tell the user to run the same command in a terminal
  opened at the target project directory. The loop starts fresh `codex exec`
  sessions and recovers state from `.ai/` files each round. To stop it, create
  `.ai/STOP` or interrupt the terminal.

Windows users can run the same command from PowerShell. The CLI uses
`run_loop_for_win.ps1` on Windows and `run_loop_for_mac.sh` on macOS/Linux.
Legacy `run_loop.ps1` and `run_loop.sh` are compatibility launchers.

Before a long unattended run, suggest this one-round smoke test:

1. Create `relay_test.txt`.
2. Write exactly:

```text
helloword
good bye
```

3. Verify exact file content.
4. Update STATE/NEXT/LOG.

If this does not complete in one round, inspect `.ai/run_logs/` before running a
larger task. On Windows, inspect both `round_N_output.log` and
`round_N_run.cmd`.

## When Already Initialized

When the project root contains `AGENTS.md` and `.ai/TASK.md`, follow this
workflow strictly.

## Before Any Coding

1. Read `AGENTS.md`
2. Read `.ai/PROMPT_START.md`
3. Read `.ai/TASK.md`
4. Read `.ai/STATE.md`
5. Read `.ai/DECISIONS.md`
6. Read `.ai/NEXT.md`
7. Read `.ai/resources/_index.md` and `.ai/RESOURCE_GUIDE.md` if relevant

## Execution Rules

- Execute only the first actionable item in `.ai/NEXT.md`.
- If unclear, write to "Open questions" in the task; do not guess.
- If the NEXT action is too tiny, batch it with its natural validation into one
  verifiable work slice, record the correction, then execute it.
- After each meaningful step, update:
  - `.ai/STATE.md`: current facts, blockers, files changed, validation
  - `.ai/NEXT.md`: the next single action for the following round
  - `.ai/LOG.md`: append; never overwrite
  - `.ai/DECISIONS.md`: only when architecture/schema/API changes
- Keep diffs minimal and incremental.

## Resources Rule

- Default: only use `.ai/resources/_index.md` entries with `status=active` via
  their `latest` pointers.
- Read `frozen` or `deprecated` only for bugfix/audit/migration, and state the
  reason.

## User Intents To Actions

| User says | Do this |
|-----------|---------|
| Setup / init / Missing run_loop / where to run | Confirm the target project directory first, then run `repo-memory-workflow init` there. Explain that commands must run from the project root. |
| Split requirement / plan | Read `AGENTS.md` + `.ai/CONTEXT.md` + `.ai/TASKING_GUIDE.md`, split into 3-10 task cards under `.ai/tasks/`, update `.ai/TASK.md`, `.ai/STATE.md`, and `.ai/NEXT.md`. No code yet. |
| Continue / next | Read checkpoint files, execute only `.ai/NEXT.md` first action, then update checkpoint files. |
| Auto relay | Use `repo-memory-workflow run`; each round starts fresh `codex exec` and executes one NEXT action. The CLI chooses `run_loop_for_win.ps1` on Windows and `run_loop_for_mac.sh` elsewhere. |
| Context full / new chat | Remind: update STATE/NEXT, append LOG, run `repo-memory-workflow pack`, then continue from `.ai/NEXT.md`. |
| Retrofit | Set Task 000 as Active, run `make_context.py`, ask user to paste retrofit prompt from START.md. |
| Test cases | Read `.ai/tests/TESTING_GUIDE.md` if present plus the bound resource version path, then generate or update `.ai/tests/releases/<release_id>/cases.md` and `cases.csv` for review. No code changes. |
| Run tests | Read `.ai/tests/test_config.yaml`, execute smoke/commands, write `.ai/tests/runs/<timestamp>_<release_id>/run.md` and `run.json`, update release `report.md` latest summary. |
| Export report | Export `.ai/tests/releases/<release_id>/cases.csv` to xlsx and `report.md` to docx under `.ai/tests/exports/<release_id>/`. |

## Quick Prompts

- "split this" -> Planning mode: split requirement into tasks, no code.
- "continue" -> Implementation mode: execute `.ai/NEXT.md` first action.
- "context pack" -> Run `repo-memory-workflow pack`.
- "auto relay" -> Run `repo-memory-workflow run`.
- "generate test cases" -> Bind a resource version path, generate cases under
  `.ai/tests/releases/`.
- "run tests" -> Execute configured smoke/commands and write a run record.
- "export test report" -> Export xlsx/docx to `.ai/tests/exports/`.
