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

## Installation

```sh
# ✨ Auto-detect (supports npm, yarn, pnpm, deno and bun)
npx nypm install @hunterliu/scroll-lock
```

## Basic Usage

```ts
import {
  lockScroll,
  unlockScroll,
  isScrollLocked,
} from "@hunterliu/scroll-lock";

// Lock body scroll (default target)
lockScroll(document.body);

// Check if scroll is locked
console.log(isScrollLocked(document.body)); // true

// Unlock body scroll
unlockScroll(document.body);

console.log(isScrollLocked(document.body)); // false
```

## Reference Counting

The library uses reference counting, so multiple `lockScroll()` calls require the same number of `unlockScroll()` calls:

```ts
lockScroll(document.body); // count: 1
lockScroll(document.body); // count: 2

unlockScroll(document.body); // count: 1 - still locked
unlockScroll(document.body); // count: 0 - now unlocked
```

## Custom Targets

Lock scroll on specific elements:

```ts
const modal = document.querySelector(".modal");

// Lock specific element
lockScroll(modal);

// Check if scroll is locked
console.log(isScrollLocked(modal)); // true

// Unlock with same target
unlockScroll(modal);
```

## Force Unlock

Bypass reference counting with force unlock:

```ts
lockScroll(document.body); // count: 1
lockScroll(document.body); // count: 2

// Force unlock ignores count
unlockScroll(document.body, { force: true }); // immediately unlocked
```

## Clear All Locks

Reset all scroll locks across all targets:

```ts
import { clearAllScrollLocks } from "@hunterliu/scroll-lock";

// Lock multiple targets
lockScroll(document.body);
lockScroll(document.querySelector(".modal"));
lockScroll(document.querySelector(".sidebar"));

// Clear everything
clearAllScrollLocks(); // all targets unlocked
```

## API Reference

### `lockScroll(target)`

Lock scroll on target element.

```typescript
function lockScroll(target: ScrollLockTarget): LockState | undefined;
```

**Parameters:**

- `target: ScrollLockTarget` - Element to lock (defaults to `document.body` if `null`/`undefined`)

**Returns:**

- `LockState | undefined` - The lock state object, or `undefined` if not in browser environment

### `unlockScroll(target, options?)`

Unlock scroll on target element.

```typescript
function unlockScroll(
  target: ScrollLockTarget,
  options?: {
    force?: boolean;
  },
): LockState | undefined;
```

**Parameters:**

- `target: ScrollLockTarget` - Element to unlock (defaults to `document.body` if `null`/`undefined`)
- `options?` - Optional configuration object
  - `force?: boolean` - Bypass reference counting (default: `false`)

**Returns:**

- `LockState | undefined` - The lock state object, or `undefined` if not in browser environment

### `isScrollLocked(target)`

Check if target is currently locked.

```typescript
function isScrollLocked(target: ScrollLockTarget): boolean;
```

**Parameters:**

- `target: ScrollLockTarget` - Element to check (defaults to `document.body` if `null`/`undefined`)

**Returns:**

- `boolean` - `true` if the element is locked, `false` otherwise

### `clearAllScrollLocks()`

Clear all scroll locks on all targets.

```typescript
function clearAllScrollLocks(): void;
```

### Types

#### `ScrollLockTarget`

```typescript
type ScrollLockTarget =
  | HTMLElement
  | SVGElement
  | Window
  | Document
  | null
  | undefined;
```

**Target Resolution:**

- `HTMLElement | SVGElement` - Used directly as the lock target
- `Window` - Targets `window.document.documentElement`
- `Document` - Targets `document.documentElement`
- `null | undefined` - Defaults to `document.body`

#### `LockState`

```typescript
interface LockState {
  count: number;
  originalOverflow?: string;
  stopTouchEventListener?: () => void;
}
```

### Exported Constants

Advanced usage - access internal state:

```ts
import { lockStateMap, lockedElementSet } from "@hunterliu/scroll-lock";

// WeakMap storing lock state for each element
const state = lockStateMap.get(document.body);

// Set of all currently locked elements
const isLocked = lockedElementSet.has(document.body);
```
