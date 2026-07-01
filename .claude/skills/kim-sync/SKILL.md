---
name: kim-sync
description: kim-1 vault(마크다운)를 Google Drive 노드시트로 one-way 투영하는 스킬. knowledge-work 세션 끝에 실행한다. 트리거 - "투영", "sync", "동기화", "Drive에 반영", "시트 갱신", "knowledge-work 마무리".
---

# kim-sync — Drive 투영

vault의 노드들을 `kim-1/{namespace}/{doctype}/` 폴더의 Google 노드시트로 **one-way 투영**한다.
로직은 테스트된 순수 모듈(parse/validate/resolve/build-values)이, I/O는 `scripts/sync.sh`가
gws로 보증한다. **역동기화 없음**(폰 Gemini는 read-only 소비자, ADR-0003).

## 실행

```bash
bash scripts/sync.sh
```

내부 파이프라인(자동): vault 파싱 → **검증(위반 시 중단, no 투영)** → 엣지 해석(id→전체 문서이름) →
셀 빌드 → 노드마다 이름으로 조회 → 없으면 생성, 있으면 clear 후 재작성 → `.sync/manifest.tsv` 저장.

## 특성
- **멱등**: vault 변화 없이 재실행하면 새 문서 0개, manifest 동일.
- **전체 재투영**: 매 실행이 모든 노드를 다시 써서 엣지에 임베드된 이름을 최신으로 유지(ADR-0002).
- 문서 이름 = `kim-1_{no}_{namespace}_{doctype}_{visibility}_{title}`.

## 언제
- **knowledge-work 세션을 끝낼 때**(노드 추가/정제 후). [[kim-learn]]/[[kim-clean]] 뒤 마지막 단계.
- 전제: `gws auth status`가 `oauth2`. 아니면 `gws-setup` 스킬로 재인증.

## 주의
- 검증 실패 시 **아무것도 투영하지 않고 중단**한다 — 출력된 위반을 [[kim-clean]]으로 고친 뒤 재실행.
- 폴더는 사람 브라우징용일 뿐, 폰 Gemini 조회는 문서 이름 기반이다.
