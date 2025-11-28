// src/scroll-lock.ts

// ====== Public Types ===============================================

export type ScrollLockTarget =
  | HTMLElement
  | SVGElement
  | Window
  | Document
  | null
  | undefined;

export interface ScrollLockOptions {
  /**
   * 要鎖定哪個滾動目標，預設為 "body"
   */
  target?: ScrollLockTarget;
}

export interface ScrollUnlockOptions {
  /**
   * 要解除哪個滾動目標，預設為 "body"
   */
  target?: ScrollLockTarget;

  /**
   * 是否強制立刻解除這個 target 的所有鎖定（忽略計數）
   * 預設為 false
   */
  force?: boolean;
}

// ====== Internal State & Helpers ===================================

interface LockState {
  count: number;
  originalOverflow: string;
  originalOverflowX: string;
  originalOverflowY: string;
}

/**
 * 以 HTMLElement 為 key 的 WeakMap，用來儲存每個 element 的 lock 狀態
 */
const lockStates = new WeakMap<HTMLElement | SVGElement, LockState>();

/**
 * 因為 WeakMap 無法被直接遍歷，所以額外用一個 Set 記住目前被 lock 過的 elements，
 * 讓 clearAllScrollLocks() 可以遍歷並還原。
 */
const lockedElements = new Set<HTMLElement | SVGElement>();

/**
 * 判斷是否在瀏覽器環境。
 */
function isBrowser(): boolean {
  return globalThis.window !== undefined && typeof document !== "undefined";
}

/**
 * 把 ScrollLockTarget 轉成實際的 HTMLElement
 * - 非瀏覽器環境會回傳 null
 */
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

/**
 * 對指定 element 套用「鎖定滾動」的 style。
 * - 僅在瀏覽器環境下會被呼叫（呼叫前需先經過 resolveTarget）
 */
function applyLock(el: HTMLElement | SVGElement): void {
  let state = lockStates.get(el);

  if (!state) {
    state = {
      count: 0,
      originalOverflow: el.style.overflow,
      originalOverflowX: el.style.overflowX,
      originalOverflowY: el.style.overflowY,
    };
    lockStates.set(el, state);
    lockedElements.add(el);
  }

  // 第一個 lock 才真正動 style
  if (state.count === 0) {
    // 目前版本鎖的是整個元素的滾動（包含 x / y）
    // 後續如果要支援 axis，可以再細分 overflowX / overflowY。
    el.style.overflow = "hidden";
  }

  state.count += 1;
}

/**
 * 還原指定 element 的 style 並移除 state。
 * - 僅在瀏覽器環境下會被呼叫
 */
function restoreElement(el: HTMLElement | SVGElement, state: LockState): void {
  // 還原 overflow
  if (state.originalOverflow) {
    el.style.overflow = state.originalOverflow;
  } else {
    el.style.removeProperty("overflow");
  }

  // 還原 overflow-x
  if (state.originalOverflowX) {
    el.style.overflowX = state.originalOverflowX;
  } else {
    el.style.removeProperty("overflow-x");
  }

  // 還原 overflow-y
  if (state.originalOverflowY) {
    el.style.overflowY = state.originalOverflowY;
  } else {
    el.style.removeProperty("overflow-y");
  }

  lockStates.delete(el);
  lockedElements.delete(el);
}

/**
 * 鎖定指定 target 的滾動（預設為 body）。
 */
export function lockScroll(options?: ScrollLockOptions): void {
  if (!isBrowser()) return;

  const el = resolveTarget(options?.target);
  if (!el) return;

  applyLock(el);
}

/**
 * 解鎖指定 target 的滾動。
 *
 * 正常模式：
 * - force = false（預設）
 * - 會將該 target 的 lock 計數 -1
 * - 計數歸零時才會真的還原 style
 *
 * 強制模式：
 * - force = true
 * - 不管目前計數是多少，立刻還原 style 並清除 state
 */
export function unlockScroll(options?: ScrollUnlockOptions): void {
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

/**
 * 判斷指定 target 目前是否被這個函式庫鎖定。
 * - 不看 computed style，只看內部的 lock 計數。
 */
export function isScrollLocked(target?: ScrollLockTarget): boolean {
  if (!isBrowser()) return false;

  const el = resolveTarget(target);
  if (!el) return false;

  const state = lockStates.get(el);
  return !!state && state.count > 0;
}

/**
 * 清除目前所有鎖定滾動的狀態。
 * - 無論有多少 target、每個 target 的 count 是多少
 * - 一律還原所有元素的原始 inline style
 * - 並清空內部的 state
 */
export function clearAllScrollLocks(): void {
  if (!isBrowser()) return;

  // 因為有 lockedElements（Set），可以安全地遍歷所有已經被鎖過的元素
  for (const el of lockedElements) {
    const state = lockStates.get(el);
    if (state) {
      restoreElement(el, state);
    }
  }

  lockedElements.clear();
}
