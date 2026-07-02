import { test } from "node:test";
import assert from "node:assert/strict";
import { isDue, parseRepeat, nextOccurrence } from "./schedule.mjs";

test("isDue: 대기 task with start ≤ now is due; future or non-대기 is not", () => {
  assert.equal(isDue({ state: "대기" }, "2026-07-02T09:00", "2026-07-02T10:00"), true);
  assert.equal(isDue({ state: "대기" }, "2026-07-03T09:00", "2026-07-02T10:00"), false);
  assert.equal(isDue({ state: "작업중" }, "2026-07-02T09:00", "2026-07-02T10:00"), false);
});

test("parseRepeat maps day keyword + time to a rule, else null", () => {
  assert.deepEqual(parseRepeat("평일 09:00"), { days: [1, 2, 3, 4, 5], time: "09:00" });
  assert.deepEqual(parseRepeat("매일 07:00"), { days: [0, 1, 2, 3, 4, 5, 6], time: "07:00" });
  assert.deepEqual(parseRepeat("주말 10:30"), { days: [0, 6], time: "10:30" });
  assert.equal(parseRepeat("그냥 메모"), null);
});

test("nextOccurrence skips to the next matching weekday/time after `from`", () => {
  // 2026-07-10 is 금(Fri) 10:00 → 평일 09:00 next is Mon 2026-07-13T09:00 (weekend skipped)
  assert.equal(nextOccurrence({ days: [1, 2, 3, 4, 5], time: "09:00" }, "2026-07-10T10:00"), "2026-07-13T09:00");
  // 매일 07:00 from 2026-07-10T08:00 → 다음날 07:00
  assert.equal(nextOccurrence({ days: [0, 1, 2, 3, 4, 5, 6], time: "07:00" }, "2026-07-10T08:00"), "2026-07-11T07:00");
});
