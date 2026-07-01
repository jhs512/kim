// kim.mjs — kim-1 vault graph CLI backed by a SQLite index (node:sqlite).
// Markdown is the source of truth; .kim/graph.db is a disposable derived index,
// auto-rebuilt when the vault is newer. Read-only over knowledge. Usage:
//   node scripts/kim.mjs build                       # (re)compile vault → .kim/graph.db
//   node scripts/kim.mjs list | search <질의> | node <id> | neighbors <id> [--depth N] | health

import { readFileSync, readdirSync, statSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { parseNode } from "./lib/parse-node.mjs";
import { buildDb, search, neighbors, health } from "./lib/db.mjs";
import { docName } from "./lib/doc-name.mjs";

const ROOT = process.cwd();
const VAULT = join(ROOT, "vault");
const DB = join(ROOT, ".kim", "graph.db");

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (e.endsWith(".md")) out.push(p);
  }
  return out;
}

function build() {
  mkdirSync(join(ROOT, ".kim"), { recursive: true });
  const nodes = walk(VAULT).map((p) => parseNode(readFileSync(p, "utf8")));
  return buildDb(nodes, docName, DB);
}

// return an open db, rebuilding if the index is missing or older than the vault
function getDb() {
  const files = walk(VAULT);
  const newest = Math.max(0, ...files.map((f) => statSync(f).mtimeMs));
  if (existsSync(DB) && statSync(DB).mtimeMs >= newest) return new DatabaseSync(DB);
  return build();
}

const [cmd, ...rest] = process.argv.slice(2);

switch (cmd) {
  case "build": {
    build();
    console.log(`built ${DB}`);
    break;
  }
  case "list": {
    const db = getDb();
    for (const r of db.prepare(`SELECT no, type, id, title FROM nodes ORDER BY no`).all())
      console.log(`${r.no}\t${r.type}\t${r.id}\t${r.title}`);
    break;
  }
  case "search": {
    for (const r of search(getDb(), rest.join(" "))) console.log(`${r.score}\t${r.id}\t${r.title}`);
    break;
  }
  case "node": {
    const db = getDb();
    const n = db.prepare(`SELECT * FROM nodes WHERE id = ?`).get(rest[0]);
    if (!n) { console.error(`no such node: ${rest[0]}`); process.exit(1); }
    console.log(`● ${n.id}  [${n.type}/${n.namespace}]  conf=${n.confidence ?? "?"}`);
    console.log(`  title: ${n.title}`);
    console.log(`  doc:   ${n.doc_name}`);
    if (n.summary) console.log(`  summary: ${n.summary}`);
    for (const e of db.prepare(`SELECT * FROM edges WHERE src = ? ORDER BY target`).all(n.id))
      console.log(`  → ${e.type}(${e.weight ?? "?"}) ${e.target}  ${e.note || ""}`);
    const back = db.prepare(`SELECT src FROM edges WHERE target = ? ORDER BY src`).all(n.id).map((r) => r.src);
    if (back.length) console.log(`  ← backlinks: ${back.join(", ")}`);
    break;
  }
  case "neighbors": {
    const di = rest.indexOf("--depth");
    const depth = di >= 0 ? Number(rest[di + 1]) : 1;
    for (const r of neighbors(getDb(), rest[0], depth)) console.log(`${r.id}\t${r.title ?? "?"}`);
    break;
  }
  case "health": {
    const h = health(getDb());
    console.log(`orphans (${h.orphans.length}): ${h.orphans.join(", ") || "—"}`);
    console.log(`low confidence <0.5 (${h.lowConfidence.length}): ${h.lowConfidence.join(", ") || "—"}`);
    console.log(`empty summary (${h.emptySummary.length}): ${h.emptySummary.join(", ") || "—"}`);
    console.log(`broken edges (${h.brokenEdges.length}): ${h.brokenEdges.map((e) => `${e.from}→${e.to}`).join(", ") || "—"}`);
    break;
  }
  default:
    console.log("usage: kim.mjs <build|list|search|node|neighbors|health> ...");
    process.exit(cmd ? 1 : 0);
}
