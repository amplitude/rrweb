# rrweb

## 2.0.0-alpha.30

### Patch Changes

- [#55](https://github.com/amplitude/rrweb/pull/55) [`a722f4d`](https://github.com/amplitude/rrweb/commit/a722f4df44580162ac3840864d286623f8d95488) Thanks [@jpollock-ampl](https://github.com/jpollock-ampl)! - Enable adding a background color on blocked elements

- Updated dependencies [[`a722f4d`](https://github.com/amplitude/rrweb/commit/a722f4df44580162ac3840864d286623f8d95488)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.30
  - @amplitude/rrdom@2.0.0-alpha.30
  - @amplitude/rrweb-types@2.0.0-alpha.30
  - @amplitude/rrweb-utils@2.0.0-alpha.30

## 2.0.0-alpha.29

### Patch Changes

- [#50](https://github.com/amplitude/rrweb/pull/50) [`7824d62`](https://github.com/amplitude/rrweb/commit/7824d62c7cf227c678ee1a1f500902fbfdd6c36a) Thanks [@jpollock-ampl](https://github.com/jpollock-ampl)! - Improve performance of splitCssText for <style> elements with large css content - see #1603

- [#50](https://github.com/amplitude/rrweb/pull/50) [`7824d62`](https://github.com/amplitude/rrweb/commit/7824d62c7cf227c678ee1a1f500902fbfdd6c36a) Thanks [@jpollock-ampl](https://github.com/jpollock-ampl)! - Improve performance of splitCssText for <style> elements with large css content - see #1603

- Updated dependencies [[`7824d62`](https://github.com/amplitude/rrweb/commit/7824d62c7cf227c678ee1a1f500902fbfdd6c36a), [`7824d62`](https://github.com/amplitude/rrweb/commit/7824d62c7cf227c678ee1a1f500902fbfdd6c36a)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.29
  - @amplitude/rrdom@2.0.0-alpha.29
  - @amplitude/rrweb-types@2.0.0-alpha.29
  - @amplitude/rrweb-utils@2.0.0-alpha.29

## 2.0.0-alpha.28

### Patch Changes

- [#51](https://github.com/amplitude/rrweb/pull/51) [`6b175a4`](https://github.com/amplitude/rrweb/commit/6b175a4a945ea79b4cea6c609544ad1502a65610) Thanks [@jpollock-ampl](https://github.com/jpollock-ampl)! - #1596 Add masking for innerText mutations on textarea elements

- Updated dependencies []:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.28
  - @amplitude/rrdom@2.0.0-alpha.28
  - @amplitude/rrweb-types@2.0.0-alpha.28
  - @amplitude/rrweb-utils@2.0.0-alpha.28

## 2.0.0-alpha.27

### Minor Changes

- [#47](https://github.com/amplitude/rrweb/pull/47) [`197466e`](https://github.com/amplitude/rrweb/commit/197466e020a06a29c67bd8e3b96f6f7341c82560) Thanks [@jxiwang](https://github.com/jxiwang)! - Optimize isParentRemoved check

### Patch Changes

- [#47](https://github.com/amplitude/rrweb/pull/47) [`197466e`](https://github.com/amplitude/rrweb/commit/197466e020a06a29c67bd8e3b96f6f7341c82560) Thanks [@jxiwang](https://github.com/jxiwang)! - Slight simplification to how we replace :hover after #1458

- [#47](https://github.com/amplitude/rrweb/pull/47) [`197466e`](https://github.com/amplitude/rrweb/commit/197466e020a06a29c67bd8e3b96f6f7341c82560) Thanks [@jxiwang](https://github.com/jxiwang)! - Edge case: Provide support for mutations on a <style> element which (unusually) has multiple text nodes

- [#47](https://github.com/amplitude/rrweb/pull/47) [`197466e`](https://github.com/amplitude/rrweb/commit/197466e020a06a29c67bd8e3b96f6f7341c82560) Thanks [@jxiwang](https://github.com/jxiwang)! - `NodeType` enum was moved from rrweb-snapshot to @rrweb/types
  The following types where moved from rrweb-snapshot to @rrweb/types: `documentNode`, `documentTypeNode`, `legacyAttributes`, `textNode`, `cdataNode`, `commentNode`, `elementNode`, `serializedNode`, `serializedNodeWithId`, `serializedElementNodeWithId`, `serializedTextNodeWithId`, `IMirror`, `INode`, `mediaAttributes`, `attributes` and `DataURLOptions`
- Updated dependencies [[`197466e`](https://github.com/amplitude/rrweb/commit/197466e020a06a29c67bd8e3b96f6f7341c82560), [`197466e`](https://github.com/amplitude/rrweb/commit/197466e020a06a29c67bd8e3b96f6f7341c82560), [`197466e`](https://github.com/amplitude/rrweb/commit/197466e020a06a29c67bd8e3b96f6f7341c82560), [`197466e`](https://github.com/amplitude/rrweb/commit/197466e020a06a29c67bd8e3b96f6f7341c82560), [`197466e`](https://github.com/amplitude/rrweb/commit/197466e020a06a29c67bd8e3b96f6f7341c82560)]:
  - @amplitude/rrdom@2.0.0-alpha.27
  - @amplitude/rrweb-snapshot@2.0.0-alpha.27
  - @amplitude/rrweb-types@2.0.0-alpha.27
  - @amplitude/rrweb-utils@2.0.0-alpha.27

## 2.0.0-alpha.26

### Patch Changes

- [#45](https://github.com/amplitude/rrweb/pull/45) [`e8e18b5`](https://github.com/amplitude/rrweb/commit/e8e18b55c1de705ae7b7bdf66b46f6e45e06b65e) Thanks [@jxiwang](https://github.com/jxiwang)! - chore(rrweb): fix the dist files to properly map to typescript checks

- Updated dependencies [[`e8e18b5`](https://github.com/amplitude/rrweb/commit/e8e18b55c1de705ae7b7bdf66b46f6e45e06b65e)]:
  - @amplitude/rrdom@2.0.0-alpha.26
  - @amplitude/rrweb-snapshot@2.0.0-alpha.26
  - @amplitude/rrweb-types@2.0.0-alpha.26
  - @amplitude/rrweb-utils@2.0.0-alpha.26

## 2.0.0-alpha.25

### Major Changes

- [#43](https://github.com/amplitude/rrweb/pull/43) [`0749d4c`](https://github.com/amplitude/rrweb/commit/0749d4c0d5ec0fb75b82db935d9cc8466645b307) Thanks [@jxiwang](https://github.com/jxiwang)! - Split plugins out of rrweb and move them into their own packages: @rrweb/packer, @rrweb/rrweb-plugin-canvas-webrtc-record, @rrweb/rrweb-plugin-canvas-webrtc-replay, @rrweb/rrweb-plugin-sequential-id-record, @rrweb/rrweb-plugin-sequential-id-replay, @rrweb/rrweb-plugin-console-record, @rrweb/rrweb-plugin-console-replay. Check out the README of each package for more information or check out https://github.com/rrweb-io/rrweb/pull/1033 to see the changes.

- [#43](https://github.com/amplitude/rrweb/pull/43) [`0749d4c`](https://github.com/amplitude/rrweb/commit/0749d4c0d5ec0fb75b82db935d9cc8466645b307) Thanks [@jxiwang](https://github.com/jxiwang)! - Important: If you don't reference distributed files directly, for example you run `import rrweb from 'rrweb'` you won't notice a difference. If you include rrweb in a script tag and referred to a `.js` file, you'll now have to update that path to include a `.umd.cjs` file. Distributed files have new paths, filenames and extensions. All packages now no longer include a `.js` files, instead they include `.cjs`, `.umd.cjs` and `.mjs` files. The `.umd.cjs` files are CommonJS modules that bundle all files together to make it easy to ship one file to browser environments. The `.mjs` files are ES modules that can be used in modern browsers, node.js and bundlers that support ES modules. The `.cjs` files are CommonJS modules that can be used in older Node.js environments.

- [#43](https://github.com/amplitude/rrweb/pull/43) [`0749d4c`](https://github.com/amplitude/rrweb/commit/0749d4c0d5ec0fb75b82db935d9cc8466645b307) Thanks [@jxiwang](https://github.com/jxiwang)! - Remove the rrweb-all.js, rrweb-record.js, and rrweb-replay.js files from `rrweb` package. Now you can use `@rrweb/all`, `@rrweb/record`, and `@rrweb/replay` packages instead. Check out the README of each package for more information or check out [PR #1033](https://github.com/rrweb-io/rrweb/pull/1033) to see the changes.

### Minor Changes

- [#43](https://github.com/amplitude/rrweb/pull/43) [`3ae57a6`](https://github.com/amplitude/rrweb/commit/3ae57a6d8803f4e076a448fa7e3967fa3c125487) Thanks [@jxiwang](https://github.com/jxiwang)! - Support top-layer <dialog> components. Fixes #1381.

### Patch Changes

- [#43](https://github.com/amplitude/rrweb/pull/43) [`becf687`](https://github.com/amplitude/rrweb/commit/becf687910a21be618c8644642673217d75a4bfe) Thanks [@jxiwang](https://github.com/jxiwang)! - Fix that the optional `maskInputFn` was being accidentally ignored during the creation of the full snapshot

- [#43](https://github.com/amplitude/rrweb/pull/43) [`178f1e6`](https://github.com/amplitude/rrweb/commit/178f1e6e450e0903e9dadc4dc96dd74236f296ba) Thanks [@jxiwang](https://github.com/jxiwang)! - fix: duplicate textContent for style elements cause incremental style mutations to be invalid

- [#43](https://github.com/amplitude/rrweb/pull/43) [`4fe0153`](https://github.com/amplitude/rrweb/commit/4fe01532dc533ecbcc01d3fa5fcec8a0abbf292e) Thanks [@jxiwang](https://github.com/jxiwang)! - Export `ReplayPlugin` from rrweb directly. Previously we had to do `import type { ReplayPlugin } from 'rrweb/dist/types';` now we can do `import type { ReplayPlugin } from 'rrweb';`

- [#43](https://github.com/amplitude/rrweb/pull/43) [`1dba10a`](https://github.com/amplitude/rrweb/commit/1dba10a215ea873fd1663d77c58c783c9d8a0edc) Thanks [@jxiwang](https://github.com/jxiwang)! - Export takeFullSnapshot function for a recording process

- [#43](https://github.com/amplitude/rrweb/pull/43) [`e8a0ecd`](https://github.com/amplitude/rrweb/commit/e8a0ecd0268e599c17e97bcd91f94c44b04d79a0) Thanks [@jxiwang](https://github.com/jxiwang)! - Added support for deprecated addRule & removeRule methods

- [#43](https://github.com/amplitude/rrweb/pull/43) [`f317df7`](https://github.com/amplitude/rrweb/commit/f317df792ba69ee33b7148f486dea8e77cfab42a) Thanks [@jxiwang](https://github.com/jxiwang)! - Fix: some nested cross-origin iframes can't be recorded

- [#43](https://github.com/amplitude/rrweb/pull/43) [`3ef1e70`](https://github.com/amplitude/rrweb/commit/3ef1e709eb43b21505ed6bde405c2f6f83b0badc) Thanks [@jxiwang](https://github.com/jxiwang)! - optimisation: skip mask check on leaf elements

- [#43](https://github.com/amplitude/rrweb/pull/43) [`4442d21`](https://github.com/amplitude/rrweb/commit/4442d21c5b1b6fb6dd6af6f52f97ca0317005ad8) Thanks [@jxiwang](https://github.com/jxiwang)! - Add slimDOM option to block animation on <title> tag; enabled when the 'all' value is used for slimDOM

- [#43](https://github.com/amplitude/rrweb/pull/43) [`9e9226f`](https://github.com/amplitude/rrweb/commit/9e9226fc00031dc6c2012dedcd53ec41db86b975) Thanks [@jxiwang](https://github.com/jxiwang)! - Reverse monkey patch built in methods to support LWC (and other frameworks like angular which monkey patch built in methods).

- Updated dependencies [[`becf687`](https://github.com/amplitude/rrweb/commit/becf687910a21be618c8644642673217d75a4bfe), [`178f1e6`](https://github.com/amplitude/rrweb/commit/178f1e6e450e0903e9dadc4dc96dd74236f296ba), [`3ae57a6`](https://github.com/amplitude/rrweb/commit/3ae57a6d8803f4e076a448fa7e3967fa3c125487), [`0749d4c`](https://github.com/amplitude/rrweb/commit/0749d4c0d5ec0fb75b82db935d9cc8466645b307), [`3ae57a6`](https://github.com/amplitude/rrweb/commit/3ae57a6d8803f4e076a448fa7e3967fa3c125487), [`6676611`](https://github.com/amplitude/rrweb/commit/6676611aa9ef5ef777d55289d7887293965e317f), [`3ef1e70`](https://github.com/amplitude/rrweb/commit/3ef1e709eb43b21505ed6bde405c2f6f83b0badc), [`4442d21`](https://github.com/amplitude/rrweb/commit/4442d21c5b1b6fb6dd6af6f52f97ca0317005ad8), [`9e9226f`](https://github.com/amplitude/rrweb/commit/9e9226fc00031dc6c2012dedcd53ec41db86b975)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.25
  - @amplitude/rrdom@2.0.0-alpha.25
  - @amplitude/rrweb-types@2.0.0-alpha.25
  - @amplitude/rrweb-utils@2.0.0-alpha.25

## 2.0.0-alpha.24

### Patch Changes

- [#39](https://github.com/amplitude/rrweb/pull/39) [`d4dacd5`](https://github.com/amplitude/rrweb/commit/d4dacd507dfa8f7719ae6e136042843ba47b7302) Thanks [@jxiwang](https://github.com/jxiwang)! - inlineImages: during snapshot avoid adding an event listener for inlining of same-origin images (async listener mutates the snapshot which can be problematic)

- [#39](https://github.com/amplitude/rrweb/pull/39) [`bc92f7c`](https://github.com/amplitude/rrweb/commit/bc92f7ca0c5887aa7ca8943b3966a23e92e02c11) Thanks [@jxiwang](https://github.com/jxiwang)! - Optimize performance of isParentRemoved by converting it to an iterative procedure

- [#39](https://github.com/amplitude/rrweb/pull/39) [`f075371`](https://github.com/amplitude/rrweb/commit/f075371b7c8125a69422322c3d63e237d3100e9c) Thanks [@jxiwang](https://github.com/jxiwang)! - Refactor to preclude the need for a continuous raf loop running in the background which is related to shadowDom

- Updated dependencies [[`d4dacd5`](https://github.com/amplitude/rrweb/commit/d4dacd507dfa8f7719ae6e136042843ba47b7302), [`e3c831c`](https://github.com/amplitude/rrweb/commit/e3c831c5442fc5d213f3a02dba8b746c9c87d37d)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.24
  - @amplitude/rrdom@2.0.0-alpha.24
  - @amplitude/rrweb-types@2.0.0-alpha.24

## 2.0.0-alpha.23

### Patch Changes

- [#23](https://github.com/amplitude/rrweb/pull/23) [`9f0fb7c`](https://github.com/amplitude/rrweb/commit/9f0fb7c53f6910a33a69a843a8773e939f42b0fa) Thanks [@jxiwang](https://github.com/jxiwang)! - better support for coexistence with older libraries (e.g. MooTools & Prototype.js) which modify the in-built `Array.from` function

- [#23](https://github.com/amplitude/rrweb/pull/23) [`b996cbb`](https://github.com/amplitude/rrweb/commit/b996cbb9339ee928d2364b16dc932921d2dd6492) Thanks [@jxiwang](https://github.com/jxiwang)! - perf: Avoid an extra function call and object clone during event emission

- [#23](https://github.com/amplitude/rrweb/pull/23) [`0983ef8`](https://github.com/amplitude/rrweb/commit/0983ef8c952ff0038e555e4147e008d2fb174248) Thanks [@jxiwang](https://github.com/jxiwang)! - Fixup for multiple background-clip replacement

- [#23](https://github.com/amplitude/rrweb/pull/23) [`6d5cbf0`](https://github.com/amplitude/rrweb/commit/6d5cbf098d3322a9d2e29df0664d199025332e2a) Thanks [@jxiwang](https://github.com/jxiwang)! - Bugfix after #1434 perf improvements: fix that blob urls persist on the shared anchor element and can't be later modified

- Updated dependencies [[`9f0fb7c`](https://github.com/amplitude/rrweb/commit/9f0fb7c53f6910a33a69a843a8773e939f42b0fa), [`0983ef8`](https://github.com/amplitude/rrweb/commit/0983ef8c952ff0038e555e4147e008d2fb174248), [`88a15cf`](https://github.com/amplitude/rrweb/commit/88a15cf221f245a9e98ca0b074e7abced5798c5b), [`6d5cbf0`](https://github.com/amplitude/rrweb/commit/6d5cbf098d3322a9d2e29df0664d199025332e2a)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.23
  - @amplitude/rrdom@2.0.0-alpha.23
  - @amplitude/rrweb-types@2.0.0-alpha.23

## 2.0.0-alpha.22

### Minor Changes

- [#22](https://github.com/amplitude/rrweb/pull/22) [`87cba12`](https://github.com/amplitude/rrweb/commit/87cba12ebbc2da78671c16be6932c10b4c1cbb6d) Thanks [@jxiwang](https://github.com/jxiwang)! - Full overhawl of `video` and `audio` element playback. More robust and fixes lots of bugs related to pausing/playing/skipping/muting/playbackRate etc.

### Patch Changes

- [#22](https://github.com/amplitude/rrweb/pull/22) [`931a6bb`](https://github.com/amplitude/rrweb/commit/931a6bbc34cb9b4f0daa3e99544b4990001460a1) Thanks [@jxiwang](https://github.com/jxiwang)! - fix: createImageBitmap throws DOMException if source is 0 width or height

- [#22](https://github.com/amplitude/rrweb/pull/22) [`e9cfd9f`](https://github.com/amplitude/rrweb/commit/e9cfd9fbc1876c641e9ededa8e1088e86fa6aab7) Thanks [@jxiwang](https://github.com/jxiwang)! - safely capture BigInt values with the console log plugin"

- [#22](https://github.com/amplitude/rrweb/pull/22) [`a1d5962`](https://github.com/amplitude/rrweb/commit/a1d596254aa12bd85295f7c759ed28637cdffa04) Thanks [@jxiwang](https://github.com/jxiwang)! - Feat: Add support for replaying :defined pseudo-class of custom elements

- [#22](https://github.com/amplitude/rrweb/pull/22) [`a5ef2a8`](https://github.com/amplitude/rrweb/commit/a5ef2a867154aed9cc49cdeb7ef1056095e264d1) Thanks [@jxiwang](https://github.com/jxiwang)! - ref: Avoid unnecessary cloning of objects or arrays

- [#34](https://github.com/amplitude/rrweb/pull/34) [`43f38b1`](https://github.com/amplitude/rrweb/commit/43f38b1e9c9bf0f64fbf288ac868000ca876de81) Thanks [@jxiwang](https://github.com/jxiwang)! - Change package names

- [#22](https://github.com/amplitude/rrweb/pull/22) [`0c34ddd`](https://github.com/amplitude/rrweb/commit/0c34dddfb350d897e0a684e7860e699d20c544c4) Thanks [@jxiwang](https://github.com/jxiwang)! - export the canvasMutation function

- [#22](https://github.com/amplitude/rrweb/pull/22) [`53b18a9`](https://github.com/amplitude/rrweb/commit/53b18a954d09c487fc08e46d8aa4030500f43b86) Thanks [@jxiwang](https://github.com/jxiwang)! - export eventWithTime for consumption by typescript code

- [#22](https://github.com/amplitude/rrweb/pull/22) [`87cba12`](https://github.com/amplitude/rrweb/commit/87cba12ebbc2da78671c16be6932c10b4c1cbb6d) Thanks [@jxiwang](https://github.com/jxiwang)! - Record `loop` on `<audio>` & `<video>` elements.

- [#22](https://github.com/amplitude/rrweb/pull/22) [`ffdf49c`](https://github.com/amplitude/rrweb/commit/ffdf49c6e9f44177f80b320efdbfdb85a4da0756) Thanks [@jxiwang](https://github.com/jxiwang)! - Capture stylesheets designated as `rel="preload"`

- [#22](https://github.com/amplitude/rrweb/pull/22) [`ba7f3d5`](https://github.com/amplitude/rrweb/commit/ba7f3d50e982d6d2e5c1dd4868a536db5d3572e9) Thanks [@jxiwang](https://github.com/jxiwang)! - Snapshot performance when masking text: Avoid the repeated calls to `closest` when recursing through the DOM

- [#22](https://github.com/amplitude/rrweb/pull/22) [`c400629`](https://github.com/amplitude/rrweb/commit/c4006294af905b3c10d793d941ca00426300c092) Thanks [@jxiwang](https://github.com/jxiwang)! - fix: protect against missing parentNode

- Updated dependencies [[`87cba12`](https://github.com/amplitude/rrweb/commit/87cba12ebbc2da78671c16be6932c10b4c1cbb6d), [`87cba12`](https://github.com/amplitude/rrweb/commit/87cba12ebbc2da78671c16be6932c10b4c1cbb6d), [`87cba12`](https://github.com/amplitude/rrweb/commit/87cba12ebbc2da78671c16be6932c10b4c1cbb6d), [`a1d5962`](https://github.com/amplitude/rrweb/commit/a1d596254aa12bd85295f7c759ed28637cdffa04), [`ffdf49c`](https://github.com/amplitude/rrweb/commit/ffdf49c6e9f44177f80b320efdbfdb85a4da0756), [`a880f6c`](https://github.com/amplitude/rrweb/commit/a880f6c22172e7ec853e3ba72a22e6082cd83aa0), [`ba7f3d5`](https://github.com/amplitude/rrweb/commit/ba7f3d50e982d6d2e5c1dd4868a536db5d3572e9), [`21278b5`](https://github.com/amplitude/rrweb/commit/21278b54b57f16e98b05923103e82b77b2eda19f)]:
  - @amplitude/rrdom@2.0.0-alpha.22
  - @amplitude/rrweb-snapshot@2.0.0-alpha.22
  - @amplitude/rrweb-types@2.0.0-alpha.22

## 2.0.0-alpha.21

### Patch Changes

- [#30](https://github.com/amplitude/rrweb/pull/30) [`8002e3b`](https://github.com/amplitude/rrweb/commit/8002e3b251e6e38a9c307b176f9b8ecb3c16bc57) Thanks [@jxiwang](https://github.com/jxiwang)! - Adding null check to tag name

- Updated dependencies []:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.21
  - @amplitude/rrdom@2.0.0-alpha.21
  - @amplitude/rrweb-types@2.0.0-alpha.21

## 2.0.0-alpha.20

### Patch Changes

- [#27](https://github.com/amplitude/rrweb/pull/27) [`5b85646`](https://github.com/amplitude/rrweb/commit/5b85646a9557c89d594c6a484f576fbdb0c38eb7) Thanks [@jxiwang](https://github.com/jxiwang)! - Replay: Replace negative lookbehind in regexes from css parser as it causes issues with Safari 16

- [#27](https://github.com/amplitude/rrweb/pull/27) [`5b85646`](https://github.com/amplitude/rrweb/commit/5b85646a9557c89d594c6a484f576fbdb0c38eb7) Thanks [@jxiwang](https://github.com/jxiwang)! - Return early for child same origin frames

- Updated dependencies [[`5b85646`](https://github.com/amplitude/rrweb/commit/5b85646a9557c89d594c6a484f576fbdb0c38eb7)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.20
  - @amplitude/rrdom@2.0.0-alpha.20
  - @amplitude/rrweb-types@2.0.0-alpha.20

## 2.0.0-alpha.19

### Patch Changes

- [#25](https://github.com/amplitude/rrweb/pull/25) [`8cb959c`](https://github.com/amplitude/rrweb/commit/8cb959c1bf745c0a0e94bd49f0bbda40cccbbe07) Thanks [@lewgordon-amplitude](https://github.com/lewgordon-amplitude)! - use WeakMap for faster attributeCursor lookup while processing attribute mutations

- [#25](https://github.com/amplitude/rrweb/pull/25) [`f876ea5`](https://github.com/amplitude/rrweb/commit/f876ea55e21653d682a983b320f611d9ab09e0ad) Thanks [@lewgordon-amplitude](https://github.com/lewgordon-amplitude)! - Don't double-record the values of <textarea>s when they already have some content prefilled #1301

- Updated dependencies [[`f876ea5`](https://github.com/amplitude/rrweb/commit/f876ea55e21653d682a983b320f611d9ab09e0ad)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.19
  - @amplitude/rrdom@2.0.0-alpha.19
  - @amplitude/rrweb-types@2.0.0-alpha.19

## 2.0.0-alpha.18

### Patch Changes

- Updated dependencies [[`66c6fcb`](https://github.com/amplitude/rrweb/commit/66c6fcbf213694f8a6ff4784cec1e9b1320ae429)]:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.18
  - @amplitude/rrdom@2.0.0-alpha.18
  - @amplitude/rrweb-types@2.0.0-alpha.18

## 2.0.0-alpha.17

### Patch Changes

- [#16](https://github.com/amplitude/rrweb/pull/16) [`aaee874`](https://github.com/amplitude/rrweb/commit/aaee87499109fef069ec4924afc127bda2886bfc) Thanks [@jxiwang](https://github.com/jxiwang)! - Fix and test for bug #1457 which was affecting replay of complex tailwind css

- Updated dependencies []:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.17
  - @amplitude/rrdom@2.0.0-alpha.17
  - @amplitude/rrweb-types@2.0.0-alpha.17

## 2.0.0-alpha.16

### Patch Changes

- [#17](https://github.com/amplitude/rrweb/pull/17) [`c7dfd53`](https://github.com/amplitude/rrweb/commit/c7dfd538c59dce2e4c3db4085beb2e2cec9168bf) Thanks [@jxiwang](https://github.com/jxiwang)! - Ensure :hover works on replayer, even if a rule is behind a media query
  Respect the intent behind max-device-width and min-device-width media queries so that their effects are apparent in the replayer context
- Updated dependencies []:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.16
  - @amplitude/rrdom@2.0.0-alpha.16
  - @amplitude/rrweb-types@2.0.0-alpha.16

## 2.0.0-alpha.15

### Patch Changes

- [#14](https://github.com/amplitude/rrweb/pull/14) [`942c7ce`](https://github.com/amplitude/rrweb/commit/942c7ce20446ffcd8cac52814fc7ea0501e82b20) Thanks [@jxiwang](https://github.com/jxiwang)! - Fix css parsing errors

- Updated dependencies []:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.15
  - @amplitude/rrdom@2.0.0-alpha.15
  - @amplitude/rrweb-types@2.0.0-alpha.15

## 2.0.0-alpha.14

### Patch Changes

- [#8](https://github.com/amplitude/rrweb/pull/8) [`e8d02c7`](https://github.com/amplitude/rrweb/commit/e8d02c78153ed954dc7aa44c6c720c550e4e1252) Thanks [@jackson-amplitude](https://github.com/jackson-amplitude)! - fix(rrweb): external function errors should be tagged

- Updated dependencies []:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.14
  - @amplitude/rrdom@2.0.0-alpha.14
  - @amplitude/rrweb-types@2.0.0-alpha.14

## 2.0.0-alpha.13

### Patch Changes

- [#5](https://github.com/amplitude/rrweb/pull/5) [`8017f2a`](https://github.com/amplitude/rrweb/commit/8017f2a2901ab5c73b47952ad1fb012d37eb3efc) Thanks [@lewgordon-amplitude](https://github.com/lewgordon-amplitude)! - fix(rrweb-snapshot): pass maskInputFn correctly

- Updated dependencies []:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.13
  - @amplitude/rrdom@2.0.0-alpha.13
  - @amplitude/rrweb-types@2.0.0-alpha.13

## 2.0.0-alpha.12

### Patch Changes

- [`2dd990c`](https://github.com/amplitude/rrweb/commit/2dd990cbcfbaf5e552816379115608a9762e1b45) Thanks [@kwalker3690](https://github.com/kwalker3690)! - feat: skip through inactive periods instead of fast forward

- [`2dd990c`](https://github.com/amplitude/rrweb/commit/2dd990cbcfbaf5e552816379115608a9762e1b45) Thanks [@kwalker3690](https://github.com/kwalker3690)! - perf: only call createHTMLDocument when it is needed

- Updated dependencies []:
  - @amplitude/rrweb-snapshot@2.0.0-alpha.12
  - @amplitude/rrdom@2.0.0-alpha.12
  - @amplitude/rrweb-types@2.0.0-alpha.12

## 2.0.0-alpha.11

### Patch Changes

- [#1279](https://github.com/rrweb-io/rrweb/pull/1279) [`11f6567`](https://github.com/rrweb-io/rrweb/commit/11f6567fd81ef9ed0f954a7b6d5e39653f56004f) Thanks [@eoghanmurray](https://github.com/eoghanmurray)! - Extend to run fixBrowserCompatibilityIssuesInCSS over inline stylesheets

- [#1287](https://github.com/rrweb-io/rrweb/pull/1287) [`efdc167`](https://github.com/rrweb-io/rrweb/commit/efdc167ca6c039d04af83612e3d92498bb9b41a7) Thanks [@Juice10](https://github.com/Juice10)! - Upgrade all projects to typescript 4.9.5

- Updated dependencies [[`11f6567`](https://github.com/rrweb-io/rrweb/commit/11f6567fd81ef9ed0f954a7b6d5e39653f56004f), [`efdc167`](https://github.com/rrweb-io/rrweb/commit/efdc167ca6c039d04af83612e3d92498bb9b41a7), [`efdc167`](https://github.com/rrweb-io/rrweb/commit/efdc167ca6c039d04af83612e3d92498bb9b41a7)]:
  - rrweb-snapshot@2.0.0-alpha.11
  - @rrweb/types@2.0.0-alpha.11
  - rrdom@2.0.0-alpha.11

## 2.0.0-alpha.10

### Patch Changes

- [#1269](https://github.com/rrweb-io/rrweb/pull/1269) [`7103625`](https://github.com/rrweb-io/rrweb/commit/7103625b4683cbd75732ee03973e38f573847b1c) Thanks [@eoghanmurray](https://github.com/eoghanmurray)! - Don't include redundant data from text/attribute mutations on just-added nodes

- [#1268](https://github.com/rrweb-io/rrweb/pull/1268) [`d872d28`](https://github.com/rrweb-io/rrweb/commit/d872d2809e3ec8d6ff5d3d5f43bc81aff70e7548) Thanks [@eoghanmurray](https://github.com/eoghanmurray)! - Compact style mutation fixes and improvements

  - fixes when style updates contain a 'var()' on a shorthand property #1246
  - further ensures that style mutations are compact by reverting to string method if it is shorter

- [#1262](https://github.com/rrweb-io/rrweb/pull/1262) [`36da39d`](https://github.com/rrweb-io/rrweb/commit/36da39db366a9f80c28549771ed331090a1c6647) Thanks [@billyvg](https://github.com/billyvg)! - feat: Add `ignoreSelector` option

  Similar to ignoreClass, but accepts a CSS selector so that you can use any CSS selector.

- [#1251](https://github.com/rrweb-io/rrweb/pull/1251) [`bbbfa22`](https://github.com/rrweb-io/rrweb/commit/bbbfa226fc5882a01ecc1607b713f0caf797775e) Thanks [@wfk007](https://github.com/wfk007)! - fix: Resize and MediaInteraction events repeat generated after the iframe appeared

- [#1254](https://github.com/rrweb-io/rrweb/pull/1254) [`d0fbe23`](https://github.com/rrweb-io/rrweb/commit/d0fbe23c632021410a6dd45f9028a9a012467261) Thanks [@mydea](https://github.com/mydea)! - Handle case where `event` is null/undefined

- [#1273](https://github.com/rrweb-io/rrweb/pull/1273) [`a3de582`](https://github.com/rrweb-io/rrweb/commit/a3de582e9c32be9e0ccd84bb7df756af6b0594f7) Thanks [@Juice10](https://github.com/Juice10)! - Canvas FPS recording: override `preserveDrawingBuffer: true` on canvas creation.
  Canvas replay: fix flickering canvas elemenrs.
  Canvas FPS recording: fix bug that wipes webgl(2) canvas backgrounds while recording.
- Updated dependencies [[`d872d28`](https://github.com/rrweb-io/rrweb/commit/d872d2809e3ec8d6ff5d3d5f43bc81aff70e7548), [`c6600e7`](https://github.com/rrweb-io/rrweb/commit/c6600e742b8ec0b6295816bb5de9edcd624d975e)]:
  - @rrweb/types@2.0.0-alpha.10
  - rrweb-snapshot@2.0.0-alpha.10
  - rrdom@2.0.0-alpha.10

## 2.0.0-alpha.9

### Patch Changes

- [#1196](https://github.com/rrweb-io/rrweb/pull/1196) [`490b3e2`](https://github.com/rrweb-io/rrweb/commit/490b3e2b62b62d61e6f6f5391d5b879194c9a221) Thanks [@eoghanmurray](https://github.com/eoghanmurray)! - Guard against presence of older 3rd party javascript libraries which redefine Date.now()

- [#1220](https://github.com/rrweb-io/rrweb/pull/1220) [`a1ec9a2`](https://github.com/rrweb-io/rrweb/commit/a1ec9a273e6634eec67098fdd880ee681648fbbd) Thanks [@wfk007](https://github.com/wfk007)! - perf: optimize performance of the DoubleLinkedList get

- [#1196](https://github.com/rrweb-io/rrweb/pull/1196) [`490b3e2`](https://github.com/rrweb-io/rrweb/commit/490b3e2b62b62d61e6f6f5391d5b879194c9a221) Thanks [@eoghanmurray](https://github.com/eoghanmurray)! - Guard against redefinition of Date.now by third party libraries which are also present on a page alongside rrweb

- [#1183](https://github.com/rrweb-io/rrweb/pull/1183) [`d7c72bf`](https://github.com/rrweb-io/rrweb/commit/d7c72bff0724b46a6fa94af455220626a27104fe) Thanks [@mydea](https://github.com/mydea)! - fix: Ensure attributes are lowercased when checking

- [#1214](https://github.com/rrweb-io/rrweb/pull/1214) [`ebcbe8b`](https://github.com/rrweb-io/rrweb/commit/ebcbe8b0d746a0a4c07d3530387f920900f35215) Thanks [@wfk007](https://github.com/wfk007)! - perf: optimize the performance of record in processMutation phase

- Updated dependencies [[`b798f2d`](https://github.com/rrweb-io/rrweb/commit/b798f2dbc07b5a24dcaf40d164159200b6c0679d), [`d7c72bf`](https://github.com/rrweb-io/rrweb/commit/d7c72bff0724b46a6fa94af455220626a27104fe)]:
  - rrdom@2.0.0-alpha.9
  - rrweb-snapshot@2.0.0-alpha.9
  - @rrweb/types@2.0.0-alpha.9

## 2.0.0-alpha.8

### Minor Changes

- [#1129](https://github.com/rrweb-io/rrweb/pull/1129) [`979d2b1`](https://github.com/rrweb-io/rrweb/commit/979d2b1847a3d05e2731722952e4d6bd8be54f40) Thanks [@eoghanmurray](https://github.com/eoghanmurray)! - click events now include a `.pointerType` attribute which distinguishes between ['pen', 'mouse' and 'touch' events](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pointerType). There is no new PenDown/PenUp events, but these can be detected with a MouseDown/MouseUp + pointerType=pen

- [#1188](https://github.com/rrweb-io/rrweb/pull/1188) [`bc84246`](https://github.com/rrweb-io/rrweb/commit/bc84246f78849a80dbb8fe9b4e76117afcc5c3f7) Thanks [@benjackwhite](https://github.com/benjackwhite)! - feat: Extends maskInputFn to pass the HTMLElement to the deciding function

### Patch Changes

- [#1198](https://github.com/rrweb-io/rrweb/pull/1198) [`b5e30cf`](https://github.com/rrweb-io/rrweb/commit/b5e30cf6cc7f5335d674ef1917a92bdf2895fe9e) Thanks [@charliegracie](https://github.com/charliegracie)! - Reset the finished flag in Controller `goto` instead of `handleProgressClick` so that it is properly handled if `goto` is called directly.

- [#1184](https://github.com/rrweb-io/rrweb/pull/1184) [`aa79db7`](https://github.com/rrweb-io/rrweb/commit/aa79db7568578ea3a413292450cd64f07481e5dd) Thanks [@mydea](https://github.com/mydea)! - fix: Ensure getting the type of inputs works

- Updated dependencies [[`979d2b1`](https://github.com/rrweb-io/rrweb/commit/979d2b1847a3d05e2731722952e4d6bd8be54f40), [`bc84246`](https://github.com/rrweb-io/rrweb/commit/bc84246f78849a80dbb8fe9b4e76117afcc5c3f7), [`d0fdc0f`](https://github.com/rrweb-io/rrweb/commit/d0fdc0f273bb156a1faab4782b40fbec8dccf915)]:
  - @rrweb/types@2.0.0-alpha.8
  - rrweb-snapshot@2.0.0-alpha.8
  - rrdom@2.0.0-alpha.8

## 2.0.0-alpha.7

### Minor Changes

- [#1170](https://github.com/rrweb-io/rrweb/pull/1170) [`d2582e9`](https://github.com/rrweb-io/rrweb/commit/d2582e9a81197130cd93bc1dd778e16fddfb0be3) Thanks [@mydea](https://github.com/mydea)! - feat: Ensure password inputs remain masked when switching input type

- [#1107](https://github.com/rrweb-io/rrweb/pull/1107) [`a225d8e`](https://github.com/rrweb-io/rrweb/commit/a225d8e1412a69a761c22eb45565fff0b0ce5c11) Thanks [@mydea](https://github.com/mydea)! - feat: Allow to pass `errorHandler` as record option

### Patch Changes

- [#1179](https://github.com/rrweb-io/rrweb/pull/1179) [`e0f862b`](https://github.com/rrweb-io/rrweb/commit/e0f862bac7dbaa9cfd778f5ef0f5f3fd8cbe6def) Thanks [@wfk007](https://github.com/wfk007)! - Fix: [#1178](https://github.com/rrweb-io/rrweb/issues/1178) remove warning related to worker_threads while building

- [#1186](https://github.com/rrweb-io/rrweb/pull/1186) [`267e990`](https://github.com/rrweb-io/rrweb/commit/267e990dc0e45a5acaaa3ee89db7ae9171520d54) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Fix: processed-node-manager is created even in the environment that doesn't need a recorder

- [#1145](https://github.com/rrweb-io/rrweb/pull/1145) [`a82a3b4`](https://github.com/rrweb-io/rrweb/commit/a82a3b42b125aaaea607410b49f012933466c523) Thanks [@eoghanmurray](https://github.com/eoghanmurray)! - For a mutation which removes a node, reduce the number of spurious warnings to take into account that an anscestor (rather than just a parent) may have been just removed

- [#1191](https://github.com/rrweb-io/rrweb/pull/1191) [`1e6f71b`](https://github.com/rrweb-io/rrweb/commit/1e6f71b3cddcfafe78b9e40edfbd75e485702e4e) Thanks [@Juice10](https://github.com/Juice10)! - Only apply touch-active styling on flush

- [#1191](https://github.com/rrweb-io/rrweb/pull/1191) [`1e6f71b`](https://github.com/rrweb-io/rrweb/commit/1e6f71b3cddcfafe78b9e40edfbd75e485702e4e) Thanks [@Juice10](https://github.com/Juice10)! - Trigger mouse movement and hover with mouse up and mouse down events when replayer.pause(...) is called.

- [#1163](https://github.com/rrweb-io/rrweb/pull/1163) [`4cb4d0e`](https://github.com/rrweb-io/rrweb/commit/4cb4d0e95a540a366bdec157fe78d9f099514818) Thanks [@zhaobosky](https://github.com/zhaobosky)! - Fix: some websites rebuild imcomplete

  1. Some websites, addedSet in emit function is not empty, but the result converted from Array.from is empty.
  2. Some websites polyfill classList functions of HTML elements. Their implementation may throw errors and cause the snapshot to fail. I add try-catch statements to make the code robust.

- Updated dependencies [[`d2582e9`](https://github.com/rrweb-io/rrweb/commit/d2582e9a81197130cd93bc1dd778e16fddfb0be3), [`e7f0c80`](https://github.com/rrweb-io/rrweb/commit/e7f0c808c3f348fb27d1acd5fa300a5d92b14d00)]:
  - rrweb-snapshot@2.0.0-alpha.7
  - rrdom@2.0.0-alpha.7
  - @rrweb/types@2.0.0-alpha.7

## 2.0.0-alpha.6

### Patch Changes

- [#1156](https://github.com/rrweb-io/rrweb/pull/1156) [`e65465e`](https://github.com/rrweb-io/rrweb/commit/e65465e808178a80a4ba84970f02162ba812955e) Thanks [@Code-Crash](https://github.com/Code-Crash)! - Fix the statement which is getting changed by Microbundle

- [#1139](https://github.com/rrweb-io/rrweb/pull/1139) [`f27e545`](https://github.com/rrweb-io/rrweb/commit/f27e545e1871ed2c1753d37543f556e8ddc406b4) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Fix: Switch from virtual dom to real dom before rebuilding fullsnapshot

- [#1130](https://github.com/rrweb-io/rrweb/pull/1130) [`f6f07e9`](https://github.com/rrweb-io/rrweb/commit/f6f07e953376634a4caf28ff8cbfed5a017c4347) Thanks [@Equlnox](https://github.com/Equlnox)! - Fix: Make relative path detection in stylesheet URLs to detect more types of URL protocols when inlining stylesheets.

- [#1141](https://github.com/rrweb-io/rrweb/pull/1141) [`3416c3a`](https://github.com/rrweb-io/rrweb/commit/3416c3a769e2bd2ddfbb88f5c4ff139871c567be) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Fix: isCheckout is missed in all fullsnapshot events

- [#1157](https://github.com/rrweb-io/rrweb/pull/1157) [`8e47ca1`](https://github.com/rrweb-io/rrweb/commit/8e47ca1021ebb4fc036b37623ef10abf7976d6dd) Thanks [@mydea](https://github.com/mydea)! - fix: Explicitly handle `null` attribute values

- [#1136](https://github.com/rrweb-io/rrweb/pull/1136) [`aaabdbd`](https://github.com/rrweb-io/rrweb/commit/aaabdbdff5df2abd1a294c40ed89e74bf8b2ec7c) Thanks [@benjackwhite](https://github.com/benjackwhite)! - fix: Recursive logging bug with console recording

- [#1159](https://github.com/rrweb-io/rrweb/pull/1159) [`5e6c132`](https://github.com/rrweb-io/rrweb/commit/5e6c132a4d0e5f5524b2201d6a73dae62b4a0877) Thanks [@eoghanmurray](https://github.com/eoghanmurray)! - For users of userTriggeredOnInput setting: also set userTriggered to false on Input attribute modifications; this was previously empty this variant of IncrementalSource.Input

- Updated dependencies [[`c28ef5f`](https://github.com/rrweb-io/rrweb/commit/c28ef5f658abb93086504581409cf7a376db48dc), [`f6f07e9`](https://github.com/rrweb-io/rrweb/commit/f6f07e953376634a4caf28ff8cbfed5a017c4347), [`eac9b18`](https://github.com/rrweb-io/rrweb/commit/eac9b18bbfa3c350797b99b583dd93a5fc32b828), [`f27e545`](https://github.com/rrweb-io/rrweb/commit/f27e545e1871ed2c1753d37543f556e8ddc406b4), [`8e47ca1`](https://github.com/rrweb-io/rrweb/commit/8e47ca1021ebb4fc036b37623ef10abf7976d6dd)]:
  - rrweb-snapshot@2.0.0-alpha.6
  - rrdom@2.0.0-alpha.6
  - @rrweb/types@2.0.0-alpha.6

## 2.0.0-alpha.5

### Patch Changes

- [#1095](https://github.com/rrweb-io/rrweb/pull/1095) [`1385f7a`](https://github.com/rrweb-io/rrweb/commit/1385f7acc0052f83be1458a7b00e18c026ee393f) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Fix duplicated shadow doms

- [#1126](https://github.com/rrweb-io/rrweb/pull/1126) [`227d43a`](https://github.com/rrweb-io/rrweb/commit/227d43abb93d57cadc70c760b28c46911bf7d8ff) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Refactor all suffix of bundled scripts with commonjs module from 'js' to cjs [#1087](https://github.com/rrweb-io/rrweb/pull/1087).

- [#1126](https://github.com/rrweb-io/rrweb/pull/1126) [`227d43a`](https://github.com/rrweb-io/rrweb/commit/227d43abb93d57cadc70c760b28c46911bf7d8ff) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Fix: improve rrdom robustness [#1091](https://github.com/rrweb-io/rrweb/pull/1091).

- [#1127](https://github.com/rrweb-io/rrweb/pull/1127) [`3cc4323`](https://github.com/rrweb-io/rrweb/commit/3cc4323094065a12f8b65afecd45061d604e245f) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Refactor: Improve performance by 80% in a super large benchmark case.

  1. Refactor: change the data structure of childNodes from array to linked list
  2. Improve the performance of the "contains" function. New algorithm will reduce the complexity from O(n) to O(logn)

- [#1121](https://github.com/rrweb-io/rrweb/pull/1121) [`502d15d`](https://github.com/rrweb-io/rrweb/commit/502d15df9f7f43b3408ccfbb3f14c4bb007883c4) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Fix: outdated ':hover' styles can't be removed from iframes or shadow doms

- [#1122](https://github.com/rrweb-io/rrweb/pull/1122) [`8d209a6`](https://github.com/rrweb-io/rrweb/commit/8d209a62f31c4c80e3e5bc36e47d7282ee854ac7) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Add missing change logs manually. In the next version, all change logs will be generated automatically.

  - [`a220835`](https://github.com/rrweb-io/rrweb/commit/a220835eeb81ca4f294682e060d46c8853720d7f) [#1053](https://github.com/rrweb-io/rrweb/pull/1053) Thanks [@Juice10](https://github.com/Juice10)! - Fix: Post message can break cross origin iframe recording.

  - [`7e8dcdb`](https://github.com/rrweb-io/rrweb/commit/7e8dcdb11dc5dfefcdd19ff5e13ec9d8b5c24dcc) [#1063](https://github.com/rrweb-io/rrweb/pull/1063) Thanks [@lele0108](https://github.com/lele0108)! - Fix: muted false -> true not being set.

  - [`b655361`](https://github.com/rrweb-io/rrweb/commit/b655361a5f0d50a053fcd0e5c823b8494c33b89c) [#1067](https://github.com/rrweb-io/rrweb/pull/1067) Thanks [@mydea](https://github.com/mydea)! - Export recordOptions type.

  - [`36b44e1`](https://github.com/rrweb-io/rrweb/commit/36b44e104b91fc74c3e69684111240cd23105340) [#1042](https://github.com/rrweb-io/rrweb/pull/1042) Thanks [@wfk007](https://github.com/wfk007)! - Fix: Failed to execute insertBefore on Node.

  - [`44e92cb`](https://github.com/rrweb-io/rrweb/commit/44e92cbff981c36e754dfcb9a184eae9e7292ecf) [#1058](https://github.com/rrweb-io/rrweb/pull/1058) Thanks [@mydea](https://github.com/mydea)! - Handle errors when observing iframes.

  - [`729b8bf`](https://github.com/rrweb-io/rrweb/commit/729b8bf38c8c7f2e1b22b4e0f7cab14f0807bc74) [#1083](https://github.com/rrweb-io/rrweb/pull/1083) Thanks [@Juice10](https://github.com/Juice10)! - Fix: Catch iframe manager & fix formatting issues.

  - [`03821d9`](https://github.com/rrweb-io/rrweb/commit/03821d9b9fa0513e6e373881d43102ceb9388340) [#1083](https://github.com/rrweb-io/rrweb/pull/1083) Thanks [@eoghanmurray](https://github.com/eoghanmurray)! - Harmonize on a single getWindowScroll

  - [`d08913d`](https://github.com/rrweb-io/rrweb/commit/d08913d0dc506dbf119e94686fe5f01c415316c9) [#1086](https://github.com/rrweb-io/rrweb/pull/1086) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Fix: missed adopted style sheets of shadow doms in checkout full snapshot.

  - [`66abe17`](https://github.com/rrweb-io/rrweb/commit/66abe17832dbb23b3948af1c394f9a02caccc17b) [#1032](https://github.com/rrweb-io/rrweb/pull/1032) Thanks [@dbseel](https://github.com/dbseel)! - Fix: isBlocked throws on invalid HTML element.

  - [`07aa1b2`](https://github.com/rrweb-io/rrweb/commit/07aa1b2807da5a9a1db678ebc3ff59320a300d06) [#1049](https://github.com/rrweb-io/rrweb/pull/1049) Thanks [@Juice10](https://github.com/Juice10)! - Fix: shadow dom bugs.

  - [`57a2e14`](https://github.com/rrweb-io/rrweb/commit/57a2e140ea419f7790b1672529f21dfe2261b52b) [#1088](https://github.com/rrweb-io/rrweb/pull/1088) Thanks [@mydea](https://github.com/mydea)! - Fix: Guard against missing window.CSSStyleSheet.

  - [`fc82869`](https://github.com/rrweb-io/rrweb/commit/fc828694099b87b4d811e6b651a7bb4c7499b896) [#1093](https://github.com/rrweb-io/rrweb/pull/1093) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Fix: cross origin iframe bugs.

  - [`a77e302`](https://github.com/rrweb-io/rrweb/commit/a77e30217893e63f8025c73afc3ac1ba294d7761) [#1104](https://github.com/rrweb-io/rrweb/pull/1104) Thanks [@jlalmes](https://github.com/jlalmes)! - [console-plugin] Feat: Record unhandled rejection event.

  - [`25a4f5a`](https://github.com/rrweb-io/rrweb/commit/25a4f5ab6c7311f2e8e5e1a4d232c2820adf910e) [#1115](https://github.com/rrweb-io/rrweb/pull/1115) Thanks [@Juice10](https://github.com/Juice10)! - Fix: Don't trigger Finish event when in liveMode.

  - [`cb15800`](https://github.com/rrweb-io/rrweb/commit/cb1580008d04b0bc5c5d4ebec0e2e79899faaeb6) [#1106](https://github.com/rrweb-io/rrweb/pull/1106) Thanks [@mydea](https://github.com/mydea)! - Fix: Ensure CSS support is checked more robustly.

  - [`0732618`](https://github.com/rrweb-io/rrweb/commit/07326182f9750646771918481f116b946a17c2a9) [#1100](https://github.com/rrweb-io/rrweb/pull/1100) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Fix: wrong rootId value in special iframes.

  - [`3caa25e`](https://github.com/rrweb-io/rrweb/commit/3caa25ed9b19954c98775f22d5fa47233fa3d1db) [#1098](https://github.com/rrweb-io/rrweb/pull/1098) Thanks [@eoghanmurray](https://github.com/eoghanmurray)! - Refactor: Don't have requestAnimationFrame looping in background for Live Mode.

  - [`3a26e36`](https://github.com/rrweb-io/rrweb/commit/3a26e36f6f625c0391c7e6d3f1050660adfccc4f) [#1092](https://github.com/rrweb-io/rrweb/pull/1092) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Fix: regression of issue: ShadowHost can't be a string (issue 941)

  - [`07d22e7`](https://github.com/rrweb-io/rrweb/commit/07d22e7cd999a48e7371aaef1b979574bb746500) [#1111](https://github.com/rrweb-io/rrweb/pull/1111) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Feat: enable to customize logger in the replayer.

  - [`0627d4d`](https://github.com/rrweb-io/rrweb/commit/0627d4df7cc76cde7babbd37ab8e3da5810fb51d) [#1109](https://github.com/rrweb-io/rrweb/pull/1109) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Feat: add option to record on DOMContentLoaded event.

  - [`174b9ac`](https://github.com/rrweb-io/rrweb/commit/174b9ac066565b8c065f40f0303189f10c7c4efb) [#1112](https://github.com/rrweb-io/rrweb/pull/1112) Thanks [@YunFeng0817](https://github.com/YunFeng0817)! - Fix: mutation Failed to execute 'insertBefore' on 'Node': Only one doctype on document allowed.

  - [`5a1e5e9`](https://github.com/rrweb-io/rrweb/commit/5a1e5e919e3f8bef48d142115c0afd5706a442b5) [#1119](https://github.com/rrweb-io/rrweb/pull/1119) Thanks [@Juice10](https://github.com/Juice10)! - Feat: Automate NPM package releases.

- Updated dependencies [[`1385f7a`](https://github.com/rrweb-io/rrweb/commit/1385f7acc0052f83be1458a7b00e18c026ee393f), [`227d43a`](https://github.com/rrweb-io/rrweb/commit/227d43abb93d57cadc70c760b28c46911bf7d8ff), [`227d43a`](https://github.com/rrweb-io/rrweb/commit/227d43abb93d57cadc70c760b28c46911bf7d8ff), [`3cc4323`](https://github.com/rrweb-io/rrweb/commit/3cc4323094065a12f8b65afecd45061d604e245f)]:
  - rrweb-snapshot@2.0.0-alpha.5
  - rrdom@2.0.0-alpha.5
  - @rrweb/types@2.0.0-alpha.5
