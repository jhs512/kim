#!/usr/bin/env bash
# kim-cal.sh — {비서코드}-calendar 작업 큐 I/O (gws). 로직은 kim-task.mjs(→ tested task/schedule).
# Usage:
#   bash scripts/kim-cal.sh ensure
#   bash scripts/kim-cal.sh enqueue "<요약>" "<요청>" [startLocal:YYYY-MM-DDTHH:MM]
#   bash scripts/kim-cal.sh due                      # 만기 대기 작업: eventId <TAB> 제목
#   bash scripts/kim-cal.sh set <eventId> <상태> "<note>"
#   bash scripts/kim-cal.sh reenqueue <eventId>      # 설명이 반복 규칙이면 다음 시각으로 새 대기 작업
set -euo pipefail
cd "$(dirname "$0")/.."

GWS=/c/Users/jangk/bin/gws
SYNC_DIR=.sync; mkdir -p "$SYNC_DIR"
CAL_NAME="$(node -e 'try{process.stdout.write((JSON.parse(require("fs").readFileSync("kim.config.json","utf8")).store||"kim-1")+"-calendar")}catch(e){process.stdout.write("kim-1-calendar")}')"
nostrip() { grep -v -i keyring; }
jget() { nostrip | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{console.log(eval(process.argv[1]))}catch(e){console.log("")}})' "$1"; }

cal_id() {
  if [ -f "$SYNC_DIR/calendar-id" ] && [ -s "$SYNC_DIR/calendar-id" ]; then cat "$SYNC_DIR/calendar-id"; return; fi
  local id
  id=$("$GWS" calendar calendarList list --format json 2>/dev/null | nostrip | CAL="$CAL_NAME" node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{console.log((JSON.parse(d).items||[]).filter(c=>c.summary===process.env.CAL).map(c=>c.id)[0]||"")})')
  [ -z "$id" ] && id=$("$GWS" calendar calendars insert --json "{\"summary\":\"$CAL_NAME\"}" --format json 2>/dev/null | jget 'JSON.parse(d).id||""')
  printf '%s' "$id" > "$SYNC_DIR/calendar-id"; echo "$id"
}

get_event() { # $1=eventId → {summary,description} JSON
  "$GWS" calendar events get --params "{\"calendarId\":\"$(cal_id)\",\"eventId\":\"$1\"}" --format json 2>/dev/null \
    | nostrip | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const e=JSON.parse(d);process.stdout.write(JSON.stringify({summary:e.summary||"",description:e.description||""}))})'
}

cmd="${1:-}"; shift || true
case "$cmd" in
  ensure) echo "calendarId: $(cal_id) ($CAL_NAME)" ;;

  enqueue)
    cid=$(cal_id)
    body=$(node scripts/kim-task.mjs new "${1:?요약}" "${2:-}" "${3:-}" </dev/null)
    "$GWS" calendar events insert --params "{\"calendarId\":\"$cid\"}" --json "$body" --format json 2>/dev/null | jget 'JSON.parse(d).id||""'
    ;;

  due)
    cid=$(cal_id)
    "$GWS" calendar events list --params "{\"calendarId\":\"$cid\",\"maxResults\":200,\"singleEvents\":true,\"orderBy\":\"updated\"}" --format json 2>/dev/null \
      | nostrip | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const it=(JSON.parse(d).items||[]).map(e=>({id:e.id,summary:e.summary||"",description:e.description||"",start:(e.start&&(e.start.dateTime||e.start.date))||""}));process.stdout.write(JSON.stringify(it))})' \
      | node scripts/kim-task.mjs due
    ;;

  set)
    cid=$(cal_id); eid="${1:?eventId}"; state="${2:?상태}"; note="${3:-}"
    body=$(get_event "$eid" | node scripts/kim-task.mjs set "$state" "$note")
    "$GWS" calendar events patch --params "{\"calendarId\":\"$cid\",\"eventId\":\"$eid\"}" --json "$body" >/dev/null 2>&1 && echo "set $eid → $state"
    ;;

  reenqueue)
    cid=$(cal_id); eid="${1:?eventId}"
    body=$(get_event "$eid" | node scripts/kim-task.mjs reenqueue)
    if [ -n "$body" ]; then
      "$GWS" calendar events insert --params "{\"calendarId\":\"$cid\"}" --json "$body" --format json 2>/dev/null | jget '"reenqueued: "+(JSON.parse(d).id||"")'
    else echo "no repeat rule → not reenqueued"; fi
    ;;

  *) echo "usage: kim-cal.sh <ensure|enqueue|due|set|reenqueue> ..."; exit 1 ;;
esac
