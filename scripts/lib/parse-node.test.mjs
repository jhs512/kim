import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseNode, NodeError } from "./parse-node.mjs";

const VAULT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "vault");
const REQ = "id: n-x\nno: 1\ntitle: t\ntype: concept\nnamespace: personal\nvisibility: public";
const withFm = (fm) => `---\n${fm}\n---\nbody`;

test("parses required infinite-brain fields, coerces no, empty edge/tag defaults", () => {
  const n = parseNode(withFm(REQ));
  assert.equal(n.id, "n-x");
  assert.equal(n.no, 1);
  assert.equal(n.title, "t");
  assert.equal(n.type, "concept");
  assert.equal(n.namespace, "personal");
  assert.equal(n.visibility, "public");
  assert.deepEqual(n.edges, []);
  assert.deepEqual(n.tags, []);
  assert.deepEqual(n.related, []);
});

test("no must be an integer", () => {
  assert.equal(parseNode(withFm(REQ.replace("no: 1", "no: 42"))).no, 42);
  assert.throws(() => parseNode(withFm(REQ.replace("no: 1", "no: 1.5"))), NodeError);
  assert.throws(() => parseNode(withFm(REQ.replace("no: 1", "no: x"))), NodeError);
});

test("visibility accepts the 4 infinite-brain values, rejects others", () => {
  for (const v of ["public", "namespace", "private", "system"]) {
    assert.equal(parseNode(withFm(REQ.replace("visibility: public", `visibility: ${v}`))).visibility, v);
  }
  assert.throws(() => parseNode(withFm(REQ.replace("visibility: public", "visibility: secret"))), NodeError);
});

test("missing a required field throws NodeError naming it", () => {
  assert.throws(
    () => parseNode(withFm(REQ.replace("type: concept\n", ""))),
    (e) => e instanceof NodeError && /type/.test(e.message),
  );
});

test("quoted scalars strip quotes; boolean and float coerce", () => {
  const n = parseNode(withFm(`${REQ}\napplicable_when: "Empty"\nauto_inject: false\nconfidence: 0.95`));
  assert.equal(n.applicable_when, "Empty");
  assert.equal(n.auto_inject, false);
  assert.equal(n.confidence, 0.95);
});

test("single-line flow arrays (tags, related) parse", () => {
  const n = parseNode(withFm(`${REQ}\ntags: ["finance", "interest"]\nrelated: ["[[concept-x]]", "fact-y"]`));
  assert.deepEqual(n.tags, ["finance", "interest"]);
  assert.deepEqual(n.related, ["[[concept-x]]", "fact-y"]);
});

test("multiline edges flow array parses to {target,type,weight,note} objects", () => {
  const fm = `${REQ}\nedges: [\n  {"target": "b", "type": "related_to", "weight": 0.6, "note": "n1"},\n  {"target": "c", "type": "supports", "weight": 0.9, "note": "n2"}\n]`;
  assert.deepEqual(parseNode(withFm(fm)).edges, [
    { target: "b", type: "related_to", weight: 0.6, note: "n1" },
    { target: "c", type: "supports", weight: 0.9, note: "n2" },
  ]);
});

test("body is text after the closing ---, trimmed, multi-line preserved", () => {
  const n = parseNode(`---\n${REQ}\n---\n\n첫 줄\n둘째 줄\n`);
  assert.equal(n.body, "첫 줄\n둘째 줄");
});

test("all 3 existing vault nodes parse as full infinite-brain nodes", () => {
  const files = [
    "personal/concepts/1_compound-interest.md",
    "personal/concepts/2_simple-interest.md",
    "personal/facts/3_compound-formula.md",
  ];
  const n1 = parseNode(readFileSync(join(VAULT, files[0]), "utf8"));
  assert.equal(n1.type, "concept");
  assert.equal(n1.edges.length, 2);
  assert.equal(n1.edges[0].target, "concept-simple-interest");
  assert.equal(n1.edges[0].type, "related_to");
  assert.ok(n1.tags.includes("finance"));
  for (const f of files) {
    const n = parseNode(readFileSync(join(VAULT, f), "utf8"));
    assert.ok(Number.isInteger(n.no) && n.id && n.title && n.type);
  }
});
