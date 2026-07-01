---
name: kim-calendar
description: Google 캘린더 '{store}-calendar'(기본 kim-1-calendar)를 입력 큐로 삼아, 미처리 이벤트를 하나씩 노드로 증류·투영하고 완료 표시하는 큐 루프 스킬. 트리거 - "캘린더 큐", "큐 돌려", "캘린더에서 받아와", "캘린더 처리", "인제스트 루프".
---

# kim-calendar — 캘린더 큐 인제스트 루프

`{store}-calendar`란 Google 캘린더를 **입력 큐**로 쓴다(스토어는 `kim.config.json`에서 도출,
이 인스턴스에선 `kim-1-calendar`). 각 **이벤트 = 큐 아이템**(제목 = 주제,
설명 = 원자료 텍스트 또는 URL). 미처리 이벤트를 하나씩 꺼내 [[kim-learn]]로 증류하고
[[kim-sync]]로 Drive에 반영한 뒤 **비파괴 완료 표시**(제목 앞 `✅`)한다. 삭제하지 않는다.

결정적 I/O는 `scripts/kim-cal.sh`(gws)가, 증류는 이 스킬을 따르는 에이전트가 한다.
전제: `gws auth status`가 `oauth2`(아니면 `gws-setup`).

## 루프

1. **큐 확보 & 목록**
   ```bash
   bash scripts/kim-cal.sh ensure     # '{store}-calendar' 없으면 생성, id는 .sync/calendar-id
   bash scripts/kim-cal.sh list       # 미처리 이벤트: eventId <TAB> 제목 <TAB> 설명
   ```
   목록이 비면 큐가 비었다는 뜻 → 종료.

2. **각 아이템을 순회** — 목록의 이벤트마다 (한 번에 하나씩):
   1. 제목+설명을 원자료로 삼아 **[[kim-learn]] 파이프라인**으로 증류한다
      (추가 전 `node scripts/kim.mjs search`로 중복/연결처 조회 → 승인 → 마크다운 노드 작성 → `build-payloads`로 검증).
      - URL이면 사용자에게 내용 확인을 요청한다(자동 페치는 이 스킬 범위 밖).
   2. **투영**: `bash scripts/sync.sh` ([[kim-sync]]).
   3. **완료 표시**: 성공했을 때만
      ```bash
      bash scripts/kim-cal.sh done <eventId>
      ```
      → 제목이 `✅ …`로 바뀌어 다음 `list`에서 빠진다.

3. **다음 아이템** — 큐가 빌 때까지 반복. 각 아이템은 독립 — 하나가 실패하면 완료 표시하지 말고
   다음으로 넘어가 사용자에게 보고한다.

## 규칙
- **완료 표시는 처리 성공 후에만.** 실패한 이벤트는 `✅` 없이 남겨 다음 루프에서 재시도.
- **비파괴**: 이벤트를 삭제하지 않는다(완료 = 제목에 `✅`). 큐에는 사람이 넣고, 루프는 **소비만** 한다.
- 자동 루프(무인)로 돌릴 땐 `/loop` 스킬과 조합하되, 각 노드 **승인 게이트**는 유지한다.
- 큐 아이템에 넣기 좋은 것: 짧은 지식 조각, 메모, 링크(요약과 함께).

## 테스트
```bash
bash scripts/kim-cal.sh add "복리의 72법칙" "72를 연이율로 나누면 2배 되는 햇수"   # 큐에 넣기
bash scripts/kim-cal.sh list                                                        # 확인
```
