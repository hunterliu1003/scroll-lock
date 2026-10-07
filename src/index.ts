const isClient = globalThis.window && typeof document !== "undefined";
const isIOS = getIsIOS();

function getIsIOS(): boolean {
  return (
    isClient &&
    !!globalThis.window?.navigator?.userAgent &&
    (/iP(?:ad|hone|od)/.test(globalThis.window.navigator.userAgent) ||
      // The new iPad Pro Gen3 does not identify itself as iPad, but as Macintosh.
      // https://github.com/vueuse/vueuse/issues/3577
      (globalThis.window?.navigator?.maxTouchPoints > 2 &&
        /iPad|Macintosh/.test(globalThis.window?.navigator.userAgent)))
  );
}

export type ScrollLockTarget =
  | HTMLElement
  | SVGElement
  | Window
  | Document
  | null
  | undefined;

export interface LockScrollOptions {
  /**
   * Add the width of the scrollbar that disappears to the target's `padding-right`,
   * so its content does not shift. Measured when the first lock is applied and restored with the last unlock.
   */
  reserveScrollBarGap?: boolean;
}

export interface LockState {
  count: number;
  originalOverflowX?: string;
  originalOverflowY?: string;
  originalPaddingRight?: string;
  stopTouchEventListener?: () => void;
}

export function createScrollLock() {
  const lockStateMap = new WeakMap<HTMLElement | SVGElement, LockState>();
  const lockedElementSet = new Set<HTMLElement | SVGElement>();

  function lockScroll(
    target: ScrollLockTarget,
    options?: LockScrollOptions,
  ): LockState | undefined {
    if (!isBrowser()) return;

    const el = resolveTarget(target);
    if (!el) return;

    return applyLock(el, options, {
      lockStateMap,
      lockedElementSet,
    });
  }

  function unlockScroll(
    target: ScrollLockTarget,
    options?: {
      force?: boolean;
    },
  ): LockState | undefined {
    if (!isBrowser()) return;

    const force = options?.force ?? false;

    const el = resolveTarget(target);
    if (!el) return;

    const state = lockStateMap.get(el);
    if (!state) return;

    if (force) {
      restoreElement(el, state, {
        lockedElementSet,
        lockStateMap,
      });
      return {
        count: 0,
      };
    }

    state.count -= 1;

    if (state.count <= 0) {
      restoreElement(el, state, {
        lockedElementSet,
        lockStateMap,
      });
    }
    return state;
  }

  function isScrollLocked(target: ScrollLockTarget): boolean {
    if (!isBrowser()) return false;

    const el = resolveTarget(target);
    if (!el) return false;

    const state = lockStateMap.get(el);
    return !!state && state.count > 0;
  }

  function clearAllScrollLocks(): void {
    if (!isBrowser()) return;

    // Use lockedElements (Set) to safely iterate through all previously locked elements
    for (const el of lockedElementSet) {
      const state = lockStateMap.get(el);
      if (state) {
        restoreElement(el, state, {
          lockedElementSet,
          lockStateMap,
        });
      }
    }

    lockedElementSet.clear();
  }

  return {
    lockStateMap,
    lockedElementSet,
    lockScroll,
    unlockScroll,
    isScrollLocked,
    clearAllScrollLocks,
  };
}

export const {
  lockStateMap,
  lockedElementSet,
  lockScroll,
  unlockScroll,
  isScrollLocked,
  clearAllScrollLocks,
} = createScrollLock();

function applyLock(
  el: HTMLElement | SVGElement,
  options: LockScrollOptions | undefined,
  ctx: {
    lockStateMap: WeakMap<HTMLElement | SVGElement, LockState>;
    lockedElementSet: Set<HTMLElement | SVGElement>;
  },
): LockState {
  let state = ctx.lockStateMap.get(el);

  if (!state) {
    state = {
      count: 0,
      originalOverflowX: el.style.overflowX,
      originalOverflowY: el.style.overflowY,
    };

    if (isIOS) {
      state.stopTouchEventListener = listenTouches(el);
    }
    ctx.lockStateMap.set(el, state);
    ctx.lockedElementSet.add(el);
  }

  if (state.count === 0) {
    // The gap must be measured while the scrollbar is still there.
    if (options?.reserveScrollBarGap) reserveScrollBarGap(el, state);
    // Longhands, because restoring the shorthand would also drop an overflow-x or overflow-y set on its own.
    el.style.overflowX = "hidden";
    el.style.overflowY = "hidden";
  }

  state.count += 1;

  return state;
}

function restoreElement(
  el: HTMLElement | SVGElement,
  state: LockState,
  ctx: {
    lockStateMap: WeakMap<HTMLElement | SVGElement, LockState>;
    lockedElementSet: Set<HTMLElement | SVGElement>;
  },
): void {
  if (isIOS) {
    state.stopTouchEventListener?.();
  }
  el.style.overflowX = state.originalOverflowX ?? "";
  el.style.overflowY = state.originalOverflowY ?? "";
  if (state.originalPaddingRight !== undefined) {
    if (state.originalPaddingRight) {
      el.style.paddingRight = state.originalPaddingRight;
    } else {
      el.style.removeProperty("padding-right");
    }
  }

  ctx.lockStateMap.delete(el);
  ctx.lockedElementSet.delete(el);
}

