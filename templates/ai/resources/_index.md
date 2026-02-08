# Resources index (source-of-truth)

This file is the **entry point** for authoritative inputs stored under `.ai/resources/`.

## Reading rules (MUST)

1) Default: read only items with **status = active** and follow their **latest** pointer.
2) If you need to read **frozen/deprecated**, you must state the reason:
   - bugfix root-cause
   - audit/compliance evidence
   - migration/diff between versions
3) Do NOT guess missing details. Add "Open questions" and propose 2-3 options.

## Status glossary

- **active**: current authoritative input. Use by default.
- **frozen**: released snapshot. Use for bugfix/audit; do not rewrite, only append clarifications if needed.
- **deprecated**: superseded by a newer version. Do not use by default.

## Index

Maintain entries below. Keep them short; point to versioned markdown.

- key: example_payment_prd
  type: prd
  status: active
  latest: `.ai/resources/prd/example_payment_prd/versions/2026-02-08_v1/01_overview.md`
  applies_to: payment service
  owner: @you
  notes: add acceptance criteria in `04_acceptance.md`

- key: example_vendor_stripe
  type: vendor_docs
  status: frozen
  latest: `.ai/resources/vendor_docs/stripe/versions/2026-02-08_snapshot/01_api_endpoints.md`
  applies_to: stripe integration
  owner: @you
  notes: snapshot from vendor site

## Recommended per-resource layout

For each `key`, create:

- `versions/<version>/00_meta.yaml` (source url/file, extracted_at, revision/hash)
- split markdown files (01_..., 02_...)
- optional `change_summary.md` (when updating from previous version)
