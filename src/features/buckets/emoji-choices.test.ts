import { describe, expect, it } from "vitest";
import { firstGrapheme } from "./emoji-choices";

describe("typed emoji", () => {
  it("keeps whole emoji, including ones made of several characters", () => {
    expect(firstGrapheme("🏋️‍♀️ gym")).toBe("🏋️‍♀️");
    expect(firstGrapheme("👨‍👩‍👧")).toBe("👨‍👩‍👧");
    expect(firstGrapheme("  ")).toBe("");
  });
});
