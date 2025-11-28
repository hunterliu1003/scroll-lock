import { describe, it, expect, beforeEach } from "vitest";
import {
  lockScroll,
  unlockScroll,
  isScrollLocked,
  clearAllScrollLocks,
} from "../src";

describe("scroll-lock", () => {
  beforeEach(() => {
    // 每個測試前都強制清除所有 lock，避免互相影響
    clearAllScrollLocks();

    // 確保 body style 是乾淨的
    document.body.style.overflow = "";
    document.body.style.overflowX = "";
    document.body.style.overflowY = "";
  });

  it("locks and unlocks body scroll by default", () => {
    expect(isScrollLocked()).toBe(false);
    expect(document.body.style.overflow).toBe("");

    lockScroll(); // 預設 target 為 body

    expect(isScrollLocked()).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    unlockScroll(); // 預設 target 為 body

    expect(isScrollLocked()).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("respects reference counting for the same target", () => {
    lockScroll();
    lockScroll();

    // 兩次 lock 後仍然只會是 overflow: hidden
    expect(isScrollLocked()).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    // 第一次 unlock 不還原 style
    unlockScroll();
    expect(isScrollLocked()).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    // 第二次 unlock 才真的解鎖
    unlockScroll();
    expect(isScrollLocked()).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("force unlock ignores reference count", () => {
    lockScroll();
    lockScroll();
    expect(isScrollLocked()).toBe(true);

    unlockScroll({ force: true });

    expect(isScrollLocked()).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("handles multiple targets independently", () => {
    const panel = document.createElement("div");
    document.body.append(panel);

    lockScroll(); // body
    lockScroll({ target: panel });

    expect(isScrollLocked()).toBe(true); // body
    expect(isScrollLocked(panel)).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
    expect(panel.style.overflow).toBe("hidden");

    // 解鎖 panel，不影響 body
    unlockScroll({ target: panel });
    expect(isScrollLocked()).toBe(true); // body 仍鎖定
    expect(isScrollLocked(panel)).toBe(false);
    expect(document.body.style.overflow).toBe("hidden");
    expect(panel.style.overflow).toBe("");

    // 再解鎖 body
    unlockScroll();
    expect(isScrollLocked()).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("clearAllScrollLocks restores all targets", () => {
    const panel = document.createElement("div");
    document.body.append(panel);

    lockScroll(); // body
    lockScroll({ target: panel });
    lockScroll({ target: panel }); // panel lock 兩次

    expect(isScrollLocked()).toBe(true);
    expect(isScrollLocked(panel)).toBe(true);

    clearAllScrollLocks();

    expect(isScrollLocked()).toBe(false);
    expect(isScrollLocked(panel)).toBe(false);
    expect(document.body.style.overflow).toBe("");
    expect(panel.style.overflow).toBe("");
  });
});
