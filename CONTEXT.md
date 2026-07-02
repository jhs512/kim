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

**비서코드 (Assistant code)**:
The code identifying one assistant instance — e.g. `kim-1`, `eb1`, `my55`. It is the top-level targeting key: the prefix of every node-sheet document name and of the work-queue calendar (`{비서코드}-calendar`). On the phone, the user selects the active assistant by saying "**비서 {비서코드}**"; the phone then uses only that code's sheets and calendar. **One project manages exactly one assistant** (this project = `kim-1`); multiple assistants means multiple projects.
_Avoid_: 저장소 코드/store code, workspace, project

**Node sheet**:
The Google Spreadsheet projection of **one** node — a strict **1:1** with the markdown node (one node → one sheet document). The read surface the phone Gemini queries; generated one-way, never edited by hand, never synced back. There is **no aggregated sheet** — unlike eb/k4, nothing is gathered into a single CSV/spreadsheet, and there is no Cloudflare/Pages publish.
_Avoid_: graph sheet, mirror, aggregate, export

**Document naming convention**:
Because Gemini Live ignores which Drive folder a sheet lives in, targeting is encoded in the document *name*: `{비서코드}_{no}_{namespace}_{doctype}_{visibility}_{title}` (e.g. `kim-1_1_personal_concepts_public_복리`). This is how "only this assistant's knowledge" is selected among all of a person's Google docs. Sheets are also filed on disk as `kim-1/{namespace}/{doctype}/{document}` — folders are for **human browsing only**, never for targeting.
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
The phone-side Gemini (incl. Gemini Live). The user-facing surface. It **directly** does its allowed capabilities (Gmail read, Calendar CRUD, Drive read/create, knowledge recall by reading node sheets and traversing edges) and for anything else it **never refuses** — it silently files a 작업 on the 작업 큐. It never edits knowledge nodes directly (그건 워커가 함, so the vault stays worker-only, not bidirectional).
_Avoid_: read-only consumer, producer, watcher

**능력 경계 (Capability boundary)**:
The split between what the phone does **직접(directly, now)** — Gmail read, Calendar event CRUD, Drive read/create, knowledge recall — and what it **큐로(queues)** — Gmail send/reply, editing an existing doc, saving to the knowledge store (distillation), long research, everything else.
_Avoid_: permissions, scopes

**작업 (Task)**:
One unit of queued work = one event on the 작업 큐. Title `{아이콘}[{상태}] {요약}`; description has `요청:` / `필요정보:` / `이력:`. **Append-only and non-destructive** — never deleted or overwritten; state changes by swapping the `[상태]` token and appending to `이력:`.
_Avoid_: job, ticket, todo (todo is the calendar UI word)

**작업 큐 (Task queue)**:
The `{비서코드}-calendar` used as the work queue between the phone (producer) and the 워커 (consumer). **Time-gated**: the 워커 only picks up `대기` tasks whose start time ≤ now — a future start time schedules the task. Recurring work re-registers itself as a new `대기` task at the next time on completion (not native calendar recurrence).
_Avoid_: inbox, backlog

**작업 상태 (Task state)**:
One of `대기` / `작업중` / `성공` / `실패` / `정보필요`. `정보필요` states *what* info is needed and *why*; the user supplies it and flips the task back to `대기` to resume. `실패` is **not auto-retried** (left for a human). `성공`/`실패` tasks **stay** on the calendar as history.
_Avoid_: status, phase

**워커 (Worker)**:
The kim-1 Claude Code loop that drains the 작업 큐 and runs the state machine (`대기`→`작업중`→`성공`|`실패`|`정보필요`). "자동으로 재개"means the worker loop is running/scheduled; the phone cannot do queued work itself.
_Avoid_: daemon, cron, agent

**Knowledge work**:
A session of building or maintaining the vault (decomposing raw material into nodes, querying, organizing, health checks) done locally in Claude Code. Finishing a knowledge-work session is what triggers the sync to Drive/the graph sheet.
_Avoid_: sync, task, job
