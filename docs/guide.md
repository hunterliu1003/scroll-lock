<script setup>
import ScrollLockTargetQueue from './components/ScrollLockTargetQueue.vue';
import ScrollLockBody from './components/ScrollLockBody.vue';
import ScrollLockClearAll from './components/ScrollLockClearAll.vue';
</script>

# Guide

Complete guide to using `@hunterliu/scroll-lock` for preventing unwanted scrolling in web applications.

## Installation

```sh
npm install @hunterliu/scroll-lock
```

## Quick Start

The simplest way to lock and unlock scrolling:

```ts
import {
  lockScroll,
  unlockScroll,
  isScrollLocked,
} from "@hunterliu/scroll-lock";

lockScroll(document.body);

console.log(isScrollLocked(document.body)); // true

unlockScroll(document.body);
```

## Basic Examples

### Locking Body Scroll

:::tabs
== Example
<ScrollLockBody />
== Code

```ts
import {
  lockScroll,
  unlockScroll,
  isScrollLocked,
} from "@hunterliu/scroll-lock";

lockScroll(document.body);

const isLocked = isScrollLocked(document.body);

unlockScroll(document.body);
```

:::

### Locking Custom Element Scroll

:::tabs
== Example
<ScrollLockTargetQueue />
== Code

```ts
import {
  lockScroll,
  unlockScroll,
  isScrollLocked,
} from "@hunterliu/scroll-lock";

const element = document.querySelector(".scrollable-element");

lockScroll(element);

unlockScroll(element);

unlockScroll(element, { force: true });
```

:::

### Keeping the Layout Still

When the scrollbar disappears, the page content shifts by its width. Pass `reserveScrollBarGap` to add that width to the target's `padding-right` while it is locked:

```ts
import { lockScroll, unlockScroll } from "@hunterliu/scroll-lock";

lockScroll(document.body, { reserveScrollBarGap: true });

unlockScroll(document.body);
```

### iOS

iOS ignores `overflow: hidden` on the page, so on iOS a lock cancels `touchmove` on the locked element instead. An element below it that can still scroll in the direction of the finger, vertically or horizontally, keeps scrolling, so a list or carousel inside a modal works as usual while the page behind it stays put. Multi-touch gestures are never cancelled.

### Clear All Locks

:::tabs
== Example
<ScrollLockClearAll />
== Code

```ts
import { clearAllScrollLocks } from "@hunterliu/scroll-lock";

// Immediately unlock all targets
clearAllScrollLocks();
```

:::

### Isolated Instances

The functions exported from the package share one lock registry. `createScrollLock()` returns the same functions bound to a registry of their own, so a library or widget can count and clear its locks without touching the ones the app made:

```ts
import { createScrollLock, lockScroll } from "@hunterliu/scroll-lock";

const drawerLocks = createScrollLock();
const drawer = document.querySelector<HTMLElement>(".drawer");

lockScroll(document.body);
drawerLocks.lockScroll(drawer);

// Unlocks the drawer, body stays locked
drawerLocks.clearAllScrollLocks();
```

Instances do not know about each other, so lock a given element through one instance only.

For complete API documentation, see the [API Reference](/api).
