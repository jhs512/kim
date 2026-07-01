---
id: fact-rule-of-72
no: 4
title: 72법칙
type: fact
namespace: personal
visibility: public
summary: 72를 연이율(%)로 나누면 원금이 2배가 되는 대략적인 햇수가 나온다.
auto_inject: false
applicable_when: "Empty"
confidence: 0.9
verified_at: "Empty"
verified_by: "Empty"
staleness_signal: 이 근사식이 표준 금융 상식과 어긋나면 재검토한다
tags: ["finance", "interest", "heuristic", "rule-of-72"]
edges: [
  {"target": "concept-compound-interest", "type": "derived_from", "weight": 0.8, "note": "복리의 지수적 성장에서 유도되는 어림 규칙"}
]
related: ["[[concept-compound-interest]]"]
source_url: "Empty"
---

72를 연이율(퍼센트)로 나누면 원금이 두 배가 되는 데 걸리는 대략적인 햇수가 나온다.
예를 들어 연 6% 복리면 72 ÷ 6 = 약 12년 만에 두 배가 된다.

복리의 지수적 성장(A = P(1+r)^t)에서 나온 어림 규칙이라, 금리가 너무 높지 않은
구간에서 특히 잘 맞는다. 암산으로 복리 효과를 가늠할 때 쓰는 실용 도구다.
