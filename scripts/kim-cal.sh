#!/usr/bin/env bash
# kim-cal.sh — kim-1-calendar 큐 I/O (gws). 결정적 부분만; 증류는 kim-1-learn(에이전트)이 한다.
# Usage:
#   bash scripts/kim-cal.sh ensure                 # 'kim-1-calendar' 캘린더 확보 → id 저장/출력
#   bash scripts/kim-cal.sh list                   # 미처리(✅ 아님) 이벤트: id<TAB>제목<TAB>설명
#   bash scripts/kim-cal.sh done <eventId>         # 이벤트 제목 앞에 '✅ ' (비파괴 완료 표시)
#   bash scripts/kim-cal.sh add "<제목>" "[설명]"   # 테스트용: 큐에 아이템 추가
set -euo pipefail
cd "$(dirname "$0")/.."

GWS=/c/Users/jangk/bin/gws
SYNC_DIR=.sync; mkdir -p "$SYNC_DIR"
# 캘린더명은 스토어에서 도출: {store}-calendar (kim.config.json, 기본 kim-1)
CAL_NAME="$(node -e 'try{process.stdout.write((JSON.parse(require("fs").readFileSync("kim.config.json","utf8")).store||"kim-1")+"-calendar")}catch(e){process.stdout.write("kim-1-calendar")}')"
jget() { grep -v -i keyring | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{console.log(eval(process.argv[1]))}catch(e){console.log("")}})' "$1"; }

cal_id() {
  if [ -f "$SYNC_DIR/calendar-id" ] && [ -s "$SYNC_DIR/calendar-id" ]; then cat "$SYNC_DIR/calendar-id"; return; fi
  local id
  id=$("$GWS" calendar calendarList list --format json 2>/dev/null | grep -v -i keyring | CAL="$CAL_NAME" node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{console.log((JSON.parse(d).items||[]).filter(c=>c.summary===process.env.CAL).map(c=>c.id)[0]||"")})')
  [ -z "$id" ] && id=$("$GWS" calendar calendars insert --json "{\"summary\":\"$CAL_NAME\"}" --format json 2>/dev/null | jget 'JSON.parse(d).id||""')
  printf '%s' "$id" > "$SYNC_DIR/calendar-id"
  echo "$id"
}

cmd="${1:-}"; shift || true
case "$cmd" in
  ensure) echo "calendarId: $(cal_id)" ;;
  list)
    cid=$(cal_id)
    "$GWS" calendar events list --params "{\"calendarId\":\"$cid\",\"maxResults\":100,\"singleEvents\":true,\"orderBy\":\"updated\"}" --format json 2>/dev/null \
      | grep -v -i keyring \
      | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{for(const e of (JSON.parse(d).items||[])){const s=e.summary||"";if(s.startsWith("✅"))continue;console.log([e.id,s,(e.description||"").replace(/[\t\n\r]+/g," ")].join("\t"))}})'
    ;;
  done)
    cid=$(cal_id); eid="${1:?eventId required}"
    cur=$("$GWS" calendar events get --params "{\"calendarId\":\"$cid\",\"eventId\":\"$eid\"}" --format json 2>/dev/null | jget 'JSON.parse(d).summary||""')
    "$GWS" calendar events patch --params "{\"calendarId\":\"$cid\",\"eventId\":\"$eid\"}" --json "{\"summary\":\"✅ $cur\"}" >/dev/null 2>&1 && echo "done: $eid ($cur)"
    ;;
  add)
    cid=$(cal_id)
    "$GWS" calendar events insert --params "{\"calendarId\":\"$cid\"}" \
      --json "{\"summary\":\"${1:?summary required}\",\"description\":\"${2:-}\",\"start\":{\"date\":\"2026-07-01\"},\"end\":{\"date\":\"2026-07-02\"}}" \
      --format json 2>/dev/null | jget 'JSON.parse(d).id||""'
    ;;
  *) echo "usage: kim-cal.sh <ensure|list|done <eventId>|add \"<제목>\" \"[설명]\">"; exit 1 ;;
esac
