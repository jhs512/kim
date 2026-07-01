---
id: concept-simple-interest
no: 2
title: 단리
type: concept
namespace: personal
visibility: public
summary: 원금에 대해서만 이자가 붙고 이자에는 이자가 붙지 않는 이자 계산 방식.
auto_inject: false
applicable_when: "Empty"
confidence: 0.95
verified_at: "Empty"
verified_by: "Empty"
staleness_signal: 이 개념 정의가 표준 금융 교재의 정의와 어긋나면 재검토한다
tags: ["finance", "interest", "savings"]
edges: [
  {"target": "concept-compound-interest", "type": "related_to", "weight": 0.6, "note": "이자에 이자가 붙는 복리와 대비되는 개념"}
]
related: ["[[concept-compound-interest]]"]
source_url: "Empty"
---

이자를 오직 원금에만 매기는 방식. 각 기간의 이자는 항상 원금 × 금리로
일정하며, 앞선 이자가 다음 이자 계산에 포함되지 않는다.

따라서 잔액은 기간에 대해 선형으로 증가한다. 복리처럼 이자가 이자를
낳는 가속 효과가 없어, 같은 금리·기간이면 언제나 복리보다 최종 금액이 작다.
