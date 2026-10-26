import { describe, expect, test } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  test("keeps a token text size and a token text color together", () => {
    expect(cn("text-display", "text-text-1")).toBe("text-display text-text-1");
    expect(cn("bg-text-1 text-bg", "h-14 px-7 text-headline")).toBe(
      "bg-text-1 text-bg h-14 px-7 text-headline",
    );
  });

  test("still lets a later class of the same kind win", () => {
    expect(cn("text-text-2", "text-text-1")).toBe("text-text-1");
    expect(cn("text-caption", "text-body")).toBe("text-body");
    expect(cn("rounded-inner", "rounded-pill")).toBe("rounded-pill");
  });
});
