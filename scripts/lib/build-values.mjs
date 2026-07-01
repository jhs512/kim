// Build the node-sheet 2D cell array from a resolved node. Pure, no I/O. (issue 04)
// Projects the retrieval-relevant subset of the infinite-brain schema; search anchors
// for full-text entry (ADR-0003) are tags + summary + body.

export function buildValues(node, resolvedEdges) {
  return [
    ["no", String(node.no)],
    ["namespace", node.namespace],
    ["type", node.type],
    ["visibility", node.visibility],
    ["id", node.id],
    ["title", node.title],
    ["tags", (node.tags || []).join(", ")],
    ["summary", node.summary || ""],
    ["confidence", node.confidence != null ? String(node.confidence) : ""],
    ["body", node.body],
    [],
    ["── edges ──"],
    ["type", "target_doc_name", "target_title", "weight", "note"],
    ...resolvedEdges.map((e) => [
      e.type,
      e.targetName,
      e.targetTitle,
      e.weight != null ? String(e.weight) : "",
      e.note || "",
    ]),
  ];
}
