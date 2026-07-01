# kim

개인 지식 그래프 **제품(원본)**. 지식은 atomic typed-markdown(=infinite-brain) 노드로 git에 살고,
Google Drive **노드시트**로 one-way 투영되어 **폰 Gemini**가 조회한다. `kim-1` 같은 **인스턴스**는
이 저장소의 스킬+엔진을 사본으로 설치해 쓰고, 스토어명만 `kim.config.json`으로 지정한다.

## 구성

- `.claude/skills/kim-*` — 스킬 스위트(전부 한글)
  - `kim-learn`(증류) · `kim-ask`(조회) · `kim-check`(점검) · `kim-clean`(정제) · `kim-sync`(투영) · `kim-calendar`(캘린더 큐 루프)
- `scripts/` — 엔진
  - `kim.mjs` — vault 그래프 CLI(SQLite `node:sqlite`, 한글은 LIKE 부분일치, 그래프는 재귀 CTE)
  - `sync.sh` — vault → Drive 노드시트 one-way 투영(gws, 멱등)
  - `kim-cal.sh` — `{store}-calendar` 캘린더를 입력 큐로
  - `build-payloads.mjs` + `lib/`(순수 모듈 + `node:test` 테스트)
- `docs/infinite-brain/` — 노드/엣지/frontmatter 스키마 **정본**(vendored, MIT)
- `docs/adr/`, `CONTEXT.md` — 설계 결정 · 도메인 언어
- `docs/onboarding.md`, `docs/gemini-system-instructions.md`
- `vault/` — 씨앗 예시 노드(스키마 데모용). 인스턴스는 자기 지식으로 대체한다.

## 인스턴스 만들기

1. 이 저장소를 서브모듈로 물고, `.claude/skills/kim-*`를 인스턴스의 `.claude/skills/`로 복사.
2. 인스턴스 루트에 `kim.config.json` (`{"store":"my-store"}`) — `kim.config.json.example` 참고.
3. `gws-setup`으로 Google 접근 준비 → `node scripts/kim.mjs list`로 확인 → `bash scripts/sync.sh`로 투영.

## 원칙

- **마크다운이 유일한 원천.** `.kim/graph.db`(SQLite)는 언제든 재생성 가능한 일회용 인덱스.
- 폰 Gemini는 **읽기 전용 소비자**(양방향 아님). 폴더가 아니라 **문서 이름**으로 타깃팅.
- eb에서 계승하되 CSV 집계·웹앱·Cloudflare·GitHub Actions·서비스계정 시트미러는 **제외**.

테스트: `node --test scripts/lib/*.test.mjs`
