// Orchestrates the tested pure modules into per-node Drive payloads. (issue 06, node side)
// No network: parses vault → validates (abort on violations) → resolves edges →
// builds cell values → writes create.json / q.json / values.json + plan.tsv.
// The bash driver (sync.sh) consumes these and talks to gws.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseNode } from "./lib/parse-node.mjs";
import { validateVault } from "./lib/validate-vault.mjs";
import { buildIndex, resolveEdges } from "./lib/resolve-edges.mjs";
import { buildValues } from "./lib/build-values.mjs";
import { docName, doctypeOf } from "./lib/doc-name.mjs";

const ROOT = process.cwd();
const VAULT = join(ROOT, "vault");
const OUT = process.argv[2] || join(ROOT, ".sync", "payloads");
const MANIFEST = join(ROOT, ".sync", "manifest.tsv");

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (e.endsWith(".md")) out.push(p);
  }
  return out;
}

function loadPrevManifest() {
  if (!existsSync(MANIFEST)) return null;
  const prev = {};
  for (const line of readFileSync(MANIFEST, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [no, , id, visibility] = line.split("\t");
    prev[id] = { no: Number(no), visibility };
  }
  return prev;
}

mkdirSync(OUT, { recursive: true });
const nodes = walk(VAULT).map((p) => parseNode(readFileSync(p, "utf8")));

const violations = validateVault(nodes, loadPrevManifest());
if (violations.length) {
  console.error(`✖ ${violations.length} vault violation(s) — aborting, no sync:`);
  for (const v of violations) console.error(`  - [${v.type}] ${v.message}`);
  process.exit(1);
}

const index = buildIndex(nodes);
const plan = [];
for (const n of nodes) {
  const name = docName(n);
  const values = buildValues(n, resolveEdges(n, index));
  const base = join(OUT, String(n.no));
  writeFileSync(`${base}.create.json`, JSON.stringify({ properties: { title: name } }));
  writeFileSync(`${base}.q.json`, JSON.stringify({
    q: `name = '${name}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    fields: "files(id,name)",
  }));
  writeFileSync(`${base}.values.json`, JSON.stringify({ values }));
  plan.push([n.no, name, n.id, n.visibility, n.namespace, doctypeOf(n.type), base].join("\t"));
}
writeFileSync(join(OUT, "plan.tsv"), plan.join("\n") + "\n");
console.log(`✔ ${nodes.length} nodes validated → payloads in ${OUT}`);
