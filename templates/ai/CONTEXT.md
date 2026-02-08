# Project AI Context (Editor-agnostic)

## How to continue work

1) Always read: .ai/TASK.md
2) Then read the Active task file referenced in TASK.md (under .ai/tasks/)
3) Follow "Next actions" strictly. If anything is unclear, write it to "Open Questions" in the Active task.
4) After each meaningful step:
   - Update .ai/TASK.md (Current state + Next actions)
   - Append key decisions to .ai/DECISIONS.md (only irreversible or important choices)
   - Append progress logs to .ai/LOG.md (optional but recommended)

## Authoritative inputs (MUST read when relevant)

This repo stores external/product inputs under `.ai/resources/` (PRDs, 3rd-party docs, rules, field dictionaries).

Default rules:

1) Read `.ai/resources/_index.md`
2) Read only **status=active** items using their **latest** pointers
3) Read `frozen/deprecated` only for bugfix/audit/migration (and state the reason)

If resources exist, tasks should reference them instead of copying large text.

## Rules

- Do NOT guess. If context is missing, write "Open Questions" and propose 2-3 options.
- Prefer minimal diffs and incremental commits.
- If conversation context is low, rely on files in .ai/ as the source of truth.

If the feature was already partially implemented WITHOUT this `.ai/` workflow,
or conversation context is lost (new editor window / new teammate),
you MUST create and complete:

- `.ai/tasks/000_retrofit_existing_work.md`

before continuing implementation.

Do NOT guess missing context.
Use repo state as source-of-truth and record unknowns in "Open questions".

## Output conventions

- Use checklists for TODO.
- Keep TASK.md short and current.
- Keep DECISIONS.md concise and dated.

## Logging rule (MUST)

After each meaningful step, append a log entry to `.ai/LOG.md`.
Never overwrite existing logs. Always append.
Each log entry must include:

- What was done
- Files changed
- Next step
