---
id: concept-compound-interest
no: 1
title: 복리
type: concept
namespace: personal
visibility: public
summary: 원금뿐 아니라 누적된 이자에도 다시 이자가 붙는 이자 계산 방식.
auto_inject: false
applicable_when: "Empty"
confidence: 0.95
verified_at: "Empty"
verified_by: "Empty"
staleness_signal: 이 개념 정의가 표준 금융 교재의 정의와 어긋나면 재검토한다
tags: ["finance", "interest", "compounding", "savings"]
edges: [
  {"target": "concept-simple-interest", "type": "related_to", "weight": 0.6, "note": "원금에만 이자가 붙는 단리와 대비되는 개념"},
  {"target": "fact-compound-formula", "type": "related_to", "weight": 0.8, "note": "복리를 계산하는 수식"}
]
related: ["[[concept-simple-interest]]", "fact-compound-formula"]
source_url: "Empty"
---

원금에 대해서만 이자가 붙는 단리와 달리, 복리는 각 기간마다 발생한
이자를 원금에 합산한 뒤 그 합계에 다음 이자를 매긴다. 그래서 시간이
지날수록 이자가 이자를 낳아 잔액이 기하급수적으로 늘어난다.

핵심은 복리 주기(연/월/일 복리)와 기간이다. 같은 명목 금리라도
복리 주기가 짧을수록, 기간이 길수록 최종 금액이 커진다. 장기 저축·투자에서
결정적으로 작용하는 이유가 이것이다.
