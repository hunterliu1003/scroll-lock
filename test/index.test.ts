import { describe, it, expect, beforeEach } from "vitest";
import {
  lockScroll,
  unlockScroll,
  isScrollLocked,
  clearAllScrollLocks,
} from "../src";

describe("scroll-lock", () => {
  beforeEach(() => {
    // Force clear all locks before each test to avoid interference
    clearAllScrollLocks();

    // Ensure body style is clean
    document.body.style.overflow = "";
    document.body.style.overflowX = "";
    document.body.style.overflowY = "";
  });

  it("locks and unlocks body scroll by default", () => {
    expect(isScrollLocked()).toBe(false);
    expect(document.body.style.overflow).toBe("");

    lockScroll(); // Default target is body

    expect(isScrollLocked()).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    unlockScroll(); // Default target is body

    expect(isScrollLocked()).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("respects reference counting for the same target", () => {
    lockScroll();
    lockScroll();

    // After two locks, overflow is still just hidden
    expect(isScrollLocked()).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    // First unlock doesn't restore style
    unlockScroll();
    expect(isScrollLocked()).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    // Second unlock actually unlocks
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

    // Unlock panel, doesn't affect body
    unlockScroll({ target: panel });
    expect(isScrollLocked()).toBe(true); // body still locked
    expect(isScrollLocked(panel)).toBe(false);
    expect(document.body.style.overflow).toBe("hidden");
    expect(panel.style.overflow).toBe("");

    // Unlock body
    unlockScroll();
    expect(isScrollLocked()).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("clearAllScrollLocks restores all targets", () => {
    const panel = document.createElement("div");
    document.body.append(panel);

    lockScroll(); // body
    lockScroll({ target: panel });
    lockScroll({ target: panel }); // panel locked twice

    expect(isScrollLocked()).toBe(true);
    expect(isScrollLocked(panel)).toBe(true);

    clearAllScrollLocks();

    expect(isScrollLocked()).toBe(false);
    expect(isScrollLocked(panel)).toBe(false);
    expect(document.body.style.overflow).toBe("");
    expect(panel.style.overflow).toBe("");
  });
});
