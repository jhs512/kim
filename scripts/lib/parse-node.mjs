// Parse one .md vault node (infinite-brain frontmatter + kim-1 `no`) into a typed
// object. Pure, no I/O. Handles scalars, quoted strings, booleans/floats, single-line
// flow arrays (tags/related) and multiline flow arrays of objects (edges). (issue 01)

export class NodeError extends Error {}

const REQUIRED = ["id", "no", "title", "type", "namespace", "visibility"];
const VISIBILITIES = new Set(["public", "namespace", "private", "system"]);

// count net [ ] depth outside of double-quoted strings
function bracketDepth(s) {
  let depth = 0, inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"' && s[i - 1] !== "\\") inStr = !inStr;
    else if (!inStr && c === "[") depth++;
    else if (!inStr && c === "]") depth--;
  }
  return depth;
}

function coerceScalar(raw) {
  const v = raw.trim();
  if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v.replace(/\s+#.*$/, "").trim(); // strip trailing YAML comment on bare scalars
}

export function parseNode(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0].trim() !== "---") throw new NodeError("missing frontmatter");
  let j = 1;
  const fm = [];
  while (j < lines.length && lines[j].trim() !== "---") fm.push(lines[j++]);
  const body = lines.slice(j + 1).join("\n").trim();

  const node = { tags: [], edges: [], related: [] };
  for (let i = 0; i < fm.length; i++) {
    const m = fm[i].match(/^([A-Za-z_]\w*):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let rest = m[2];
    if (rest.startsWith("[")) {
      let depth = bracketDepth(rest);
      while (depth > 0 && i + 1 < fm.length) {
        rest += "\n" + fm[++i];
        depth += bracketDepth(fm[i]);
      }
      try {
        node[key] = JSON.parse(rest);
      } catch {
        throw new NodeError(`invalid array for ${key}`);
      }
    } else if (rest !== "") {
      node[key] = coerceScalar(rest);
    }
  }

  for (const f of REQUIRED) {
    if (node[f] === undefined || node[f] === "") throw new NodeError(`missing required field: ${f}`);
  }
  if (!Number.isInteger(node.no)) throw new NodeError(`no must be an integer: ${node.no}`);
  if (!VISIBILITIES.has(node.visibility)) {
    throw new NodeError(`visibility must be public|namespace|private|system: ${node.visibility}`);
  }

  return { ...node, body };
}
