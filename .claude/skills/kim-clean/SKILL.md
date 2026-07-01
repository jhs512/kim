---
name: kim-clean
description: kim-1 vault 그래프의 건강을 회복시키는 정제 스킬 — 중복 노드 병합, 고아 노드 연결, 그래프 촘촘화. 트리거 - "정제", "curate", "중복 병합", "고아 정리", "그래프 정리", "노드 합치기".
---

# kim-clean — 정제(그래프 건강 회복)

[[kim-check]]가 뽑은 리뷰 큐를 받아 vault 그래프를 **결정적으로 고친다**. 마크다운을
직접 편집(Edit)하고, 조회는 `scripts/kim.mjs`, 검증은 `scripts/build-payloads.mjs`로 보증한다.

## 정제 작업 (승인 게이트 필수 — 각 변경 전 사용자 확인)

1. **중복 병합** — 같은 뜻 노드 두 개(`kim.mjs search`로 확인):
   - 하나를 **정본(canonical)**으로 남기고, 다른 하나의 엣지·태그를 정본으로 옮긴다.
   - 사라지는 노드를 참조하던 엣지들의 `target`을 정본 id로 고친다.
   - 옛 노드는 지우기보다 `preceded_by`로 정본에 잇는 것을 우선(이력 보존). 완전 삭제는 사용자 승인 후에만.

2. **고아 연결** — `neighbors`가 비는 노드:
   ```bash
   node scripts/kim.mjs search <고아 노드 키워드>   # 이웃 후보 탐색
   node scripts/kim.mjs neighbors <후보 id>
   ```
   가장 그럴듯한 관계(엣지타입 10종 중)로 최소 1개 엣지를 잇는다.

3. **끊긴 엣지 수리** — `target`이 없는 엣지: 대상 노드를 [[kim-learn]]로 만들거나, 엣지를 올바른 id로 고친다.

4. **촘촘화** — 2홉 이웃·태그 겹침으로 "이어야 하는데 안 이어진" 쌍을 찾아 엣지 제안 → 승인 시 추가.

## 반영 후 반드시

```bash
node scripts/build-payloads.mjs /tmp/pv   # 위반 0 확인
node scripts/kim.mjs health               # 리뷰 큐가 줄었는지 확인
```
그 뒤 [[kim-sync]]로 Drive 재투영.

## 주의
- `no`·`visibility`는 **불변**(ADR-0002). 병합 시 정본의 것을 유지, 옛 것은 supersede.
- 파괴적 편집(노드 삭제, 엣지 제거)은 **각 건 사용자 승인** 후에만.
- 용어는 `CONTEXT.md`(정제/연결 제안)를 따른다.
