# Edges embed the full target document name; `no` and `visibility` are immutable

In a node sheet, each edge row (an infinite-brain `{target, type, weight, note}` edge) stores the **full target document name** (`{store}_{no}_{namespace}_{doctype}_{visibility}_{title}`) resolved from the edge's `target` id, so the phone Gemini can open the linked node directly by exact name — the most reliable operation for Gemini Live. The markdown source keeps stable `id`-based edges; `convert`/sync resolves `id` → the target's current full name at projection time, and a full re-projection each sync keeps every embedded name current.

To keep embedded names from breaking, two of the four name components are frozen: **`no`** (kim-1's own store-global-unique sequential number, distinct from the node's `id`) is immutable once assigned, and **`visibility`** (the access modifier) is immutable once set. `no` also appears in the local markdown filename. Only `title` and `namespace` can still change, and those are absorbed by the full re-projection. The `title` slot in the document name is **slugged** (whitespace and `_` → `-`) so the name stays free of spaces/separators and can be opened by exact name reliably; the human-readable `title` field itself is unchanged. See `.scratch/vault-sync/` (issue 02).

## Considered options

- **Store only `no`, resolve via `kim-1_{no}_` name-prefix search** (rejected): survives `title`/`visibility` changes with no re-projection, but relies on Gemini reliably doing prefix search rather than opening an exact name. We preferred exact-name opening.
- **Store `id`, keep a separate `id`→`no` index document** (rejected): reintroduces an aggregate document, conflicting with ADR-0001, and needs two lookups per hop.