function reserveScrollBarGap(
  el: HTMLElement | SVGElement,
  state: LockState,
): void {
  const gap = scrollBarGap(el);
  if (gap <= 0) return;

  const paddingRight =
    Number.parseFloat(globalThis.window.getComputedStyle(el).paddingRight) || 0;
  state.originalPaddingRight = el.style.paddingRight;
  el.style.paddingRight = `${paddingRight + gap}px`;
}

function scrollBarGap(el: HTMLElement | SVGElement): number {
  if (el === document.body || el === document.documentElement) {
    return globalThis.window.innerWidth - document.documentElement.clientWidth;
  }
  if (!(el instanceof HTMLElement)) return 0;

  const style = globalThis.window.getComputedStyle(el);
  const borders =
    (Number.parseFloat(style.borderLeftWidth) || 0) +
    (Number.parseFloat(style.borderRightWidth) || 0);
  return el.offsetWidth - el.clientWidth - borders;
}

function resolveTarget(
  target: HTMLElement | SVGElement | Window | Document | null | undefined,
): HTMLElement | SVGElement | undefined {
  if (!target) return document.body;

  if (typeof Window !== "undefined" && target instanceof Window)
    return target.document.documentElement;

  if (typeof Document !== "undefined" && target instanceof Document)
    return target.documentElement;
  if (target instanceof HTMLElement || target instanceof SVGElement)
    return target;
  return undefined;
}

function isBrowser(): boolean {
  return globalThis.window !== undefined && typeof document !== "undefined";
}

/**
 * iOS ignores `overflow: hidden` on the page, so touch scrolling is cancelled instead,
 * except inside an element below the locked one that can still scroll the way the finger moves.
 */
function listenTouches(el: HTMLElement | SVGElement): () => void {
  let start = { x: 0, y: 0 };
  let last = start;

  const onTouchStart = (event: Event) => {
    const { touches } = event as TouchEvent;
    const [first] = touches;
    if (touches.length === 1 && first)
      start = last = { x: first.clientX, y: first.clientY };
  };

  const onTouchMove = (event: Event) => {
    const { touches, target } = event as TouchEvent;
    const [first] = touches;
    // More than one touch is usually a gesture such as pinch to zoom.
    if (!first || touches.length > 1) return;

    const point = { x: first.clientX, y: first.clientY };
    /** The whole gesture picks the axis, so a jittery step cannot flip it; the last step picks the direction, so a finger turning back is followed. */
    const horizontal =
      Math.abs(point.x - start.x) > Math.abs(point.y - start.y);
    const axis = horizontal ? "x" : "y";
    const delta = point[axis] - last[axis] || point[axis] - start[axis];
    last = point;
    if (canScroll(target as Element | null, horizontal, delta, el)) return;

    event.preventDefault();
  };

  el.addEventListener("touchstart", onTouchStart, { passive: true });
  el.addEventListener("touchmove", onTouchMove, { passive: false });

  return () => {
    el.removeEventListener("touchstart", onTouchStart);
    el.removeEventListener("touchmove", onTouchMove);
  };
}

/**
 * Whether an element between `target` and the locked `root` can still scroll along the
 * axis of the gesture, in the direction the finger moves (positive is down or right).
 */
function canScroll(
  target: Element | null,
  horizontal: boolean,
  delta: number,
  root: Element,
): boolean {
  for (let el = target; el && el !== root; el = el.parentElement) {
    if (horizontal ? canScrollX(el, delta) : canScrollY(el, delta)) return true;
  }
  return false;
}

/** Scroll offsets are fractional on high-density screens, so less than a pixel from an edge counts as at it. */
const EDGE = 1;

function canScrollY(el: Element, delta: number): boolean {
  if (
    !isScrollable(
      globalThis.window.getComputedStyle(el).overflowY,
      el.scrollHeight,
      el.clientHeight,
    )
  )
    return false;
  return delta > 0
    ? el.scrollTop >= EDGE
    : delta < 0 && el.scrollTop + el.clientHeight <= el.scrollHeight - EDGE;
}

function canScrollX(el: Element, delta: number): boolean {
  const style = globalThis.window.getComputedStyle(el);
  if (!isScrollable(style.overflowX, el.scrollWidth, el.clientWidth))
    return false;
  /** A right-to-left scroller's scrollLeft runs from 0 at its right edge to negative values toward its left edge. */
  const fromLeft =
    style.direction === "rtl"
      ? el.scrollLeft + el.scrollWidth - el.clientWidth
      : el.scrollLeft;
  return delta > 0
    ? fromLeft >= EDGE
    : delta < 0 && fromLeft + el.clientWidth <= el.scrollWidth - EDGE;
}

function isScrollable(
  overflow: string,
  scrollSize: number,
  clientSize: number,
): boolean {
  return (
    (overflow === "auto" || overflow === "scroll") && scrollSize > clientSize
  );
}
