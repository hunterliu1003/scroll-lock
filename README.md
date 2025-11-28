# @hunterliu/scroll-lock

<!-- automd:badges color=yellow -->

[![npm version](https://img.shields.io/npm/v/@hunterliu/scroll-lock?color=yellow)](https://npmjs.com/package/@hunterliu/scroll-lock)
[![npm downloads](https://img.shields.io/npm/dm/@hunterliu/scroll-lock?color=yellow)](https://npm.chart.dev/@hunterliu/scroll-lock)

<!-- /automd -->

A lightweight, SSR-safe scroll locking library with reference counting support. Perfect for modals, dialogs, and overlays that need to prevent background scrolling.

## Features

- 🔒 **Reference counting** - Multiple locks on the same element work properly
- 🌐 **SSR-safe** - Works seamlessly in server-side rendering environments  
- 🎯 **Multiple targets** - Lock body, documentElement, or any HTMLElement
- 🔧 **TypeScript** - Full type safety out of the box
- ⚡ **Lightweight** - Minimal bundle size with zero dependencies
- 🧹 **Clean restoration** - Properly restores original overflow styles

## Usage

Install the package:

```sh
# ✨ Auto-detect (supports npm, yarn, pnpm, deno and bun)
npx nypm install @hunterliu/scroll-lock
```

Import:

<!-- automd:jsimport cdn name="@hunterliu/scroll-lock" -->

**ESM** (Node.js, Bun, Deno)

```js
import { lockScroll, unlockScroll, isScrollLocked, clearAllScrollLocks } from "@hunterliu/scroll-lock";
```

**CDN** (Deno and Browsers)

```js
import { lockScroll, unlockScroll, isScrollLocked, clearAllScrollLocks } from "https://esm.sh/@hunterliu/scroll-lock";
```

<!-- /automd -->

## Basic Usage

```js
import { lockScroll, unlockScroll, isScrollLocked } from "@hunterliu/scroll-lock";

// Lock body scroll (default target)
lockScroll();

// Check if scroll is locked
console.log(isScrollLocked()); // true

// Unlock body scroll  
unlockScroll();

console.log(isScrollLocked()); // false
```

## Reference Counting

The library uses reference counting, so multiple `lockScroll()` calls require the same number of `unlockScroll()` calls:

```js
lockScroll(); // count: 1
lockScroll(); // count: 2

unlockScroll(); // count: 1 - still locked
unlockScroll(); // count: 0 - now unlocked
```

## Custom Targets

Lock scroll on specific elements:

```js
const modal = document.querySelector('.modal');

// Lock specific element
lockScroll({ target: modal });

// Lock document element
lockScroll({ target: 'documentElement' });

// Lock window/scrolling element  
lockScroll({ target: 'window' });

// Unlock with same target
unlockScroll({ target: modal });
```

## Force Unlock

Bypass reference counting with force unlock:

```js
lockScroll(); // count: 1
lockScroll(); // count: 2

// Force unlock ignores count
unlockScroll({ force: true }); // immediately unlocked
```

## Clear All Locks

Reset all scroll locks across all targets:

```js
// Lock multiple targets
lockScroll(); // body
lockScroll({ target: modal });

// Clear everything
clearAllScrollLocks(); // all targets unlocked
```

## API Reference

### `lockScroll(options?)`

Lock scroll on target element.

**Options:**
- `target?: ScrollLockTarget` - Element to lock (default: `"body"`)

**ScrollLockTarget:**
- `"body"` (default) - Document body
- `"documentElement"` or `"html"` - Document element
- `"window"` - Scrolling element
- `HTMLElement` - Any DOM element

### `unlockScroll(options?)`

Unlock scroll on target element.

**Options:**
- `target?: ScrollLockTarget` - Element to unlock (default: `"body"`)
- `force?: boolean` - Ignore reference counting (default: `false`)

### `isScrollLocked(target?)`

Check if target is currently locked.

**Parameters:**
- `target?: ScrollLockTarget` - Element to check (default: `"body"`)

**Returns:** `boolean`

### `clearAllScrollLocks()`

Clear all scroll locks on all targets.

## Development

<details>

<summary>local development</summary>

- Clone this repository
- Install latest LTS version of [Node.js](https://nodejs.org/en/)
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

</details>

## License

<!-- automd:contributors license=MIT -->

Published under the [MIT](https://github.com/hunterliu1003/scroll-lock/blob/main/LICENSE) license.
Made by [community](https://github.com/hunterliu1003/scroll-lock/graphs/contributors) 💛
<br><br>
<a href="https://github.com/hunterliu1003/scroll-lock/graphs/contributors">
<img src="https://contrib.rocks/image?repo=hunterliu1003/scroll-lock" />
</a>

<!-- /automd -->

<!-- automd:with-automd -->

---

_🤖 auto updated with [automd](https://automd.unjs.io)_

<!-- /automd -->
