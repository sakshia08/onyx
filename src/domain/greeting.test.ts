import { describe, expect, it } from "vitest";
import { greeting } from "./greeting";

describe("greeting (PRD §8.3)", () => {
  it("follows the time of day", () => {
    expect(greeting(8, "Sakshi")).toBe("Good morning, Sakshi");
    expect(greeting(14, "Sakshi")).toBe("Good afternoon, Sakshi");
    expect(greeting(20, "Sakshi")).toBe("Good evening, Sakshi");
    expect(greeting(2, "Sakshi")).toBe("Good evening, Sakshi");
  });

  it("works without a name", () => {
    expect(greeting(8)).toBe("Good morning");
    expect(greeting(8, "   ")).toBe("Good morning");
  });
});
