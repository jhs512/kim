# Graph entry is by full-text search of node-sheet contents; names carry traversal only

A phone-Gemini query is answered by first finding an **entry node**, then traversing edges from it. Entry is done by **full-text search over the contents of node sheets** (the cell values), not by document-name matching. Gemini searches the body/summary/aliases text of the sheets, opens the most relevant node, and from there follows edges by exact document name (ADR-0002).

This splits the two jobs cleanly: **content search = entry** (fuzzy, natural-language, recall-oriented), **document name = traversal** (exact, reliable open of a known target). The naming convention (ADR-0001/0002) is therefore *not* the entry mechanism — it is only how an already-identified target is opened.

## Consequences

- Node sheets must be **search-optimized**: each node carries explicit searchable anchors — `aliases`/keywords and a one-line `summary` — in addition to its body, so content search reliably lands on the right node.
- Higher recall, lower precision than exact-name entry: Gemini may enter at a near-miss node. Edge traversal is the corrective — a wrong-but-adjacent entry still reaches the answer by following typed edges.
- Sheet cell layout is driven by what Gemini's Drive content search indexes well (plain text in cells), not by human spreadsheet ergonomics.

## Considered options

- **Entry by document-name keyword search** (rejected): reuses the naming convention but depends on the person's query matching the `title` slot; misses knowledge whose relevant terms live in the body, not the title.
- **A per-namespace index/hub node** (rejected): reintroduces an aggregate document, conflicting with ADR-0001, and adds a hop before real content.
