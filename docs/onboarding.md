# kim-1 온보딩

kim-1은 **개인 지식 그래프**다. 지식은 `vault/`의 원자적 마크다운 노드(=infinite-brain 노드)로
살고, git이 원천이며, Google Drive의 **노드시트**로 one-way 투영되어 **폰 Gemini**가 조회한다.

## 한 장 요약

```
원자료 ──kim-learn(증류)──▶ vault/ 마크다운 노드 ──kim-sync──▶ Drive 노드시트 ──▶ 폰 Gemini(조회)
                 ▲                    │
                 │              kim-ask(조회) · kim-check(점검) · kim-clean(정제)
          kim-calendar(큐 루프)
```

- **원천**: `vault/{namespace}/{doctype}/*.md` (git). 스키마는 `docs/infinite-brain/`.
- **투영**: `bash scripts/sync.sh` → `kim-1/{namespace}/{doctype}/` Drive 시트.
- **조회(폰)**: 폰 Gemini가 시트 전문검색으로 진입, 엣지로 순회 (ADR-0003, `docs/gemini-system-instructions.md`).
- **조회(로컬)**: `scripts/kim.mjs` 그래프 CLI.

## 스킬 스위트 (전부 한글)

| 스킬 | 언제 | 한다 |
|---|---|---|
| **kim-learn** | 지식을 넣을 때 | 원자료 → 노드+엣지 증류 (추가 전 조회) |
| **kim-ask** | 답을 찾을 때 | vault 그래프 탐색 → 관련 서브그래프 |
| **kim-check** | 정기 점검 | 건강도 → 리뷰 큐(고아/저신뢰/끊긴 엣지) |
| **kim-clean** | 큐를 비울 때 | 정제: 병합·고아 연결·촘촘화 |
| **kim-sync** | 세션 끝 | vault → Drive 노드시트 투영 |
| **kim-calendar** | 큐로 넣을 때 | `kim-calendar` 캘린더 큐를 루프로 인제스트 |

## 첫걸음

1. `gws auth status` → `oauth2` 확인 (아니면 `gws-setup`).
2. `node scripts/kim.mjs list` — 지금 vault에 뭐가 있나.
3. `node scripts/kim.mjs health` — 그래프 건강.
4. 지식 넣기: **kim-learn** (또는 `kim-calendar`에 이벤트로 큐잉).
5. 끝에 **kim-sync**.

## 로컬 CLI 치트시트

```bash
node scripts/kim.mjs list                      # 노드 목록
node scripts/kim.mjs search <질의>             # 검색(필드 일치수 랭크)
node scripts/kim.mjs node <id>                 # 상세 + 엣지 + 백링크
node scripts/kim.mjs neighbors <id> --depth 2  # 양방향 이웃
node scripts/kim.mjs health                    # 고아/저신뢰/끊긴 엣지
bash scripts/sync.sh                           # Drive 투영(멱등)
bash scripts/kim-cal.sh list                   # 캘린더 큐 미처리 목록
```

## 원칙 (eb에서 계승, 제외한 것)

- 계승: 그래프-인지 캡처(추가 전 조회), 도메인 어휘(증류/조회/정제/신뢰도), `<동사>` 스킬 네이밍.
- 제외: CSV 집계, 웹앱, Cloudflare Pages, GitHub Actions, 서비스계정 시트미러 — kim-1은 gws 노드별 시트로 대체.
- mattpocock 범용 스킬(tdd 등)은 외부 lock이라 건드리지 않는다.
