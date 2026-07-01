# kim-1

kim-1 is a personal knowledge assistant instance: an atomic typed-markdown knowledge graph, versioned locally in git, projected one-way to a Google Spreadsheet that a phone Gemini reads for graph lookup. Derived from the `kim` product, run entirely locally (no CI).

## Language

**Vault**:
The atomic typed-markdown knowledge graph — each node a small markdown file with typed frontmatter, connected by typed edges. Vault nodes **are** infinite-brain nodes (same frontmatter/type/edge/visibility schema); kim-1 only adds a projection layer. The Obsidian app is out of scope. The **source of truth**. See `docs/infinite-brain/`.
_Avoid_: notes, Obsidian vault, database

**Node**:
One atomic markdown file — a full infinite-brain node (frontmatter fields `id, title, type, namespace, visibility, summary, tags, edges, confidence, …` per `docs/infinite-brain/FRONTMATTER-SCHEMA.md`) plus kim-1's `no`. Knowledge is decomposed into nodes, never stored as long documents.
_Avoid_: note, document, page

**Node type**:
The node's kind — exactly one of the 17 infinite-brain types (`concept`, `fact`, `decision`, `event`, `source`, `hypothesis`, `pattern`, `pillar`, `question`, `playbook`, `task`, `bookmark`, `note`, `contact`, `reference`, `custom`, `log`). Frontmatter field `type` is **singular** (`concept`); the **doctype** is its plural folder name (`concepts`) used in the folder path and document name.
_Avoid_: kind, category, namespace (namespace is now the domain partition)

**Edge**:
A directed typed link in a node's `edges`, as an infinite-brain object `{target, type, weight, note}` — `target` is the destination node `id`, `type` is one of the 10 edge types (`related_to`, `depends_on`, `derived_from`, `contradicts`, `supports`, `part_of`, `preceded_by`, `followed_by`, `authored_by`, `tagged_with`). At projection time `target` (an `id`) resolves to the target's full document name (ADR-0002).
_Avoid_: link, rel, relation

**Derived repo**:
This `kim-1` git repository — an instance derived from the `kim` product. Git is only versioned local storage for the vault; it runs no GitHub Actions and no remote automation.
_Avoid_: fork, clone

**Knowledge store**:
An independent body of knowledge a person can access — e.g. `kim-1` (personal), `kim-2`, a team store. One person may hold several. **One project manages exactly one store** (this project = `kim-1`). The store name is the top-level targeting key.
_Avoid_: vault (that's the local files), project, workspace

**Node sheet**:
The Google Spreadsheet projection of **one** node — a strict **1:1** with the markdown node (one node → one sheet document). The read surface the phone Gemini queries; generated one-way, never edited by hand, never synced back. There is **no aggregated sheet** — unlike eb/k4, nothing is gathered into a single CSV/spreadsheet, and there is no Cloudflare/Pages publish.
_Avoid_: graph sheet, mirror, aggregate, export

**Document naming convention**:
Because Gemini Live ignores which Drive folder a sheet lives in, targeting is encoded in the document *name*: `{store}_{no}_{namespace}_{doctype}_{visibility}_{title}` (e.g. `kim-1_1_personal_concepts_public_복리`). This is how "only kim-1 knowledge" is selected among all of a person's Google docs. Sheets are also filed on disk as `kim-1/{namespace}/{doctype}/{document}` — folders are for **human browsing only**, never for targeting.
_Avoid_: path targeting, folder targeting

**id**:
A node's original, stable identifier (from the infinite-brain node itself). Never changes. What edges reference.
_Avoid_: no, key

**no**:
kim-1's own sequential number for a node — **globally unique within the store, regardless of namespace** (1, 2, 3, …). Distinct from `id`. Immutable once assigned. Appears in **both** the local markdown filename and the `{no}` slot of the sheet document name.
_Avoid_: id, index, docNumber

**Namespace**:
The **project / team / domain** partition of the store (infinite-brain sense) — kebab-case, e.g. `personal`, `product-ops`, `growth`. The top folder level under the store (`kim-1/{namespace}/…`) and the first name slot after `no`. Distinct from **node type**: a namespace groups by domain, a type groups by kind. Enables scoped filtering.
_Avoid_: node type, doctype, category, folder-as-type

**Visibility**:
A per-node access modifier — one of the 4 infinite-brain values `public`, `namespace`, `private`, `system` (default `namespace`), controlling when an agent may use the node. Carried in frontmatter and the document name. **Immutable once set** — so it never breaks the full document names embedded in edges.
_Avoid_: access control, permission, public/private-only

**Phone Gemini**:
The phone-side Gemini (incl. Gemini Live). A read-only **consumer** that reads individual node sheets by name and follows edges to traverse — it does not produce or edit knowledge (kim-1 is not bidirectional).
_Avoid_: producer, agent, watcher

**Knowledge work**:
A session of building or maintaining the vault (decomposing raw material into nodes, querying, organizing, health checks) done locally in Claude Code. Finishing a knowledge-work session is what triggers the sync to Drive/the graph sheet.
_Avoid_: sync, task, job
