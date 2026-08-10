# Handoff documents

| File | Purpose |
|---|---|
| `../TECHNICAL_BRIEF.md` | Codebase handoff for an incoming CTO / technical lead — stack, what's real vs simulated, security posture, liabilities |
| `../MVP_PLAN.md` | Plan to turn the demo into a product — schema, entity resolution, sequencing, risks |
| `../Chain-Verity-Technical-Brief.docx` | Word build of the brief |
| `../Chain-Verity-MVP-Build-Plan.docx` | Word build of the plan |

The markdown files are the source of truth for the prose. The `.docx` files are
generated — if you edit the markdown, update the matching generator and rebuild.

## Rebuilding the Word documents

`docx` is not a project dependency, so install it transiently:

```bash
npm i --no-save docx
node docs/generate/build-brief.js
node docs/generate/build-plan.js
```

Both write to the repo root. `docs/generate/docx-kit.js` holds the shared
styling (US Letter geometry, heading styles, tables, callouts) so the two
documents stay visually consistent.
