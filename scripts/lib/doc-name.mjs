// Build the targeting document name; make the title slot safe for exact-name
// opening (ADR-0002 traversal). Pure. (issue 02)
//
// Node name = kim-1_{no}_{namespace}_{doctype}_{visibility}_{title}, where doctype
// is the plural folder name of the node `type` (infinite-brain: type singular, folder plural).

import { STORE } from "./config.mjs";

// infinite-brain node type (singular) → folder name (plural). See docs/infinite-brain/NODE-TYPES.md.
const TYPE_FOLDER = {
  pillar: "pillars", decision: "decisions", concept: "concepts", question: "questions",
  playbook: "playbooks", task: "tasks", event: "events", pattern: "patterns",
  hypothesis: "hypotheses", fact: "facts", source: "sources", bookmark: "bookmarks",
  note: "notes", contact: "contacts", reference: "references", custom: "custom", log: "logs",
};

export function doctypeOf(type) {
  const folder = TYPE_FOLDER[type];
  if (!folder) throw new Error(`unknown node type: ${type}`);
  return folder;
}

// Only whitespace and the slot-separator `_` are transformed; unicode letters kept.
export function titleSlug(title) {
  return title.trim().replace(/[\s_]+/g, "-");
}

export function docName(node) {
  return `${STORE}_${node.no}_${node.namespace}_${doctypeOf(node.type)}_${node.visibility}_${titleSlug(node.title)}`;
}
