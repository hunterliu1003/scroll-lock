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
  });

  it("locks and unlocks body scroll", () => {
    expect(isScrollLocked(document.body)).toBe(false);
    expect(document.body.style.overflow).toBe("");

    lockScroll(document.body);

    expect(isScrollLocked(document.body)).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    unlockScroll(document.body);

    expect(isScrollLocked(document.body)).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("respects reference counting for the same target", () => {
    lockScroll(document.body);
    lockScroll(document.body);

    // After two locks, overflow is still just hidden
    expect(isScrollLocked(document.body)).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    // First unlock doesn't restore style
    unlockScroll(document.body);
    expect(isScrollLocked(document.body)).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    // Second unlock actually unlocks
    unlockScroll(document.body);
    expect(isScrollLocked(document.body)).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("force unlock ignores reference count", () => {
    lockScroll(document.body);
    lockScroll(document.body);
    expect(isScrollLocked(document.body)).toBe(true);

    unlockScroll(document.body, { force: true });

    expect(isScrollLocked(document.body)).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("handles multiple targets independently", () => {
    const panel = document.createElement("div");
    document.body.append(panel);

    lockScroll(document.body);
    lockScroll(panel);

    expect(isScrollLocked(document.body)).toBe(true);
    expect(isScrollLocked(panel)).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
    expect(panel.style.overflow).toBe("hidden");

    // Unlock panel, doesn't affect body
    unlockScroll(panel);
    expect(isScrollLocked(document.body)).toBe(true); // body still locked
    expect(isScrollLocked(panel)).toBe(false);
    expect(document.body.style.overflow).toBe("hidden");
    expect(panel.style.overflow).toBe("");

    // Unlock body
    unlockScroll(document.body);
    expect(isScrollLocked(document.body)).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("clearAllScrollLocks restores all targets", () => {
    const panel = document.createElement("div");
    document.body.append(panel);

    lockScroll(document.body);
    lockScroll(panel);
    lockScroll(panel); // panel locked twice

    expect(isScrollLocked(document.body)).toBe(true);
    expect(isScrollLocked(panel)).toBe(true);

    clearAllScrollLocks();

    expect(isScrollLocked(document.body)).toBe(false);
    expect(isScrollLocked(panel)).toBe(false);
    expect(document.body.style.overflow).toBe("");
    expect(panel.style.overflow).toBe("");
  });
});
