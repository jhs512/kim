// Instance config. The engine is the product (store-agnostic); the store name comes
// from kim.config.json at the instance root, so the same code serves kim1, kim-2, ….

import { readFileSync } from "node:fs";
import { join } from "node:path";

function readStore() {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "kim.config.json"), "utf8")).store || "kim1";
  } catch {
    return "kim1";
  }
}

export const STORE = readStore();
