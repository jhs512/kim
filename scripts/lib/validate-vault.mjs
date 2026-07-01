// Cross-node vault validation before any network call. Reports ALL violations. (issue 05)

export function validateVault(nodes, prevManifest = null) {
  const v = [];

  const byNo = new Map(), byId = new Map();
  for (const n of nodes) {
    (byNo.get(n.no) || byNo.set(n.no, []).get(n.no)).push(n.id);
    (byId.get(n.id) || byId.set(n.id, []).get(n.id)).push(n.no);
  }
  for (const [no, ids] of byNo) {
    if (ids.length > 1) v.push({ type: "duplicate-no", no, ids, message: `no ${no} used by ${ids.join(", ")}` });
  }
  for (const [id, nos] of byId) {
    if (nos.length > 1) v.push({ type: "duplicate-id", id, message: `id ${id} used by no ${nos.join(", ")}` });
  }

  const known = new Set(nodes.map((n) => n.id));
  for (const n of nodes) {
    for (const e of n.edges || []) {
      if (!known.has(e.target)) v.push({ type: "orphan-edge", from: n.id, to: e.target, message: `${n.id} → unknown ${e.target}` });
    }
  }

  if (prevManifest) {
    for (const n of nodes) {
      const prev = prevManifest[n.id];
      if (!prev) continue;
      for (const field of ["no", "visibility"]) {
        if (prev[field] !== undefined && prev[field] !== n[field]) {
          v.push({ type: "immutable", id: n.id, field, was: prev[field], now: n[field],
            message: `${n.id} ${field} changed ${prev[field]} → ${n[field]}` });
        }
      }
    }
  }

  return v;
}
