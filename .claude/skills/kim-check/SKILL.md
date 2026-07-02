---
name: kim-check
description: kim1 vault 그래프의 건강도를 점검하고 정제 할 일(리뷰 큐)을 뽑는 스킬 — 저신뢰/고아 노드, 끊긴 엣지, 빈 필드. 트리거 - "건강도", "health", "점검", "그래프 상태", "리뷰 큐", "약한 노드".
---

# kim-check — 건강도 점검 → 리뷰 큐

`scripts/kim.mjs health`와 `scripts/build-payloads.mjs` 검증으로 vault 그래프의 약한 곳을
결정적으로 진단하고, 사람이 손볼 **리뷰 큐**로 정리한다. **읽기 전용** — 고치는 건
[[kim-clean]], 추가는 [[kim-learn]].

## 점검 워크플로

1. **건강 스캔**
   ```bash
   node scripts/kim.mjs health
   node scripts/build-payloads.mjs /tmp/pv   # 중복 no/id, 고아 엣지, 불변성 위반
   ```

2. **리뷰 큐로 분류** — 결과를 심각도 순으로 묶는다:
   - **끊긴 엣지**(`brokenEdges`): `target` id가 vault에 없음 → 대상 노드 생성 or 엣지 수정. (가장 급함, 그래프가 끊김)
   - **중복 no/id**: 순번·식별자 충돌 → 유일하게 재배정.
   - **고아 노드**(`orphans`): 들어오고 나가는 엣지가 하나도 없음 → 연결처 찾아 잇기.
   - **저신뢰**(`lowConfidence`, `confidence < 0.5`): 근거 보강 or 검증 후 신뢰도 갱신.
   - **빈 요약**(`emptySummary`): `summary`는 전문검색 앵커 → 채우기.

3. **제시** — 각 항목에 대해 "무엇을·왜·어떻게 고칠지"를 붙여 사용자에게 리뷰 큐로 낸다. 자동으로 고치지 않는다.

## 주의
- 이 스킬은 **진단만** 한다. 실제 수정은 [[kim-clean]](정제) 또는 [[kim-learn]](보강).
- 정기적으로 돌려 그래프 드리프트(신뢰도 노화·고아 누적)를 잡는다.
- `log` 노드는 점검 대상에서 제외한다(감사 추적용, 불변).
