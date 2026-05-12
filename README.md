<p align="center">
  <img width="100px" height="100px" src="https://www.rrweb.io/favicon.png">
</p>
<p align="center">
  <a href="https://www.rrweb.io/" style="font-weight: bold">Try rrweb</a>
</p>

# rrweb

**[The rrweb documentary (in Chinese, with English subtitles)](https://www.bilibili.com/video/BV1wL4y1B7wN?share_source=copy_web)**

[![Join the chat at slack](https://img.shields.io/badge/slack-@rrweb-teal.svg?logo=slack)](https://join.slack.com/t/rrweb/shared_invite/zt-siwoc6hx-uWay3s2wyG8t5GpZVb8rWg)
[![Twitter Follow](https://img.shields.io/badge/twitter-@rrweb__io-teal.svg?logo=twitter)](https://twitter.com/rrweb_io)
![total gzip size](https://img.badgesize.io/https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.cjs?compression=gzip&label=total%20gzip%20size)
![recorder gzip size](https://img.badgesize.io/https://cdn.jsdelivr.net/npm/rrweb@latest/dist/record/rrweb-record.min.cjs?compression=gzip&label=recorder%20gzip%20size)
[![](https://data.jsdelivr.com/v1/package/npm/rrweb/badge)](https://www.jsdelivr.com/package/npm/rrweb)

[中文文档](./README.zh_CN.md)

> I have joined Github Sponsors and highly appreciate your sponsorship.

rrweb refers to 'record and replay the web', which is a tool for recording and replaying users' interactions on the web.

## Guide

[**📚 Read the rrweb guide here. 📚**](./guide.md)

[**🍳 Recipes 🍳**](./docs/recipes/index.md)

[**📺 Presentation:** Hacking the browser to digital twin your users 📺](https://youtu.be/cWxpp9HwLYw)

## Project Structure

rrweb is mainly composed of 3 parts:

- **[rrweb-snapshot](https://github.com/rrweb-io/rrweb/tree/master/packages/rrweb-snapshot/)**, including both snapshot and rebuilding features. The snapshot is used to convert the DOM and its state into a serializable data structure with a unique identifier; the rebuilding feature is to rebuild the snapshot into corresponding DOM.
- **[rrweb](https://github.com/rrweb-io/rrweb)**, including two functions, record and replay. The record function is used to record all the mutations in the DOM; the replay is to replay the recorded mutations one by one according to the corresponding timestamp.
- **[rrweb-player](https://github.com/rrweb-io/rrweb/tree/master/packages/rrweb-player/)**, is a player UI for rrweb, providing GUI-based functions like pause, fast-forward, drag and drop to play at any time.

## Roadmap

- storage engine: do deduplication on a large number of rrweb sessions
- compact mutation data in common patterns
- provide plugins via the new plugin API, including:
  - XHR plugin
  - fetch plugin
  - GraphQL plugin
  - ...

## Internal Design

- [serialization](./docs/serialization.md)
- [incremental snapshot](./docs/observer.md)
- [replay](./docs/replay.md)
- [sandbox](./docs/sandbox.md)

## Contribute Guide

Since we want the record and replay sides to share a strongly typed data structure, rrweb is developed with typescript which provides stronger type support.

[Typescript handbook](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)

1. Fork this repository.
2. Run `pnpm install` in the root to install required dependencies for all sub-packages. The repo pins pnpm via the `packageManager` field and [Corepack](https://nodejs.org/api/corepack.html), so you should not need to install pnpm globally.
3. Run `pnpm build:all` to build all packages and get a stable base, then `pnpm dev` in the root to get auto-building for all the sub-packages whenever you modify anything.
4. Navigate to one of the sub-packages (in the `packages` folder) where you'd like to make a change.
5. Patch the code and run `pnpm test` to run the tests, make sure they pass before you commit anything. Add test cases in order to avoid future regression.
6. If tests are failing, but the change in output is desirable, run `pnpm test:update` and carefully commit the changes in test output.
7. Push the code and create a pull request.

Protip: You can run `pnpm test` in the root folder to run all the tests.

In addition to adding integration tests and unit tests, rrweb also provides a REPL testing tool.

[Using the REPL tool](./guide.md#REPL-tool)
