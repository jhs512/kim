// SQLite index over the vault — derived, disposable (markdown is source of truth).
// Text search = LIKE substring (Korean-safe; FTS5 misses 2-char Korean queries).
// Graph traversal = recursive CTE. Uses Node's built-in node:sqlite (no external dep).

import { DatabaseSync } from "node:sqlite";

export function buildDb(nodes, docNameFn, path = ":memory:") {
  const db = new DatabaseSync(path);
  db.exec(`
    DROP TABLE IF EXISTS nodes; DROP TABLE IF EXISTS edges;
    CREATE TABLE nodes(id TEXT PRIMARY KEY, no INTEGER, title TEXT, type TEXT,
      namespace TEXT, visibility TEXT, summary TEXT, confidence REAL, body TEXT, tags TEXT, doc_name TEXT);
    CREATE TABLE edges(src TEXT, type TEXT, target TEXT, weight REAL, note TEXT);
  `);
  const insN = db.prepare(`INSERT OR REPLACE INTO nodes VALUES(?,?,?,?,?,?,?,?,?,?,?)`);
  const insE = db.prepare(`INSERT INTO edges VALUES(?,?,?,?,?)`);
  for (const n of nodes) {
    insN.run(n.id, n.no ?? null, n.title ?? "", n.type ?? "", n.namespace ?? "", n.visibility ?? "",
      n.summary ?? "", n.confidence ?? null, n.body ?? "", (n.tags || []).join(" "),
      docNameFn ? docNameFn(n) : "");
    for (const e of n.edges || []) insE.run(n.id, e.type, e.target, e.weight ?? null, e.note ?? "");
  }
  return db;
}

// rank by number of fields (id/title/summary/tags/body) whose text contains the query
export function search(db, q) {
  return db.prepare(`
    SELECT id, title, score FROM (
      SELECT id, title,
        ((id LIKE :q)+(title LIKE :q)+(summary LIKE :q)+(tags LIKE :q)+(body LIKE :q)) AS score
      FROM nodes
    ) WHERE score > 0 ORDER BY score DESC, id ASC
  `).all({ q: `%${q}%` });
}

// ids reachable within `depth` hops, following edges in both directions (never self)
export function neighbors(db, id, depth = 1) {
  return db.prepare(`
    WITH RECURSIVE adj(a, b) AS (
      SELECT src, target FROM edges UNION SELECT target, src FROM edges
    ),
    reach(id, d) AS (
      SELECT :id, 0
      UNION
      SELECT adj.b, reach.d + 1 FROM adj JOIN reach ON adj.a = reach.id WHERE reach.d < :depth
    )
    SELECT DISTINCT r.id AS id, n.title AS title
    FROM reach r LEFT JOIN nodes n ON n.id = r.id
    WHERE r.id <> :id ORDER BY r.id
  `).all({ id, depth });
}

export function health(db) {
  const ids = (rows) => rows.map((r) => r.id);
  return {
    orphans: ids(db.prepare(`
      SELECT id FROM nodes WHERE id NOT IN (SELECT src FROM edges)
        AND id NOT IN (SELECT e.target FROM edges e JOIN nodes n ON n.id = e.target)
      ORDER BY id`).all()),
    lowConfidence: ids(db.prepare(`SELECT id FROM nodes WHERE confidence IS NOT NULL AND confidence < 0.5 ORDER BY id`).all()),
    emptySummary: ids(db.prepare(`SELECT id FROM nodes WHERE summary = '' ORDER BY id`).all()),
    brokenEdges: db.prepare(`
      SELECT src AS "from", target AS "to" FROM edges
      WHERE target NOT IN (SELECT id FROM nodes) ORDER BY src, target`).all(),
  };
}
