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

type ScrollLockTarget =
  | HTMLElement
  | SVGElement
  | Window
  | Document
  | null
  | undefined;

interface LockState {
  count: number;
  originalOverflow: string;
  stopTouchEventListener?: () => void;
}

const lockStates = new WeakMap<HTMLElement | SVGElement, LockState>();
const lockedElements = new Set<HTMLElement | SVGElement>();

export function lockScroll(options?: { target?: ScrollLockTarget }): void {
  if (!isBrowser()) return;

  const el = resolveTarget(options?.target);
  if (!el) return;

  applyLock(el);
}

export function unlockScroll(options?: {
  target?: ScrollLockTarget;
  force?: boolean;
}): void {
  if (!isBrowser()) return;

  const target = options?.target;
  const force = options?.force ?? false;

  const el = resolveTarget(target);
  if (!el) return;

  const state = lockStates.get(el);
  if (!state) return;

  if (force) {
    restoreElement(el, state);
    return;
  }

  state.count -= 1;

  if (state.count <= 0) {
    restoreElement(el, state);
  }
}

export function isScrollLocked(target?: ScrollLockTarget): boolean {
  if (!isBrowser()) return false;

  const el = resolveTarget(target);
  if (!el) return false;

  const state = lockStates.get(el);
  return !!state && state.count > 0;
}

export function clearAllScrollLocks(): void {
  if (!isBrowser()) return;

  // Use lockedElements (Set) to safely iterate through all previously locked elements
  for (const el of lockedElements) {
    const state = lockStates.get(el);
    if (state) {
      restoreElement(el, state);
    }
  }

  lockedElements.clear();
}


function applyLock(el: HTMLElement | SVGElement): void {
  let state = lockStates.get(el);

  if (!state) {
    state = {
      count: 0,
      originalOverflow: el.style.overflow,
    };

    if (isIOS) {
      el.addEventListener('touchmove', touchEventListener, { passive: false });
      state.stopTouchEventListener = () => el.removeEventListener('touchmove', touchEventListener);
    }
    lockStates.set(el, state);
    lockedElements.add(el);
  }

  if (state.count === 0) {
    el.style.overflow = "hidden";
  }

  state.count += 1;
}

function restoreElement(el: HTMLElement | SVGElement, state: LockState): void {
  if (isIOS) {
    state.stopTouchEventListener?.();
  }
  if (state.originalOverflow) {
    el.style.overflow = state.originalOverflow;
  } else {
    el.style.removeProperty("overflow");
  }

  lockStates.delete(el);
  lockedElements.delete(el);
}

function resolveTarget(
  target?: HTMLElement | SVGElement | Window | Document | null | undefined,
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


function touchEventListener(e: Event) {
  preventDefault(e as TouchEvent)
}

function preventDefault(rawEvent: TouchEvent): boolean {
  const e = rawEvent || window.event

  const _target = e.target as Element

  // Do not prevent if element or parentNodes have overflow: scroll set.
  if (checkOverflowScroll(_target))
    return false

  // Do not prevent if the event has more than one touch (usually meaning this is a multi touch gesture like pinch to zoom).
  if (e.touches.length > 1)
    return true

  if (e.preventDefault)
    e.preventDefault()

  return false
}

function checkOverflowScroll(ele: Element): boolean {
  const style = globalThis.window.getComputedStyle(ele)
  if (
    style.overflowX === 'scroll'
    || style.overflowY === 'scroll'
    || (style.overflowX === 'auto' && ele.clientWidth < ele.scrollWidth)
    || (style.overflowY === 'auto' && ele.clientHeight < ele.scrollHeight)
  ) {
    return true
  }
  else {
    const parent = ele.parentNode as Element

    if (!parent || parent.tagName === 'BODY')
      return false

    return checkOverflowScroll(parent)
  }
}