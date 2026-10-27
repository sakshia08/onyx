import { describe, expect, it } from "vitest";
import { applyKey, evaluate, formatExpression, parseNumber, type KeypadKey } from "./expression";
import { MAX_ENTRY_PAISE, rupees } from "./money";

function type(keys: string): string {
  return (keys.match(/./g) ?? []).reduce(
    (input, k) => applyKey(input, (k === "<" ? "back" : k) as KeypadKey),
    "",
  );
}

describe("PRD §8.4 keypad maths", () => {
  it("250+180 shows '250 + 180' and evaluates to ₹430", () => {
    const input = type("250+180");
    expect(formatExpression(input)).toBe("250 + 180");
    expect(evaluate(input)).toEqual({
      ok: true,
      value: rupees(430),
      terms: ["250", "180"],
      hasOperator: true,
    });
  });

  it("minus works and shows a real minus sign", () => {
    expect(evaluate(type("500-120.50"))).toMatchObject({ ok: true, value: rupees(379) + 50 });
    expect(formatExpression("500-120")).toBe("500 − 120");
  });

  it("decimals are exact: 0.1 + 0.2 is ₹0.30", () => {
    expect(evaluate(type("0.1+0.2"))).toMatchObject({ ok: true, value: 30 });
  });
});

describe("PRD §13 amount input", () => {
  it("allows at most 2 decimals", () => {
    expect(type("12.345")).toBe("12.34");
    expect(parseNumber("12.345")).toBeNull();
  });

  it("allows at most ₹1,00,00,000 per entry", () => {
    expect(evaluate("10000000")).toMatchObject({ ok: true, value: MAX_ENTRY_PAISE });
    expect(evaluate("10000000.01")).toEqual({ ok: false, reason: "too-large" });
    expect(evaluate("9000000+2000000")).toEqual({ ok: false, reason: "too-large" });
  });

  it("empty or 0 can't be saved", () => {
    expect(evaluate("")).toEqual({ ok: false, reason: "empty" });
    expect(evaluate("0")).toEqual({ ok: false, reason: "zero" });
    expect(evaluate("0.00")).toEqual({ ok: false, reason: "zero" });
    expect(evaluate("100-100")).toEqual({ ok: false, reason: "zero" });
  });

  it("a trailing operator is ignored", () => {
    expect(evaluate("250+")).toMatchObject({ ok: true, value: rupees(250), hasOperator: false });
  });

  it("a negative result is rejected", () => {
    expect(evaluate(type("100-250"))).toEqual({ ok: false, reason: "negative" });
  });
});

describe("keypad typing rules", () => {
  it("no leading operator, and a second operator replaces the first", () => {
    expect(type("+5")).toBe("5");
    expect(type("5+-3")).toBe("5-3");
  });

  it("no leading zeros, and '.' on its own becomes '0.'", () => {
    expect(type("007")).toBe("7");
    expect(type(".5")).toBe("0.5");
    expect(type("1..2")).toBe("1.2");
  });

  it("backspace removes the last character", () => {
    expect(type("123<")).toBe("12");
    expect(type("<")).toBe("");
  });

  it("never evaluates code", () => {
    expect(evaluate("alert(1)")).toEqual({ ok: false, reason: "invalid" });
    expect(evaluate("1e5")).toEqual({ ok: false, reason: "invalid" });
  });
});
