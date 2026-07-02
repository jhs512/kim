// kim-task.mjs — 테스트된 순수 모듈(task/schedule)을 kim-cal.sh(gws)에 잇는 얇은 브릿지.
// stdin으로 이벤트 JSON을 받고 결과 JSON/TSV를 stdout으로. (issue 03)
//   new "<title>" "<request>" [startLocal]   → events.insert 본문(summary,description,start,end)
//   set <상태> "<note>"   (stdin: {summary,description})       → events.patch 본문(summary,description)
//   due [nowLocal]        (stdin: [{id,summary,description,start}]) → 만기 대기: id<TAB>title
//   reenqueue [nowLocal]  (stdin: {summary,description})       → insert 본문 또는 빈출력(반복 아님)

import { parseTask, renderTask, transition } from "./lib/task.mjs";
import { isDue, parseRepeat, nextOccurrence } from "./lib/schedule.mjs";

const TZ = "Asia/Seoul", OFFSET = "+09:00";
const pad = (n) => String(n).padStart(2, "0");
const toLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const nowLocal = () => toLocal(new Date());
const plusHour = (local) => { const d = new Date(local); d.setHours(d.getHours() + 1); return toLocal(d); };
const insertBody = (render, startLocal) => ({
  ...render,
  start: { dateTime: `${startLocal}:00${OFFSET}`, timeZone: TZ },
  end: { dateTime: `${plusHour(startLocal)}:00${OFFSET}`, timeZone: TZ },
});

function readStdin() {
  return new Promise((res) => { let d = ""; process.stdin.on("data", (c) => (d += c)); process.stdin.on("end", () => res(d)); });
}

const [cmd, ...args] = process.argv.slice(2);
const raw = await readStdin();

if (cmd === "new") {
  const [title, request, startLocal] = args;
  const t = { state: "대기", title, request: request || "", needInfo: "", history: [{ at: nowLocal(), state: "대기", note: "등록" }] };
  process.stdout.write(JSON.stringify(insertBody(renderTask(t), startLocal || nowLocal())));
} else if (cmd === "set") {
  const [toState, note] = args;
  const t = parseTask(JSON.parse(raw));
  process.stdout.write(JSON.stringify(renderTask(transition(t, toState, { at: nowLocal(), note: note || "" }))));
} else if (cmd === "due") {
  const now = args[0] || nowLocal();
  const isTask = (s) => /\[(대기|작업중|성공|실패|정보필요)\]/.test(s || "");
  for (const ev of JSON.parse(raw || "[]")) {
    if (!isTask(ev.summary)) continue; // 작업(상태 토큰) 이벤트만
    if (isDue(parseTask(ev), ev.start, now)) process.stdout.write(`${ev.id}\t${parseTask(ev).title}\n`);
  }
} else if (cmd === "reenqueue") {
  const now = args[0] || nowLocal();
  const t = parseTask(JSON.parse(raw));
  const rule = parseRepeat(`${t.request}\n${t.needInfo}`);
  if (rule) {
    const start = nextOccurrence(rule, now);
    const fresh = { state: "대기", title: t.title, request: t.request, needInfo: "", history: [{ at: now, state: "대기", note: "반복 재등록" }] };
    process.stdout.write(JSON.stringify(insertBody(renderTask(fresh), start)));
  }
} else {
  process.stderr.write("usage: kim-task.mjs <new|set|due|reenqueue> ...\n");
  process.exit(1);
}
