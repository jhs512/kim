# kim (제품 원본)

kim은 개인 지식 그래프 **제품**이다. 인스턴스(`kim-1` 등)는 이 스킬+엔진을 사본으로 설치해 쓰고,
스토어명만 `kim.config.json`으로 지정한다. 원천은 `vault/`의 마크다운(=infinite-brain 노드),
Drive 노드시트로 one-way 투영해 폰 Gemini가 조회한다. 자세한 건 `README.md`·`CONTEXT.md`.

## 지식 조회는 kim-ask로 (자동)

사용자가 **자신의 지식·기억**을 묻거나 저장된 지식에서 답을 찾아야 하는 질문을 하면
(예: "~ 뭐였지", "우리가 아는 ~", "vault에서 찾아줘", "조회/recall", "관련 노드"),
일반 상식으로 바로 답하지 말고 **먼저 `kim-ask` 스킬을 활성화**해 vault 그래프(`scripts/kim.mjs`)를
조회한 뒤 그 결과(관련 서브그래프)를 근거로 답한다. vault에 없으면 그때 일반 지식으로 답하되
"(일반 지식)"으로 출처를 구분한다.

## 스킬 스위트 (전부 한글)

- `kim-learn` 증류(원자료→노드) · `kim-ask` 조회 · `kim-check` 건강도 · `kim-clean` 정제
- `kim-sync` Drive 투영 · `kim-calendar` `{store}-calendar` 캘린더 큐 루프

## 엔진

- `scripts/kim.mjs` — vault 그래프 CLI(SQLite `node:sqlite`; 한글은 LIKE 부분일치, 그래프는 재귀 CTE). 마크다운=원천, `.kim/graph.db`=일회용 인덱스(자동 재빌드).
- `scripts/sync.sh` — Drive 투영(gws, 멱등). `scripts/kim-cal.sh` — 캘린더 큐.
- 테스트: `node --test scripts/lib/*.test.mjs`

## gws (Google Workspace CLI)

Google 접근은 **gws CLI**로 한다(claude.ai Google MCP은 headless/cron에서 인증이 빠짐). 셋업/재인증은 `gws-setup` 스킬. `gws auth status`가 `oauth2`이면 정상.
