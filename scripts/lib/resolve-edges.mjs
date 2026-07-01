// Resolve edges (target id → full document name) at projection time. Pure. (issue 03, ADR-0002)
// Edges are infinite-brain objects {target, type, weight, note}.

import { docName } from "./doc-name.mjs";

export function buildIndex(nodes) {
  const idToName = {}, idToTitle = {};
  for (const n of nodes) {
    idToName[n.id] = docName(n);
    idToTitle[n.id] = n.title;
  }
  return { idToName, idToTitle };
}

export function resolveEdges(node, { idToName, idToTitle }) {
  return (node.edges || []).map((e) => {
    const targetName = idToName[e.target];
    return targetName
      ? { type: e.type, weight: e.weight, note: e.note, targetName, targetTitle: idToTitle[e.target], resolved: true }
      : { type: e.type, weight: e.weight, note: e.note, targetName: `(미해석: ${e.target})`, targetTitle: "", resolved: false };
  });
}
