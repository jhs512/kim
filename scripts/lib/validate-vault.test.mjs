import { test } from "node:test";
import assert from "node:assert/strict";
import { validateVault } from "./validate-vault.mjs";

const N = (over) => ({ id: "a", no: 1, namespace: "concepts", visibility: "private", title: "t", edges: [], ...over });
const clean = [
  N({ id: "a", no: 1, edges: [{ target: "b", type: "related_to" }] }),
  N({ id: "b", no: 2 }),
];

test("a clean vault yields no violations", () => {
  assert.deepEqual(validateVault(clean), []);
});

test("duplicate no is reported", () => {
  const v = validateVault([N({ id: "a", no: 1 }), N({ id: "b", no: 1 })]);
  assert.equal(v.filter((x) => x.type === "duplicate-no").length, 1);
});

test("duplicate id is reported", () => {
  const v = validateVault([N({ id: "a", no: 1 }), N({ id: "a", no: 2 })]);
  assert.equal(v.filter((x) => x.type === "duplicate-id").length, 1);
});

test("orphan edge (target id not in vault) is reported with source and target", () => {
  const v = validateVault([N({ id: "a", no: 1, edges: [{ target: "ghost", type: "related_to" }] })]);
  const o = v.find((x) => x.type === "orphan-edge");
  assert.ok(o && o.from === "a" && o.to === "ghost");
});

test("immutable violation: visibility changed vs previous manifest", () => {
  const prev = { a: { no: 1, visibility: "public" } };
  const v = validateVault([N({ id: "a", no: 1, visibility: "private" })], prev);
  assert.ok(v.find((x) => x.type === "immutable" && x.field === "visibility"));
});

test("immutable violation: no changed vs previous manifest", () => {
  const prev = { a: { no: 9, visibility: "private" } };
  const v = validateVault([N({ id: "a", no: 1 })], prev);
  assert.ok(v.find((x) => x.type === "immutable" && x.field === "no"));
});

test("reports all problems at once, not just the first", () => {
  const v = validateVault([
    N({ id: "a", no: 1, edges: [{ target: "ghost", type: "related_to" }] }),
    N({ id: "a", no: 1 }),
  ]);
  const types = new Set(v.map((x) => x.type));
  assert.ok(types.has("duplicate-no") && types.has("duplicate-id") && types.has("orphan-edge"));
});
