import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIndex, resolveEdges } from "./resolve-edges.mjs";

const nodes = [
  { id: "concept-compound", no: 1, namespace: "personal", type: "concept", visibility: "public", title: "복리",
    edges: [
      { target: "concept-simple", type: "related_to", weight: 0.6, note: "대비" },
      { target: "fact-formula", type: "related_to", weight: 0.8, note: "수식" },
    ] },
  { id: "concept-simple", no: 2, namespace: "personal", type: "concept", visibility: "public", title: "단리", edges: [] },
  { id: "fact-formula", no: 3, namespace: "personal", type: "fact", visibility: "public", title: "복리 공식", edges: [] },
];

test("buildIndex maps every id to its docName and title", () => {
  const { idToName, idToTitle } = buildIndex(nodes);
  assert.equal(idToName["concept-simple"], "kim-1_2_personal_concepts_public_단리");
  assert.equal(idToName["fact-formula"], "kim-1_3_personal_facts_public_복리-공식");
  assert.equal(idToTitle["fact-formula"], "복리 공식");
});

test("resolvable edges carry type/weight/note + slugged full name + title", () => {
  const idx = buildIndex(nodes);
  assert.deepEqual(resolveEdges(nodes[0], idx), [
    { type: "related_to", weight: 0.6, note: "대비", targetName: "kim-1_2_personal_concepts_public_단리", targetTitle: "단리", resolved: true },
    { type: "related_to", weight: 0.8, note: "수식", targetName: "kim-1_3_personal_facts_public_복리-공식", targetTitle: "복리 공식", resolved: true },
  ]);
});

test("an edge to an unknown target id is marked, never dropped", () => {
  const idx = buildIndex(nodes);
  const node = { edges: [{ target: "ghost", type: "cites", weight: 0.5, note: "n" }] };
  assert.deepEqual(resolveEdges(node, idx), [
    { type: "cites", weight: 0.5, note: "n", targetName: "(미해석: ghost)", targetTitle: "", resolved: false },
  ]);
});

test("복리 node resolves both edges with zero unresolved", () => {
  const idx = buildIndex(nodes);
  assert.equal(resolveEdges(nodes[0], idx).filter((e) => !e.resolved).length, 0);
});
