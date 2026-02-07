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
   - `.ai/CONTEXT.md`
   - `.ai/TASK.md`
   - The Primary active task card referenced in TASK.md

2) Do NOT guess.
   - If context is missing, write it into "Open questions".

3) After each meaningful step, ALWAYS update:
   - The active task card (Current state + Next actions)
   - `.ai/LOG.md` (append only)
   - `.ai/DECISIONS.md` (only if architecture/schema/API contract changed)

4) Keep changes minimal and incremental.

---

## 1) Normal workflow: NEW requirement from scratch

### Step 1: Split requirement into tasks (Planning mode)
Ask AI:

"Read `.ai/CONTEXT.md` and `.ai/TASKING_GUIDE.md`.
Split the following requirement into 3~10 task cards under `.ai/tasks/`,
and update `.ai/TASK.md` accordingly.
Do NOT implement code yet."

Then paste the requirement.

### Step 2: Execute tasks (Implementation mode)
Ask AI:

"Read `.ai/CONTEXT.md`, `.ai/TASK.md`, and the Primary active task card.
Start executing ONLY the 'Next actions' in the Primary active task.
After each step, update task card and append `.ai/LOG.md`."

---

## 2) Workflow when chat context is full (Switch window safely)

When the chat is almost full, do this BEFORE switching:

1) Update the active task card:
   - Current state: what is done
   - Next actions: what remains (<=7 items)

2) Append one entry to `.ai/LOG.md`:
   - What was done
   - Which files changed
   - What is the next step

3) Generate a context pack:
   - Run: `python3 .ai/make_context.py`
   - This will produce: `.ai/CONTEXT_PACK.md`

In the NEW window/chat, ask AI:

"Read `.ai/CONTEXT_PACK.md` first.
Continue from the Primary active task 'Next actions'.
After each step, update task card and append `.ai/LOG.md`."

---

## 3) Recovery workflow: requirement already half-done WITHOUT `.ai/` (Retrofit mode)

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
`python3 .ai/make_context.py`

### Step 3: Ask AI to recover state FIRST (do not code yet)
Ask AI:

"Enter retrofit mode.
Read `.ai/CONTEXT_PACK.md`.
Execute Task 000 ONLY:
- Summarize what is already done from repo state
- Append recovery summary into `.ai/LOG.md`
- Split remaining work into 3~10 tasks
- Update `.ai/TASK.md`
Do NOT implement remaining tasks yet."

### Step 4: After Task 000 is done
Move Task 000 to Done.
Then start implementing the remaining tasks normally.

---

## 4) Teammate handoff workflow (Someone continues your unfinished work)

Teammate should:

1) Pull latest code
2) Run: `python3 .ai/make_context.py`
3) Ask AI:

"Read `.ai/CONTEXT_PACK.md`.
Continue from the Primary active task.
Follow Next actions strictly.
After each step, update task card and append `.ai/LOG.md`."

---

## 5) Where to put extra documents (3rd-party docs, screenshots, rules)

Store external inputs under:
- `.ai/resources/`

Rules:
- Keep original files if possible
- Add a short markdown summary next to it
- Tasks should reference resource files instead of copying large text
