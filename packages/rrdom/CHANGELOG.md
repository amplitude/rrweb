# rrdom

## 2.0.0-alpha.30

### Patch Changes

- Updated dependencies [[`a722f4d`](https://github.com/amplitude/rrweb/commit/a722f4df44580162ac3840864d286623f8d95488)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.30

## 2.0.0-alpha.29

### Patch Changes

- Updated dependencies [[`7824d62`](https://github.com/amplitude/rrweb/commit/7824d62c7cf227c678ee1a1f500902fbfdd6c36a), [`7824d62`](https://github.com/amplitude/rrweb/commit/7824d62c7cf227c678ee1a1f500902fbfdd6c36a)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.29

## 2.0.0-alpha.28

### Patch Changes

- Updated dependencies []:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.28

## 2.0.0-alpha.27

### Patch Changes

- [#47](https://github.com/amplitude/rrweb/pull/47) [`197466e`](https://github.com/amplitude/rrweb/commit/197466e020a06a29c67bd8e3b96f6f7341c82560) Thanks [@jxiwang](https://github.com/jxiwang)! - Ignore invalid DOM attributes when diffing

- [#47](https://github.com/amplitude/rrweb/pull/47) [`197466e`](https://github.com/amplitude/rrweb/commit/197466e020a06a29c67bd8e3b96f6f7341c82560) Thanks [@jxiwang](https://github.com/jxiwang)! - `NodeType` enum was moved from rrweb-snapshot to @rrweb/types
  The following types where moved from rrweb-snapshot to @rrweb/types: `documentNode`, `documentTypeNode`, `legacyAttributes`, `textNode`, `cdataNode`, `commentNode`, `elementNode`, `serializedNode`, `serializedNodeWithId`, `serializedElementNodeWithId`, `serializedTextNodeWithId`, `IMirror`, `INode`, `mediaAttributes`, `attributes` and `DataURLOptions`
- Updated dependencies [[`197466e`](https://github.com/amplitude/rrweb/commit/197466e020a06a29c67bd8e3b96f6f7341c82560), [`197466e`](https://github.com/amplitude/rrweb/commit/197466e020a06a29c67bd8e3b96f6f7341c82560), [`197466e`](https://github.com/amplitude/rrweb/commit/197466e020a06a29c67bd8e3b96f6f7341c82560), [`197466e`](https://github.com/amplitude/rrweb/commit/197466e020a06a29c67bd8e3b96f6f7341c82560)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.27

## 2.0.0-alpha.26

### Patch Changes

- [#45](https://github.com/amplitude/rrweb/pull/45) [`e8e18b5`](https://github.com/amplitude/rrweb/commit/e8e18b55c1de705ae7b7bdf66b46f6e45e06b65e) Thanks [@jxiwang](https://github.com/jxiwang)! - chore(rrweb): fix the dist files to properly map to typescript checks

- Updated dependencies []:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.26

## 2.0.0-alpha.25

### Major Changes

- [#43](https://github.com/amplitude/rrweb/pull/43) [`0749d4c`](https://github.com/amplitude/rrweb/commit/0749d4c0d5ec0fb75b82db935d9cc8466645b307) Thanks [@jxiwang](https://github.com/jxiwang)! - Important: If you don't reference distributed files directly, for example you run `import rrweb from 'rrweb'` you won't notice a difference. If you include rrweb in a script tag and referred to a `.js` file, you'll now have to update that path to include a `.umd.cjs` file. Distributed files have new paths, filenames and extensions. All packages now no longer include a `.js` files, instead they include `.cjs`, `.umd.cjs` and `.mjs` files. The `.umd.cjs` files are CommonJS modules that bundle all files together to make it easy to ship one file to browser environments. The `.mjs` files are ES modules that can be used in modern browsers, node.js and bundlers that support ES modules. The `.cjs` files are CommonJS modules that can be used in older Node.js environments.

### Minor Changes

- [#43](https://github.com/amplitude/rrweb/pull/43) [`3ae57a6`](https://github.com/amplitude/rrweb/commit/3ae57a6d8803f4e076a448fa7e3967fa3c125487) Thanks [@jxiwang](https://github.com/jxiwang)! - Support top-layer <dialog> components. Fixes #1381.

### Patch Changes

- Updated dependencies [[`becf687`](https://github.com/amplitude/rrweb/commit/becf687910a21be618c8644642673217d75a4bfe), [`178f1e6`](https://github.com/amplitude/rrweb/commit/178f1e6e450e0903e9dadc4dc96dd74236f296ba), [`3ae57a6`](https://github.com/amplitude/rrweb/commit/3ae57a6d8803f4e076a448fa7e3967fa3c125487), [`0749d4c`](https://github.com/amplitude/rrweb/commit/0749d4c0d5ec0fb75b82db935d9cc8466645b307), [`6676611`](https://github.com/amplitude/rrweb/commit/6676611aa9ef5ef777d55289d7887293965e317f), [`3ef1e70`](https://github.com/amplitude/rrweb/commit/3ef1e709eb43b21505ed6bde405c2f6f83b0badc), [`4442d21`](https://github.com/amplitude/rrweb/commit/4442d21c5b1b6fb6dd6af6f52f97ca0317005ad8), [`9e9226f`](https://github.com/amplitude/rrweb/commit/9e9226fc00031dc6c2012dedcd53ec41db86b975)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.25

## 2.0.0-alpha.24

### Patch Changes

- Updated dependencies [[`d4dacd5`](https://github.com/amplitude/rrweb/commit/d4dacd507dfa8f7719ae6e136042843ba47b7302), [`e3c831c`](https://github.com/amplitude/rrweb/commit/e3c831c5442fc5d213f3a02dba8b746c9c87d37d)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.24

## 2.0.0-alpha.23

### Patch Changes

- Updated dependencies [[`9f0fb7c`](https://github.com/amplitude/rrweb/commit/9f0fb7c53f6910a33a69a843a8773e939f42b0fa), [`0983ef8`](https://github.com/amplitude/rrweb/commit/0983ef8c952ff0038e555e4147e008d2fb174248), [`88a15cf`](https://github.com/amplitude/rrweb/commit/88a15cf221f245a9e98ca0b074e7abced5798c5b), [`6d5cbf0`](https://github.com/amplitude/rrweb/commit/6d5cbf098d3322a9d2e29df0664d199025332e2a)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.23

## 2.0.0-alpha.22

### Patch Changes

- [#22](https://github.com/amplitude/rrweb/pull/22) [`87cba12`](https://github.com/amplitude/rrweb/commit/87cba12ebbc2da78671c16be6932c10b4c1cbb6d) Thanks [@jxiwang](https://github.com/jxiwang)! - Support `loop` in `RRMediaElement`

- [#22](https://github.com/amplitude/rrweb/pull/22) [`a880f6c`](https://github.com/amplitude/rrweb/commit/a880f6c22172e7ec853e3ba72a22e6082cd83aa0) Thanks [@jxiwang](https://github.com/jxiwang)! - fix: scrolling may not be applied when fast-forwarding

- Updated dependencies [[`87cba12`](https://github.com/amplitude/rrweb/commit/87cba12ebbc2da78671c16be6932c10b4c1cbb6d), [`a1d5962`](https://github.com/amplitude/rrweb/commit/a1d596254aa12bd85295f7c759ed28637cdffa04), [`ffdf49c`](https://github.com/amplitude/rrweb/commit/ffdf49c6e9f44177f80b320efdbfdb85a4da0756), [`ba7f3d5`](https://github.com/amplitude/rrweb/commit/ba7f3d50e982d6d2e5c1dd4868a536db5d3572e9)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.22

## 2.0.0-alpha.21

### Patch Changes

- Updated dependencies []:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.21

## 2.0.0-alpha.20

### Patch Changes

- Updated dependencies [[`5b85646`](https://github.com/amplitude/rrweb/commit/5b85646a9557c89d594c6a484f576fbdb0c38eb7)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.20

## 2.0.0-alpha.19

### Patch Changes

- Updated dependencies [[`f876ea5`](https://github.com/amplitude/rrweb/commit/f876ea55e21653d682a983b320f611d9ab09e0ad)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.19

## 2.0.0-alpha.18

### Patch Changes

- Updated dependencies [[`66c6fcb`](https://github.com/amplitude/rrweb/commit/66c6fcbf213694f8a6ff4784cec1e9b1320ae429)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.18

## 2.0.0-alpha.17

### Patch Changes

- Updated dependencies []:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.17

## 2.0.0-alpha.16

### Patch Changes

- Updated dependencies []:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.16

## 2.0.0-alpha.15

### Patch Changes

- Updated dependencies []:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.15

## 2.0.0-alpha.14

### Patch Changes

- Updated dependencies []:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.14

## 2.0.0-alpha.13

### Patch Changes

- Updated dependencies []:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.13

## 2.0.0-alpha.12

### Patch Changes

- Updated dependencies []:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.12

## 2.0.0-alpha.11

### Patch Changes

- Updated dependencies [[`11f6567`](https://github.com/rrweb-io/rrweb/commit/11f6567fd81ef9ed0f954a7b6d5e39653f56004f), [`efdc167`](https://github.com/rrweb-io/rrweb/commit/efdc167ca6c039d04af83612e3d92498bb9b41a7), [`efdc167`](https://github.com/rrweb-io/rrweb/commit/efdc167ca6c039d04af83612e3d92498bb9b41a7)]:
  - rrweb-snapshot@2.0.0-alpha.11

## 2.0.0-alpha.10

### Patch Changes

- Updated dependencies [[`c6600e7`](https://github.com/rrweb-io/rrweb/commit/c6600e742b8ec0b6295816bb5de9edcd624d975e)]:
  - rrweb-snapshot@2.0.0-alpha.10

## 2.0.0-alpha.9

### Patch Changes

- [#1222](https://github.com/rrweb-io/rrweb/pull/1222) [`b798f2d`](https://github.com/rrweb-io/rrweb/commit/b798f2dbc07b5a24dcaf40d164159200b6c0679d) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Fix: rrdom bugs

  1. Fix a bug in the diff algorithm.
  2. Omit the 'srcdoc' attribute of iframes to avoid overwriting content.

- Updated dependencies [[`d7c72bf`](https://github.com/rrweb-io/rrweb/commit/d7c72bff0724b46a6fa94af455220626a27104fe)]:
  - rrweb-snapshot@2.0.0-alpha.9

## 2.0.0-alpha.8

### Patch Changes

- Updated dependencies [[`bc84246`](https://github.com/rrweb-io/rrweb/commit/bc84246f78849a80dbb8fe9b4e76117afcc5c3f7), [`d0fdc0f`](https://github.com/rrweb-io/rrweb/commit/d0fdc0f273bb156a1faab4782b40fbec8dccf915)]:
  - rrweb-snapshot@2.0.0-alpha.8

## 2.0.0-alpha.7

### Patch Changes

- Updated dependencies [[`d2582e9`](https://github.com/rrweb-io/rrweb/commit/d2582e9a81197130cd93bc1dd778e16fddfb0be3), [`e7f0c80`](https://github.com/rrweb-io/rrweb/commit/e7f0c808c3f348fb27d1acd5fa300a5d92b14d00)]:
  - rrweb-snapshot@2.0.0-alpha.7

## 2.0.0-alpha.6

### Patch Changes

- [#1139](https://github.com/rrweb-io/rrweb/pull/1139) [`f27e545`](https://github.com/rrweb-io/rrweb/commit/f27e545e1871ed2c1753d37543f556e8ddc406b4) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Fix: If RRNode appends a single child twice, children of the node will become an infinite link list.

- Updated dependencies [[`c28ef5f`](https://github.com/rrweb-io/rrweb/commit/c28ef5f658abb93086504581409cf7a376db48dc), [`f6f07e9`](https://github.com/rrweb-io/rrweb/commit/f6f07e953376634a4caf28ff8cbfed5a017c4347), [`eac9b18`](https://github.com/rrweb-io/rrweb/commit/eac9b18bbfa3c350797b99b583dd93a5fc32b828), [`8e47ca1`](https://github.com/rrweb-io/rrweb/commit/8e47ca1021ebb4fc036b37623ef10abf7976d6dd)]:
  - rrweb-snapshot@2.0.0-alpha.6

## 2.0.0-alpha.5

### Major Changes

- [#1127](https://github.com/rrweb-io/rrweb/pull/1127) [`3cc4323`](https://github.com/rrweb-io/rrweb/commit/3cc4323094065a12f8b65afecd45061d604e245f) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Refactor: Improve performance by 80% in a super large benchmark case.

  1. Refactor: change the data structure of childNodes from array to linked list
  2. Improve the performance of the "contains" function. New algorithm will reduce the complexity from O(n) to O(logn)

### Patch Changes

- [#1126](https://github.com/rrweb-io/rrweb/pull/1126) [`227d43a`](https://github.com/rrweb-io/rrweb/commit/227d43abb93d57cadc70c760b28c46911bf7d8ff) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Refactor all suffix of bundled scripts with commonjs module from 'js' to cjs [#1087](https://github.com/rrweb-io/rrweb/pull/1087).

- [#1126](https://github.com/rrweb-io/rrweb/pull/1126) [`227d43a`](https://github.com/rrweb-io/rrweb/commit/227d43abb93d57cadc70c760b28c46911bf7d8ff) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Fix: improve rrdom robustness [#1091](https://github.com/rrweb-io/rrweb/pull/1091).

- Updated dependencies [[`1385f7a`](https://github.com/rrweb-io/rrweb/commit/1385f7acc0052f83be1458a7b00e18c026ee393f), [`227d43a`](https://github.com/rrweb-io/rrweb/commit/227d43abb93d57cadc70c760b28c46911bf7d8ff)]:
  - rrweb-snapshot@2.0.0-alpha.5
