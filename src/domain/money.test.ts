import { describe, expect, it } from "vitest";
import {
  amountParts,
  ceilDiv,
  floorDiv,
  formatAmount,
  MINUS,
  roundDiv,
  roundToRupee,
  roundUpToRupee,
  rupees,
  spokenAmount,
  sumPaise,
} from "./money";

describe("money is whole paise", () => {
  it("rupees() turns rupees into paise and refuses fractions of a paisa", () => {
    expect(rupees(60_000)).toBe(6_000_000);
    expect(() => rupees(0.001)).toThrow();
  });

  it("sums exactly where floats would drift (0.1 + 0.2)", () => {
    expect(sumPaise([10, 20])).toBe(30);
    expect(sumPaise(Array.from({ length: 1000 }, () => 1))).toBe(1000);
    expect(() => sumPaise([1.5])).toThrow();
  });
});

describe("exact integer division", () => {
  it("rounds down, up and to nearest", () => {
    expect(floorDiv(7, 2)).toBe(3);
    expect(floorDiv(-7, 2)).toBe(-4);
    expect(ceilDiv(7, 2)).toBe(4);
    expect(ceilDiv(6, 2)).toBe(3);
    expect(roundDiv(5, 2)).toBe(3);
    expect(roundDiv(4, 3)).toBe(1);
  });

  it("stays exact for large amounts", () => {
    const big = 9_007_199_254_740_000;
    expect(floorDiv(big, 1)).toBe(big);
    expect(ceilDiv(big + 1, 3)).toBe(3_002_399_751_580_001);
  });

  it("refuses a zero or fractional divisor", () => {
    expect(() => floorDiv(10, 0)).toThrow();
    expect(() => floorDiv(10, 1.5)).toThrow();
  });

  it("rounds to whole rupees", () => {
    expect(roundUpToRupee(600_001)).toBe(600_100);
    expect(roundUpToRupee(600_000)).toBe(600_000);
    expect(roundToRupee(620_049)).toBe(620_000);
    expect(roundToRupee(620_050)).toBe(620_100);
  });
});

describe("display (PRD §10.3)", () => {
  it("uses Indian grouping and hides zero paise", () => {
    expect(formatAmount(rupees(1_00_000))).toBe("₹1,00,000");
    expect(formatAmount(rupees(1_240) + 50)).toBe("₹1,240.50");
    expect(formatAmount(5)).toBe("₹0.05");
  });

  it("negatives always have a real minus sign", () => {
    expect(formatAmount(-rupees(500))).toBe(`${MINUS}₹500`);
    expect(amountParts(-rupees(500)).sign).toBe("−");
  });

  it("can show a plus sign, e.g. money back or extra put away", () => {
    expect(formatAmount(rupees(400), "always")).toBe("+₹400");
    expect(formatAmount(0, "always")).toBe("₹0");
  });

  it("reads naturally for VoiceOver", () => {
    expect(spokenAmount(rupees(1))).toBe("1 rupee");
    expect(spokenAmount(-(rupees(500) + 50))).toBe("minus 500 rupees and 50 paise");
  });
});
