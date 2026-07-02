import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTask, renderTask, transition } from "./task.mjs";

const EV = {
  summary: "⏳[대기] 메일 정리",
  description: "요청:\n지난주 메일 요약\n\n필요정보:\n\n이력:\n- 2026-07-02T09:00 [대기] 등록",
};

test("parseTask extracts state, title, request, needInfo, history", () => {
  const t = parseTask(EV);
  assert.equal(t.state, "대기");
  assert.equal(t.title, "메일 정리");
  assert.equal(t.request, "지난주 메일 요약");
  assert.equal(t.needInfo, "");
  assert.deepEqual(t.history, [{ at: "2026-07-02T09:00", state: "대기", note: "등록" }]);
});

test("parseTask handles the non-BMP 작업중 icon (🔄) without leaving a broken surrogate", () => {
  const t = parseTask({ summary: "🔄[작업중] 테스트 작업", description: "요청:\n\n필요정보:\n\n이력:\n- x [작업중] y" });
  assert.equal(t.title, "테스트 작업"); // no orphan surrogate, no leading icon
  assert.ok(!/[\uD800-\uDFFF]/.test(t.title)); // title carries no surrogate fragment from the icon
});

test("renderTask round-trips through parseTask", () => {
  const t = parseTask(EV);
  assert.deepEqual(parseTask(renderTask(t)), t);
});

test("renderTask uses the state icon and [state] token in the title", () => {
  const { summary } = renderTask(parseTask(EV));
  assert.equal(summary, "⏳[대기] 메일 정리");
});

test("transition appends history, is immutable, and enforces allowed edges", () => {
  const t = parseTask(EV);
  const t2 = transition(t, "작업중", { at: "2026-07-02T09:05", note: "착수" });
  assert.equal(t2.state, "작업중");
  assert.equal(t2.history.length, 2);
  assert.deepEqual(t2.history.at(-1), { at: "2026-07-02T09:05", state: "작업중", note: "착수" });
  assert.equal(t.state, "대기"); // original unchanged
  assert.equal(t.history.length, 1);
  const done = transition(t2, "성공", { at: "2026-07-02T09:10", note: "완료" });
  assert.throws(() => transition(done, "작업중", { at: "x", note: "y" })); // 성공 is terminal
});

test("정보필요 needInfo is parsed and rendered, and 정보필요→대기 is allowed", () => {
  const t = parseTask({
    summary: "❓[정보필요] 항공권 예약",
    description: "요청:\n도쿄 항공권 예약\n\n필요정보:\n출발일과 예산\n\n이력:\n- 2026-07-02T10:00 [정보필요] 날짜·예산 필요",
  });
  assert.equal(t.state, "정보필요");
  assert.equal(t.needInfo, "출발일과 예산");
  const back = transition(t, "대기", { at: "2026-07-02T11:00", note: "정보 보충: 7/10, 60만원" });
  assert.equal(back.state, "대기");
});
