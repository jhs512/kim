import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDb, search, neighbors, health } from "./db.mjs";

const stub = (n) => `doc-${n.id}`;
const N = (o) => ({ tags: [], edges: [], body: "", summary: "", confidence: 1, ...o });
const nodes = [
  N({ id: "concept-compound", no: 1, title: "복리", summary: "이자에 이자", tags: ["finance"], confidence: 0.95,
      body: "복리는 기하급수적으로 늘어난다", edges: [{ target: "fact-formula", type: "related_to", weight: 0.8, note: "" }] }),
  N({ id: "concept-simple", no: 2, title: "단리", summary: "원금에만", tags: ["finance"], confidence: 0.9,
      edges: [{ target: "concept-compound", type: "related_to", weight: 0.6, note: "" }] }),
  N({ id: "fact-formula", no: 3, title: "복리 공식", summary: "A=P(1+r/n)^nt", tags: ["formula"], confidence: 1.0,
      edges: [{ target: "concept-compound", type: "supports", weight: 0.9, note: "" }] }),
  N({ id: "concept-orphan", no: 4, title: "외톨이", summary: "", tags: [], confidence: 0.3, body: "", edges: [] }),
];
const db = buildDb(nodes, stub);

test("search matches 2-char Korean as substring and ranks by field count", () => {
  const r = search(db, "복리"); // must catch 복리 inside 복리는 (body) — the FTS5 failure case
  assert.equal(r[0].id, "concept-compound"); // title + body = 2
  assert.deepEqual(r.map((x) => x.id), ["concept-compound", "fact-formula"]);
  assert.ok(!r.map((x) => x.id).includes("concept-simple"));
});

test("search 2-char 이자 and case-insensitive tag match", () => {
  assert.ok(search(db, "이자").map((x) => x.id).includes("concept-compound"));
  assert.ok(search(db, "FINANCE").map((x) => x.id).includes("concept-compound")); // LIKE ascii case-insensitive
});

test("neighbors uses recursive CTE, both directions, up to depth, never self", () => {
  assert.deepEqual(neighbors(db, "concept-compound", 1).map((r) => r.id).sort(), ["concept-simple", "fact-formula"]);
  const d2 = neighbors(db, "fact-formula", 2).map((r) => r.id);
  assert.ok(d2.includes("concept-compound") && d2.includes("concept-simple"));
  assert.ok(!d2.includes("fact-formula"));
});

test("health flags orphans, low confidence, empty summary, broken edges", () => {
  const db2 = buildDb([...nodes, N({ id: "x", no: 5, title: "x", confidence: 0.9,
    edges: [{ target: "ghost", type: "related_to", weight: 0.5, note: "" }] })], stub);
  const h = health(db2);
  assert.ok(h.orphans.includes("concept-orphan"));
  assert.ok(h.lowConfidence.includes("concept-orphan"));
  assert.ok(h.emptySummary.includes("concept-orphan"));
  assert.ok(h.brokenEdges.some((e) => e.from === "x" && e.to === "ghost"));
});
