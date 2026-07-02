// 시각 게이트 + 반복 다음 시각 계산. 순수(now/from은 인자로 주입). (issue 02, ADR-0004)

export function isDue(task, startISO, nowISO) {
  return task.state === "대기" && Date.parse(startISO) <= Date.parse(nowISO);
}

export function parseRepeat(text) {
  const t = (text || "").match(/(\d{2}:\d{2})/);
  if (!t) return null;
  const time = t[1];
  if (/평일/.test(text)) return { days: [1, 2, 3, 4, 5], time };
  if (/주말/.test(text)) return { days: [0, 6], time };
  if (/매일/.test(text)) return { days: [0, 1, 2, 3, 4, 5, 6], time };
  return null;
}

const pad = (n) => String(n).padStart(2, "0");
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function nextOccurrence(rule, fromISO) {
  const from = new Date(fromISO);
  const [h, m] = rule.time.split(":").map(Number);
  for (let offset = 0; offset <= 14; offset++) {
    const cand = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset, h, m);
    if (cand.getTime() > from.getTime() && rule.days.includes(cand.getDay())) return fmt(cand);
  }
  return null;
}
