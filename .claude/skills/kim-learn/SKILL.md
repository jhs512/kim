---
name: kim-learn
description: 원자료(텍스트·대화·파일)를 kim1 vault의 infinite-brain 타입 노드+엣지 마크다운으로 증류하는 그래프-인지 캡처 스킬. 추가 전에 그래프를 조회해 중복을 피하고 연결처를 찾는다. 트리거 - "지식 추가", "이거 기억해", "vault에 넣어줘", "노드로 만들어", "증류해줘".
---

# kim-learn — 그래프-인지 캡처(증류)

원자료를 노드+엣지로 **증류**해 `vault/`의 마크다운으로 반영한다. 핵심은 **추가하기 전에
그래프를 먼저 조회**해 고아·중복을 만들지 않는 것이다. 결정적 조회는 `scripts/kim.mjs`가,
검증은 `scripts/build-payloads.mjs`가 보증한다. 조회는 [[kim-ask]], 투영은 [[kim-sync]].

## 데이터 규약 (infinite-brain 스키마)

노드는 **완전한 infinite-brain 노드**다 — frontmatter 전체는 `docs/infinite-brain/FRONTMATTER-SCHEMA.md` 참고.
- 필수: `id, no, title, type, namespace, visibility`. 권장: `summary, tags, confidence, edges`.
- `id`: `타입-슬러그` kebab-case ASCII, vault 전역 고유 (예: `concept-compound-interest`).
- `type`: 17종 중 하나(단수). `visibility`: `public|namespace|private|system`.
- `edges`: `{target, type, weight, note}` 객체 배열. 엣지타입 10종(`related_to, supports, depends_on, derived_from, contradicts, part_of, preceded_by, followed_by, authored_by, tagged_with`).
- 파일 위치: `vault/{namespace}/{doctype}/{no}_{슬러그}.md` (doctype = type의 복수 폴더명).
- `no`: kim1 전역 순번. **`node scripts/kim.mjs list`로 현재 최대 no 확인 후 +1**.

## 캡처 파이프라인 (5단계)

1. **증류** — 원자료를 후보 노드(원자적 아이디어 1개 = 노드 1개)와 후보 엣지로 쪼갠다. 각 후보에 type·summary·tags 초안.

2. **그래프 조회 (추가 전!)** — 후보마다 기존 그래프 확인:
   ```bash
   node scripts/kim.mjs search <후보 제목/키워드>   # 중복 후보 탐지
   node scripts/kim.mjs node <관련 기존 id>          # 맥락 + 연결처 확인
   node scripts/kim.mjs neighbors <id> --depth 2     # 붙일 자리 탐색
   ```

3. **승인 게이트** — 사용자에게 제시: 추가할 노드/엣지, **중복 경고**, **제안 연결**. 승인 전 쓰지 않는다. 중복이면 새로 만들지 말고 기존 노드에 엣지만 잇는다.

4. **반영** — 승인된 것만 마크다운으로 쓴다(Write). **고아 금지**: 새 노드는 최소 1개 엣지로 기존 그래프에 연결. `edges`의 `target`은 대상 노드의 `id`.

5. **검증** — 항상 마지막에:
   ```bash
   node scripts/build-payloads.mjs /tmp/pv   # 위반(중복 no/id, 고아 엣지, 불변성) 0이어야 정상
   node scripts/kim.mjs health               # 고아/저신뢰/끊긴 엣지 점검
   ```
   그 뒤 [[kim-sync]]로 Drive에 투영.

## 출처 추적 (provenance)
캡처 단위마다 `source` 타입 노드 1개를 만들고(어디서 온 지식인지), 새 노드들을 거기에 `derived_from`으로 잇는다. 나중에 "이 지식 어디서 왔지?"를 그래프로 추적한다.

## 갱신은 덮어쓰지 말고 잇기 (supersede)
기존 지식이 바뀌면 옛 노드를 지우지 말고 **새 노드**를 만들어 `preceded_by`(옛→새)로 잇는다. 옛 주장과 모순되면 `contradicts`도 추가. git이 원천이라 변천 이력이 그래프에 보존된다.

## 주의
- 용어·불변 규칙은 `CONTEXT.md`, ADR-0002(`no`·`visibility` 불변)를 따른다.
- 노드는 긴 문서가 아니라 **원자적**으로. 길면 여러 노드로 쪼갠다.
