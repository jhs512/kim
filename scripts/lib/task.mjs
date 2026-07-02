// 작업(Task) 상태머신: 캘린더 이벤트 ↔ Task, 상태 전이. 순수, I/O 없음. (issue 01, ADR-0004)

export const STATES = ["대기", "작업중", "성공", "실패", "정보필요"];
export const ICONS = { 대기: "⏳", 작업중: "🔄", 성공: "✅", 실패: "❌", 정보필요: "❓" };

// 허용 전이표
const ALLOWED = {
  대기: ["작업중"],
  작업중: ["성공", "실패", "정보필요"],
  정보필요: ["대기"],
  성공: [],
  실패: [],
};

const STATE_RE = new RegExp(`\\[(${STATES.join("|")})\\]`);

function section(lines, header) {
  const headers = ["요청:", "필요정보:", "이력:"];
  const out = [];
  let inSec = false;
  for (const line of lines) {
    if (headers.includes(line.trim())) { inSec = line.trim() === header; continue; }
    if (inSec) out.push(line);
  }
  return out;
}

export function parseTask({ summary = "", description = "" }) {
  const m = summary.match(STATE_RE);
  const state = m ? m[1] : "대기";
  // title = everything after the `[상태]` token (icon precedes it) — avoids splitting
  // non-BMP emoji surrogate pairs. Falls back to the whole summary when no token.
  const title = m
    ? summary.slice(summary.indexOf(m[0]) + m[0].length).trim()
    : summary.trim();

  const lines = description.split(/\r?\n/);
  const request = section(lines, "요청:").join("\n").trim();
  const needInfo = section(lines, "필요정보:").join("\n").trim();
  const history = section(lines, "이력:")
    .map((l) => l.match(/^-\s*(\S+)\s*\[(\S+)\]\s*(.*)$/))
    .filter(Boolean)
    .map((mm) => ({ at: mm[1], state: mm[2], note: mm[3] }));

  return { state, title, request, needInfo, history };
}

export function renderTask(task) {
  const summary = `${ICONS[task.state]}[${task.state}] ${task.title}`;
  const hist = (task.history || []).map((h) => `- ${h.at} [${h.state}] ${h.note}`).join("\n");
  const description = `요청:\n${task.request || ""}\n\n필요정보:\n${task.needInfo || ""}\n\n이력:\n${hist}`;
  return { summary, description };
}

export function transition(task, toState, { at, note }) {
  if (!ALLOWED[task.state] || !ALLOWED[task.state].includes(toState)) {
    throw new Error(`invalid transition: ${task.state} → ${toState}`);
  }
  return { ...task, state: toState, history: [...task.history, { at, state: toState, note }] };
}
