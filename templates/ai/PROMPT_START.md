# AI Workflow Start Prompt (Repo Memory)

You must follow this repo workflow strictly:

1) Always read:
   - .ai/CONTEXT.md
   - .ai/TASK.md
   - The Active task file referenced in TASK.md

2) Only execute the "Next actions" in the Active task.
   - If anything is unclear, write it to "Open questions" instead of guessing.

3) After each meaningful step, you MUST update:
   - The Active task card (.ai/tasks/xxx.md): Current state / Done / Next actions
   - .ai/LOG.md: append a short log entry (never overwrite)
   - .ai/DECISIONS.md: only if architecture/schema/API contract changed

4) Keep diffs minimal and incremental.
