import { describe, expect, it } from "vitest";
import { test } from "../src";

describe("scroll-lock", () => {
  it("pass", () => {
    expect(test()).toBe('works!');
  });
});
