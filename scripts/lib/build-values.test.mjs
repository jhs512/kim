import { test } from "node:test";
import assert from "node:assert/strict";
import { buildValues } from "./build-values.mjs";

const node1 = {
  no: 1, namespace: "personal", type: "concept", visibility: "public",
  id: "concept-compound", title: "복리",
  tags: ["finance", "compounding"], summary: "이자에도 이자.", confidence: 0.95,
  body: "첫 줄\n둘째 줄",
};
const edges1 = [
  { type: "related_to", weight: 0.6, note: "대비", targetName: "kim-1_2_personal_concepts_public_단리", targetTitle: "단리" },
  { type: "related_to", weight: 0.8, note: "수식", targetName: "kim-1_3_personal_facts_public_복리-공식", targetTitle: "복리 공식" },
];

test("builds the full node-sheet cell layout (metadata + body + edges table)", () => {
  assert.deepEqual(buildValues(node1, edges1), [
    ["no", "1"],
    ["namespace", "personal"],
    ["type", "concept"],
    ["visibility", "public"],
    ["id", "concept-compound"],
    ["title", "복리"],
    ["tags", "finance, compounding"],
    ["summary", "이자에도 이자."],
    ["confidence", "0.95"],
    ["body", "첫 줄\n둘째 줄"],
    [],
    ["── edges ──"],
    ["type", "target_doc_name", "target_title", "weight", "note"],
    ["related_to", "kim-1_2_personal_concepts_public_단리", "단리", "0.6", "대비"],
    ["related_to", "kim-1_3_personal_facts_public_복리-공식", "복리 공식", "0.8", "수식"],
  ]);
});

test("a node with no edges has the header rows but no edge rows; empty tags → \"\"", () => {
  const rows = buildValues({ ...node1, tags: [] }, []);
  assert.deepEqual(rows[rows.length - 1], ["type", "target_doc_name", "target_title", "weight", "note"]);
  assert.equal(rows.find((r) => r[0] === "tags")[1], "");
});
