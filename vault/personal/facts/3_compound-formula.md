---
id: fact-compound-formula
no: 3
title: 복리 공식
type: fact
namespace: personal
visibility: public
summary: 복리 미래가치는 A = P(1 + r/n)^(nt) 로 계산한다.
auto_inject: false
applicable_when: "Empty"
confidence: 1.0
verified_at: "Empty"
verified_by: "Empty"
staleness_signal: 이 공식이 표준 수학 정의와 어긋나면 재검토한다
tags: ["finance", "formula", "future-value", "mathematics"]
edges: [
  {"target": "concept-compound-interest", "type": "supports", "weight": 0.9, "note": "복리 개념을 수식으로 정량화하는 근거"}
]
related: ["[[concept-compound-interest]]"]
source_url: "Empty"
---

복리로 불어난 최종 금액(미래가치)은 다음으로 구한다:

    A = P (1 + r/n)^(n·t)

- P: 원금
- r: 연 명목 금리 (소수)
- n: 연간 복리 횟수 (연 1, 월 12, 일 365)
- t: 기간(년)
- A: t년 후 최종 금액

n을 키우면(복리 주기 단축) 같은 r·t에서도 A가 커지며, n→∞ 극한은
연속복리 A = P·e^(rt) 로 수렴한다.
