---
name: kim-ask
description: kim1 vault 그래프를 탐색해 답을 얻는 조회 스킬. 키워드/노드로 관련 서브그래프(유사 노드 + 이웃/경로)를 찾는다. 트리거 - "조회", "recall", "이웃", "관련 노드 찾기", "vault에서 찾아줘", "그래프 탐색".
---

# kim-ask — 그래프 조회

`scripts/kim.mjs`로 `vault/`의 마크다운 그래프를 **탐색해 답을 얻는다**. 이 스킬은 얇은
오케스트레이터이고, 실제 그래프 연산은 `kim.mjs`가 결정적으로 보증한다. **읽기 전용** —
vault를 바꾸지 않는다(추가는 [[kim-learn]], 정제는 [[kim-clean]]).

## 조회 워크플로

1. **진입 노드 찾기** — 질문에서 키워드를 뽑아 검색.
   ```bash
   node scripts/kim.mjs search <질의>   # id/title/summary/tags/body 부분일치, 일치 필드 수로 랭크
   ```
   id를 이미 알면 건너뛴다.

2. **주변 지형 보기** — 진입 노드에서 그래프를 펼친다.
   ```bash
   node scripts/kim.mjs node <id>                  # 상세 + 나가는 엣지 + 백링크
   node scripts/kim.mjs neighbors <id> --depth 2   # 양방향 이웃
   ```

3. **전체 상태** (선택) — 그래프가 건강한지.
   ```bash
   node scripts/kim.mjs health
   ```

## 출력: 관련 서브그래프

답할 때는 흩어진 노드 나열이 아니라 **관련 서브그래프**로 묶어 제시한다:
- 진입 노드(들)와 신뢰도(`confidence`)
- 그 이웃과 관계(엣지 타입·방향·weight·note)
- 질문과 직접 닿는 경로

이렇게 하면 다른 에이전트(폰 Gemini 포함)가 답 전에 주입할 수 있는 **기억 조각**이 된다.

## 주의
- 용어는 `CONTEXT.md`를 따른다(노드/엣지/조회 …).
- 결과가 비면 질의어를 바꾸거나(`search`) 깊이를 넓힌다(`neighbors --depth`).
- 폰 Gemini의 조회는 이 로컬 스킬이 아니라 Drive 노드시트 전문검색이다(ADR-0003) — 이 스킬은 **로컬 Claude Code용**.
