---
"@amplitude/rrweb": minor
"@amplitude/rrweb-snapshot": patch
"@amplitude/rrweb-types": patch
---

Fix adoptedStyleSheets CSS not applied on replay when incremental AdoptedStyleSheet events are dropped in transit. CSS rules are now serialized inline in the full snapshot so replay is self-contained. Adds a `captureAdoptedStyleSheets` record option (default `true`) to opt out if snapshot size is a concern.
