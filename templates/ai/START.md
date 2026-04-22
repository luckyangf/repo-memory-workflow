# START (Repo Memory Workflow)

This repo uses `.ai/` as the editor-agnostic source-of-truth for AI work.

Supported editors/tools:

- Cursor
- VSCode (Codex)
- Antigravity
- Any CLI AI client that can read repo files

---

## 0) Golden rules (MUST)

1) Always read:
   - `AGENTS.md`
   - `.ai/PROMPT_START.md`
   - `.ai/TASK.md`
   - `.ai/STATE.md`
   - `.ai/DECISIONS.md`
   - `.ai/NEXT.md`

2) Do NOT guess.
   - If context is missing, write it into "Open questions".

3) After each meaningful step, ALWAYS update:
   - `.ai/STATE.md`
   - `.ai/NEXT.md` (rewrite with the next single action)
   - `.ai/LOG.md` (append only)
   - `.ai/DECISIONS.md` (only if architecture/schema/API contract changed)

4) Keep changes minimal and incremental.

---

## 1) Normal workflow: NEW requirement from scratch

### Step 1: Split requirement into tasks (Planning mode)

Ask AI:

"Read `AGENTS.md`, `.ai/CONTEXT.md` and `.ai/TASKING_GUIDE.md`.
Split the following requirement into 3~10 task cards under `.ai/tasks/`,
update `.ai/TASK.md`, `.ai/STATE.md`, and write the first executable action to `.ai/NEXT.md`.
Do NOT implement code yet."

Then paste the requirement.

### Step 2: Execute tasks (Implementation mode)

Ask AI:

"Read `AGENTS.md`, `.ai/PROMPT_START.md`, `.ai/TASK.md`, `.ai/STATE.md`, `.ai/DECISIONS.md`, and `.ai/NEXT.md`.
Execute ONLY the first actionable item in `.ai/NEXT.md`.
Before ending, update `.ai/STATE.md`, `.ai/NEXT.md`, `.ai/LOG.md`, and decisions if needed."

---

## 2) Automated relay workflow: codex exec loop

After `.ai/NEXT.md` contains a concrete next action, run:

```bash
repo-memory-workflow run --max-rounds 10 --timeout 1800 --max-failures 3
```

This calls `./run_loop_for_mac.sh` on macOS/Linux and `./run_loop_for_win.ps1` on Windows PowerShell. Legacy `run_loop.sh` / `run_loop.ps1` files are compatibility launchers. Each round starts a fresh `codex exec --cd <project> --skip-git-repo-check --full-auto -` process.
The loop does not preserve chat history. The next round recovers from:

- `AGENTS.md`
- `.ai/PROMPT_START.md`
- `.ai/TASK.md`
- `.ai/STATE.md`
- `.ai/DECISIONS.md`
- `.ai/NEXT.md`

Each round must update checkpoint files and rewrite `.ai/NEXT.md` for the next round.

You can let the current Codex session supervise this command and inspect `.ai/run_logs/` if it stops. Or you can run it unattended in a terminal opened at the project root; create `.ai/STOP` or interrupt the terminal to stop the loop.

Before trusting a long run, do a smoke test with three tasks: create `relay_test.txt`, write `helloword`, then append `good bye` on the next line. This verifies path handling, write permissions, and checkpoint updates.

---

## 3) Workflow when chat context is full (Switch window safely)

When the chat is almost full, do this BEFORE switching:

1) Update the active task card:
   - Current state: what is done
   - Next actions: what remains (<=7 items)

2) Update `.ai/STATE.md` and `.ai/NEXT.md`.

3) Append one entry to `.ai/LOG.md`:
   - What was done
   - Which files changed
   - What is the next step

4) Generate a context pack:
   - Run: `repo-memory-workflow pack`
   - This will produce: `.ai/CONTEXT_PACK.md`

In the NEW window/chat, ask AI:

"Read `.ai/CONTEXT_PACK.md` first.
Execute ONLY the first action in `.ai/NEXT.md`.
Before ending, update `.ai/STATE.md`, `.ai/NEXT.md`, `.ai/LOG.md`, and decisions if needed."

---

## 4) Recovery workflow: requirement already half-done WITHOUT `.ai/` (Retrofit mode)

This is REQUIRED when:

- A teammate already implemented part of the feature without this workflow
- Chat history is lost
- The project is messy and needs task recovery

### Step 1: Create Task 000 (Retrofit)

Create this file if not present:

- `.ai/tasks/000_retrofit_existing_work.md`

Then put Task 000 into `.ai/TASK.md` -> Active as the Primary active task.

### Step 2: Run context pack

Run:
`repo-memory-workflow pack`

### Step 3: Ask AI to recover state FIRST (do not code yet)

Ask AI:

"Enter retrofit mode.
Read `.ai/CONTEXT_PACK.md`.
Execute Task 000 ONLY:

- Summarize what is already done from repo state
- Split remaining work into 3~10 tasks
- Update `.ai/TASK.md`
- Update `.ai/STATE.md`
- Write the first next action into `.ai/NEXT.md`
- Append recovery summary into `.ai/LOG.md`
Do NOT implement remaining tasks yet."

### Step 4: After Task 000 is done

Move Task 000 to Done.
Then start implementing the remaining tasks normally.

---

## 5) Teammate handoff workflow (Someone continues your unfinished work)

Teammate should:

1) Pull latest code
2) Run: `repo-memory-workflow pack`
3) Ask AI:

"Read `.ai/CONTEXT_PACK.md`.
Execute only `.ai/NEXT.md` first action.
Before ending, update `.ai/STATE.md`, `.ai/NEXT.md`, `.ai/LOG.md`, and decisions if needed."

---

## 6) Where to put extra documents (3rd-party docs, screenshots, rules)

Store external inputs under:

- `.ai/resources/`

Rules:

- Prefer **versioned markdown** under `.ai/resources/**` (see `.ai/RESOURCE_GUIDE.md`)
- Keep an index in:
  - `.ai/resources/_index.md` (human+AI entry point)
  - `.ai/resources/_manifest.json` (optional, machine-readable)
- Default read rule for AI:
  - Read `.ai/resources/_index.md`
  - Then read only **status=active** items via their **latest** pointer
  - Read `frozen/deprecated` only for bugfix/audit/migration (and state the reason)
- Keep old versions (do not delete). Mark them `frozen`/`deprecated` in the index.

---

## 7) Testing workflow (optional, versioned)

If this repo has `.ai/tests/`, you can version test assets alongside tasks/resources:

- Generate cases for a specific resource version (MUST bind explicit version path)
- Run smoke/health checks and record evidence
- Export Excel/Word as deliverables (optional)

See:
- `.ai/tests/README.md`
- `.ai/tests/TESTING_GUIDE.md`
