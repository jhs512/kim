# infinite-brain schema (vendored reference)

These are the canonical schema references for kim1 vault nodes, vendored from
[JotaSXBR/obsidian-infinite-brain](https://github.com/JotaSXBR/obsidian-infinite-brain)
(MIT, commit `1506eb1`). kim1 vault nodes **are** infinite-brain nodes — same
frontmatter, node types, edge types, and visibility values.

- `NODE-TYPES.md` — the 17 node types (`type` field, singular; folder plural)
- `EDGE-TYPES.md` — the 10 edge types (`edges[].type`)
- `FRONTMATTER-SCHEMA.md` — the full frontmatter field spec
- `LOCAL-TYPES.md` — registry for `custom` types
- `Template-Infinite-Node.md` — the node template

## What kim1 adds on top (projection layer, not in infinite-brain)

- **`no`**: kim1's store-global sequential number, in frontmatter + the projected
  document name. Immutable. (See root `CONTEXT.md`, ADR-0001/0002.)
- **namespace folders**: nodes are filed `kim1/{namespace}/{doctype}/` where `doctype`
  is the plural folder name derived from `type` (concept→concepts, hypothesis→hypotheses…).
- **node sheet projection**: each node → one Google Sheet named
  `kim1_{no}_{namespace}_{doctype}_{visibility}_{title}`, read by a phone Gemini
  (ADR-0003). Edges embed the full target document name (ADR-0002).

kim1 does not use infinite-brain's Obsidian app, skills, or `raw/` intake — only the
node schema. See root `CONTEXT.md` for the kim1 domain language.
