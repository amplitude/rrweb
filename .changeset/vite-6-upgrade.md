---
"@amplitude/rrweb-player": patch
"@amplitude/rrweb": patch
"@amplitude/rrweb-snapshot": patch
"@amplitude/rrdom": patch
"@amplitude/rrdom-nodejs": patch
"@amplitude/rrweb-record": patch
"@amplitude/rrweb-replay": patch
"@amplitude/rrweb-types": patch
"@amplitude/rrweb-utils": patch
"@amplitude/rrweb-packer": patch
"@amplitude/rrweb-all": patch
"@amplitude/rrweb-plugin-console-record": patch
"@amplitude/rrweb-plugin-console-replay": patch
"@amplitude/rrweb-plugin-sequential-id-record": patch
"@amplitude/rrweb-plugin-sequential-id-replay": patch
"@amplitude/rrweb-plugin-canvas-webrtc-record": patch
"@amplitude/rrweb-plugin-canvas-webrtc-replay": patch
"@amplitude/web-extension": patch
---

Upgrade vite from ^6.0.1 to ^6 across all packages. Vite 6.0.1 had a bug causing parser errors with CSS imports in TypeScript files, which is fixed in Vite 6.3.0+. Also fixed Svelte component issues (self-closing tags, ARIA attributes) and moved CSS import to main.ts to preserve runtime-generated classes.

