<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/Tests-node:test-brightgreen.svg" alt="Tests">
  <img src="https://img.shields.io/badge/Node-24+-339933.svg" alt="Node">
  <img src="https://img.shields.io/badge/Deps-node:sqlite_(built--in)-orange.svg" alt="deps">
  <img src="https://img.shields.io/badge/Google-gws_CLI-4285F4.svg" alt="gws">
</p>

# 김비서 (kim) — 안 된다고 말하지 않는 개인 비서

> **폰으로 시키고, 컴퓨터가 처리한다.** 폰 Gemini는 할 수 있는 건 바로 하고, 못 하는 건
> 거부하지 않고 **캘린더 큐**에 남긴다. 그러면 컴퓨터의 **워커(Claude Code)**가 그 일을
> **상태머신**으로 처리한다. 지식은 마크다운이 아니라 **노드 시트(스프레드시트)** 로 살고,
> 그래프 탐색은 프롬프트가 아니라 **결정적 엔진(SQLite)** 이 보증한다.

[infinite-brain](https://github.com/JotaSXBR/obsidian-infinite-brain)의 타입 노드/엣지 스키마와
[eb](https://github.com/jhs512/eb)의 그래프-인지 캡처에서 영감을 받았다.

## 문제

AI 비서는 두 가지로 답답하다. ① **세션마다 잊는다** — 개인 지식이 길고 느슨한 문서 더미라 훑기 비싸고 부정확하다. ② **"그건 못 해요"** — 폰 비서는 메일 발송·문서 수정 같은 걸 거부한다.
김비서는 지식을 **노드당 하나의 아이디어 + 방향·이유가 있는 엣지** 그래프로 다루고(싸고 정확한 조회), 못 하는 일은 **거부 대신 큐에 적어** 워커가 대신 끝낸다(거부 없는 비서).

## 큰 그림 (구조)

```
        말로 시킴 / 물어봄
 사용자 ───────────────▶  📱 폰 Gemini  ── 직접: 지메일 읽기 · 캘린더 CRUD · Drive 읽기/생성 · 지식 조회
                            (생산자)      └ 못 하면 "안돼" 대신 큐에 등록 ─┐
                                                                          ▼
   ┌───────────────────────── Google (공유 상태) ─────────────────────────┐
   │   📁 Drive 노드 시트  {코드}_…            📅 {코드}-calendar  = 작업 큐   │
   └──────────────▲──────────────────────────────────────────┬────────────┘
        one-way 투영 (kim-sync)                     due: 만기 '대기' 작업 │
                   │                                                     ▼
             🧠 vault (마크다운 노드, git = 원천)        💻 kim 워커 (Claude Code, 소비자)
                   │   ▲  증류(kim-learn) · 조회(kim.mjs) · 정제(kim-clean)   │
                   └───┴──────────────────────────  상태머신  ──────────────┘
                                            대기 → 작업중 → 성공 / 실패 / 정보필요
```

- **원천은 vault**(git의 마크다운 노드). Drive 노드 시트는 폰이 읽는 **파생 뷰**(one-way).
- 폰이 못 하는 일은 **캘린더 = 작업 큐**에 쌓이고, 워커가 **당겨서(due)** 처리한다.
- "비서 {코드}"로 어느 비서(kim-1 등)를 쓸지 고른다. **한 프로젝트 = 비서 1명**, 여러 명이면 프로젝트를 여러 개.

## 스킬 6개 (`.claude/skills/kim-*`)

각 스킬은 얇은 오케스트레이터이고, 결정적 연산은 `scripts/`가 보증한다.

| 스킬 | 역할 |
|---|---|
| **`kim-learn`** | 원자료 → 타입 노드+엣지로 증류(추가 전 조회로 중복/연결 확인) |
| **`kim-ask`** | 그래프 조회·순회 — 관련 서브그래프 |
| **`kim-check`** | 건강도 점검 → 리뷰 큐(저신뢰·고아·끊긴 엣지) |
| **`kim-clean`** | 중복 병합·고아 연결·촘촘화 |
| **`kim-sync`** | vault → Drive 노드 시트 one-way 투영(멱등) |
| **`kim-work`** | **작업 큐 워커** — 캘린더 큐를 상태머신으로 드레인 |

## 능력 경계 — "안돼" 금지

| 직접 (폰이 바로) | 큐로 (거부 대신 등록 → 워커 처리) |
|---|---|
| 📬 지메일 읽기 · 📅 일정 CRUD · 📁 Drive 읽기/생성 · 🧠 지식 조회 | ✉️ 메일 발송·답장 · ✏️ 문서 수정 · 🧠 지식 저장 · 🔎 긴 조사 · 그 외 전부 |

## 작업 상태머신

작업 하나 = 캘린더 이벤트 하나. 제목에 상태, 설명에 `요청/필요정보/이력`(append-only).

```
⏳ 대기 ─▶ 🔄 작업중 ─┬─▶ ✅ 성공        (결과는 이력에)
                      ├─▶ ❌ 실패        (자동 재시도 없음)
                      └─▶ ❓ 정보필요 ──(사용자가 정보 보충)──▶ ⏳ 대기 (재개)
```

- **시각 게이트**: 워커는 시작시각 ≤ 지금인 `대기`만 집는다 → 미래 시각 = 예약(스케줄).
- **반복**: 성공 시 다음 시각으로 새 `대기` 작업 **재등록**(예 `평일 09:00` → "평일 아침 요약 메일").
- 성공/실패도 캘린더에 남는다(이력·감사). 자세한 결정: [ADR-0004](docs/adr/0004-calendar-task-queue-state-machine.md).

## 빠른 시작

```bash
# 0) Google 접근 준비 (한 번)
/gws-setup                                  # gws CLI OAuth (지메일/캘린더/드라이브)
# 인스턴스 루트에 kim.config.json → {"store":"kim-1"}   (kim.config.json.example 참고)

# 1) 로컬 그래프 (SQLite 엔진)
node scripts/kim.mjs list                    # 노드 목록
node scripts/kim.mjs search 복리             # 부분일치 검색(한국어 OK — LIKE)
node scripts/kim.mjs node concept-compound-interest   # 상세 + 엣지 + 백링크
node scripts/kim.mjs neighbors <id> --depth 2         # 재귀 CTE 이웃
node scripts/kim.mjs health                  # 고아·저신뢰·끊긴 엣지

# 2) 지식 쌓기 / 투영 (스킬)
/kim-learn <원자료>       # 증류 → 조회 → 승인 → 노드 작성 → 검증
/kim-sync                 # vault → Drive 노드 시트 (멱등)

# 3) 작업 큐 (폰이 넣고, 워커가 처리)
bash scripts/kim-cal.sh enqueue "<요약>" "<요청>" [시작시각]   # 큐에 작업 등록
bash scripts/kim-cal.sh due                                    # 만기 '대기' 작업
/kim-work                                                      # 워커: 드레인 + 상태머신
bash scripts/kim-cal.sh set <id> 성공 "<결과>"                 # 상태 전이(이력 자동)
```

## 사용 예시

폰에서 말 거는 예 (자세한 목록 100+ → [`docs/examples.md`](docs/examples.md)):

- "비서 kim-1, 지금 비서코드 뭐야?" → "kim-1 입니다." `[선택]`
- "그때 정한 거 뭐였지?" → 노드 시트 조회, 엣지 따라 서브그래프로 답 `[직접]`
- "김대리한테 답장해줘: 수요일 좋아요" → "큐에 넣었어요" (워커가 처리) `[큐]`
- "지금 정보필요로 멈춘 일 뭐 있어? 내가 정보 줄게" → 상태 요약 → 보충 → 재개 `[상태/정보]`
- "평일 아침 9시에 해커뉴스 핫한 거 정리해서 메일 보내줘" → 반복 작업 등록 `[반복]`
- "이건 바로 말고 길게 조사해줘" → 큐 등록, 끝나면 그 작업에 결과 보고 `[큐]`

## 레퍼런스

### 노드 시트 이름 (폰이 읽는 파생 뷰)
`{비서코드}_{no}_{namespace}_{doctype}_{visibility}_{title}` (예: `kim-1_1_personal_concepts_public_복리`).
폴더 위치는 무시하고 **문서 이름**으로 타깃팅. 노드 스키마는 [`docs/infinite-brain/`](docs/infinite-brain/) (17 타입 · 10 엣지 · 4 visibility).

### 그래프 엔진 — `scripts/kim.mjs` (SQLite)
마크다운 vault를 `node:sqlite`로 올려 조회한다. **텍스트 검색 = LIKE 부분일치**(한국어 2글자도 잡힘 — FTS5는 못 잡음), **그래프 탐색 = 재귀 CTE**. `.kim/graph.db`는 vault보다 오래되면 자동 재빌드하는 **일회용 인덱스**(git-ignore, 원천은 마크다운).

### 작업 큐 — `scripts/kim-cal.sh` (gws)
`{비서코드}-calendar`를 큐로. `enqueue`/`due`(만기 대기만)/`set <상태>`/`reenqueue`(반복). 로직은 테스트된 `scripts/lib/task.mjs`·`schedule.mjs`, I/O만 gws.

### 폰 Gemini 지침 (제네릭)
[`docs/gemini-system-instructions.md`](docs/gemini-system-instructions.md) — 개인 인텔리전스 "요청 사항"에 붙여넣는다(비서코드 하드코딩 없음).

## 저장소 구조

```
kim/
├── vault/{namespace}/{doctype}/*.md   # 노드(지식의 원천, git)
├── scripts/
│   ├── kim.mjs            # 그래프 CLI (SQLite: LIKE 검색 + 재귀 CTE)
│   ├── sync.sh            # vault → Drive 노드 시트 투영(gws, 멱등)
│   ├── kim-cal.sh         # 작업 큐 I/O (enqueue/due/set/reenqueue)
│   ├── kim-task.mjs       # 큐 ↔ 순수모듈 브릿지
│   ├── build-payloads.mjs # 투영 payload 빌더(검증 포함)
│   └── lib/*.mjs (+*.test.mjs)   # 순수 모듈 + node:test (parse/doc-name/edges/values/validate/graph/db/task/schedule)
├── .claude/skills/kim-*/SKILL.md      # 6 스킬(learn/ask/check/clean/sync/work)
├── docs/
│   ├── infinite-brain/   # 노드/엣지/frontmatter 스키마(정본)
│   ├── adr/              # 아키텍처 결정(0001~0004)
│   ├── gemini-system-instructions.md · onboarding.md · examples.md
├── CONTEXT.md            # 도메인 용어집
└── kim.config.json.example   # {"store":"..."}
```

## 설계 한눈에

| 측면 | 김비서 (kim) |
|---|---|
| 지식의 원천 | **마크다운 노드**(git) — infinite-brain 스키마 |
| 폰이 읽는 것 | **Drive 노드 시트**(one-way 파생 뷰), 이름으로 타깃팅 |
| 엔진 | **`node:sqlite` — 결정적**(LIKE 검색 + 재귀 CTE), 외부 의존 0 |
| 할 일 | **캘린더 = 작업 큐 상태머신**, 워커는 Claude Code |
| 제품 | **6 스킬** (learn/ask/check/clean/sync/work) |
| 제외 | CSV 집계 · 웹앱 · Cloudflare · GitHub Actions · 서비스계정 시트미러 |

## 인스턴스 만들기 · 테스트

```bash
# 인스턴스: 이 저장소를 서브모듈로 물고 .claude/skills/kim-* 를 인스턴스에 설치,
#          kim.config.json 에 {"store":"my-store"} 지정.
node --test scripts/lib/*.test.mjs      # 순수 모듈 전체 테스트
```

[MIT](LICENSE)
