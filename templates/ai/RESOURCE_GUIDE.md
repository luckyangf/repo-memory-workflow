# RESOURCE GUIDE (Authoritative inputs)

This repo uses `.ai/resources/` to store **authoritative inputs** (PRDs, 3rd‑party docs, rules, field definitions) in a way that is:

- versioned (Git)
- linkable (task cards reference paths)
- editor/AI-tool agnostic

## Golden rules (MUST)

1) **Do not paste large docs into tasks.** Store them under `.ai/resources/` and reference paths.
2) **Default read scope**:
   - Read `.ai/resources/_index.md`
   - Then read only the **latest** version of items marked **active**
3) **No guessing**:
   - If required info is missing or ambiguous, write it into "Open questions" (with 2-3 options)
4) **Versioning**
   - Create a new version directory when requirements/rules change
   - Keep old versions for bugfixes and historical audits (do not delete)

## Status definitions

- **active**: current source-of-truth. Default for AI to read/use.
- **frozen**: released and stable. Read for bugfixes / audits; do not mutate content except add clarifications.
- **deprecated**: superseded by a newer version. Do not read by default unless doing history/diff.

## Recommended structure

```text
.ai/resources/
  _index.md
  _manifest.json
  prd/<doc_key>/versions/<version>/*.md
  vendor_docs/<vendor_key>/versions/<version>/*.md
  api/<area_key>/versions/<version>/*.md
  rules/<domain_key>/versions/<version>/*.md
```

## What to store as "resources"

- PRD snapshots (overview, scope, acceptance criteria, edge cases)
- 3rd-party integration docs (API, webhooks, signing, idempotency, error codes)
- Business rules (state machines, permission matrix, audit requirements)
- Field dictionaries (tables, enums, constraints)

## How tasks should reference resources

In each task card:

- Add a **Context / Inputs** section that lists the required resource paths.
- Write acceptance criteria that explicitly references the resource version used.
