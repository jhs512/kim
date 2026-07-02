# The assistant's work queue is the Google Calendar, tasks are a state machine

Anything the phone Gemini cannot do directly (능력 경계 밖 — send mail, edit a doc, save
knowledge, long research) is **never refused**; it is filed as a **작업** on the
`{비서코드}-calendar`, which serves as the work queue between the phone (producer) and the
kim-1 Claude Code **워커** (consumer). Each task is a state machine —
`대기 → 작업중 → 성공 | 실패 | 정보필요` — encoded in the calendar event: the `[상태]` token
lives in the title, and `요청:` / `필요정보:` / `이력:` in the description. Tasks are
**append-only and non-destructive**; state changes swap the title token and append to `이력:`.

The event's **start time gates execution**: the worker only picks up `대기` tasks whose start
≤ now, so a future start time schedules the task. **Recurring** work re-registers itself as a
new `대기` task at the next time on completion (a `반복:` line in the description drives this),
rather than using native calendar recurrence.

`정보필요` records *what* info is needed and *why*; the user speaks the info and flips the task
back to `대기` (from the phone) to resume. `실패` is **not auto-retried**; `성공`/`실패` stay
on the calendar as history.

## Consequences

- The phone needs only Calendar CRUD (which it has) to enqueue; no custom backend.
- "자동으로 재개" requires the kim-1 worker loop to be **running/scheduled** — the phone cannot
  execute queued work itself.
- The calendar is the single shared state store; both actors read/write it via gws. History and
  audit come for free (nothing is deleted).
- Time-gating makes the calendar double as the scheduler — no separate cron for user-level jobs.

## Considered options

- **A dedicated DB/queue** (rejected): the phone can't reach it directly and it adds infra; the
  calendar is already CRUD-able by the phone and human-legible.
- **Native calendar recurrence (RRULE)** (rejected): it materializes many future instances the
  worker would see at once, fighting the "future = wait" gate; worker re-enqueue keeps exactly
  one active instance.
- **Phone does the work directly** (rejected): Gemini Live can't send mail / edit docs / distill;
  refusing breaks the UX, so queueing is the only way to say "yes" to everything.
