---
"@amplitude/rrweb-snapshot": patch
"@amplitude/rrweb": patch
---

perf(replay): DocumentFragment batching in rebuild + shadow DOM hover fix

- Batch consecutive normal child insertions into a DocumentFragment during rebuild to reduce layout recalculations
- Fix :hover class cleanup across shadow DOM boundaries by tracking all root nodes that received hover classes
- Remove redundant type assertion on ShadowRoot.host
