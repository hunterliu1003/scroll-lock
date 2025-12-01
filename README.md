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
- 📱 **iOS support** - Special touch event handling for iOS devices
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

<!-- /automd -->

## Basic Usage

```js
import {
  lockScroll,
  unlockScroll,
  isScrollLocked,
} from "@hunterliu/scroll-lock";

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
const modal = document.querySelector(".modal");

// Lock specific element
lockScroll({ target: modal });

// Check if scroll is locked
console.log(isScrollLocked(modal)); // true

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

- `target?: ScrollLockTarget` - Element to lock (default: `document.body`)

**ScrollLockTarget:**

- `HTMLElement | SVGElement` - Any DOM element
- `null | undefined` - Defaults to document.body

### `unlockScroll(options?)`

Unlock scroll on target element.

**Options:**

- `target?: ScrollLockTarget` - Element to unlock (default: `document.body`)
- `force?: boolean` - Ignore reference counting (default: `false`)

### `isScrollLocked(target?)`

Check if target is currently locked.

**Parameters:**

- `target?: ScrollLockTarget` - Element to check (default: `document.body`)

**Returns:** `boolean`

### `clearAllScrollLocks()`

Clear all scroll locks on all targets.

