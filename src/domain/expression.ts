/**
 * The keypad's amount field (PRD §8.4). Supports + and − between numbers,
 * up to two decimals per number. Evaluated with integer paise, never eval.
 */

import { MAX_ENTRY_PAISE, PAISE_PER_RUPEE, type Paise } from "./money";

export type KeypadKey =
  "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "." | "+" | "-" | "back";

type Operator = "+" | "-";
const OPERATORS: readonly string[] = ["+", "-"];
const MAX_INPUT_LENGTH = 40;

function isOperator(ch: string | undefined): ch is Operator {
  return ch !== undefined && OPERATORS.includes(ch);
}

/** The number currently being typed (after the last operator). */
function lastNumber(input: string): string {
  const match = /[^+-]*$/.exec(input);
  return match ? match[0] : "";
}

/** Applies one keypad press to the raw input string and returns the new string. */
export function applyKey(input: string, key: KeypadKey): string {
  if (key === "back") return input.slice(0, -1);
  if (input.length >= MAX_INPUT_LENGTH) return input;

  const last = input.at(-1);
  const current = lastNumber(input);

  if (key === "+" || key === "-") {
    if (input === "") return input; // no leading operator
    if (isOperator(last)) return input.slice(0, -1) + key; // swap operator
    if (last === ".") return input.slice(0, -1) + key; // "12." + → "12+"
    return input + key;
  }

  if (key === ".") {
    if (current.includes(".")) return input;
    return input + (current === "" ? "0." : ".");
  }

  // Digit
  const decimals = current.split(".")[1];
  if (decimals !== undefined && decimals.length >= 2) return input; // max 2 decimals
  if (current === "0") return input.slice(0, -1) + key; // no leading zeros
  return input + key;
}

/** "12.5" → 1250 paise. Returns null if the text isn't a valid amount. */
export function parseNumber(text: string): Paise | null {
  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(text);
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = (match[2] ?? "").padEnd(2, "0");
  const value = whole * PAISE_PER_RUPEE + Number(fraction);
  return Number.isSafeInteger(value) ? value : null;
}

export type EvaluateResult =
  | { ok: true; value: Paise; terms: string[]; hasOperator: boolean }
  | { ok: false; reason: "empty" | "invalid" | "zero" | "negative" | "too-large" };

/**
 * Evaluates the raw input. A trailing operator ("250+") is ignored (PRD §13).
 * The result must be more than ₹0 and at most ₹1,00,00,000.
 */
export function evaluate(input: string): EvaluateResult {
  let text = input.trim();
  while (isOperator(text.at(-1))) text = text.slice(0, -1);
  if (text === "") return { ok: false, reason: "empty" };

  const tokens = text.split(/([+-])/);
  const terms: string[] = [];
  let total = 0;
  let op: Operator = "+";
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i] ?? "";
    if (i % 2 === 1) {
      if (!isOperator(token)) return { ok: false, reason: "invalid" };
      op = token;
      continue;
    }
    const value = parseNumber(token);
    if (value === null) return { ok: false, reason: "invalid" };
    if (value > MAX_ENTRY_PAISE) return { ok: false, reason: "too-large" };
    total = op === "+" ? total + value : total - value;
    terms.push(token);
  }

  if (total < 0) return { ok: false, reason: "negative" };
  if (total === 0) return { ok: false, reason: "zero" };
  if (total > MAX_ENTRY_PAISE) return { ok: false, reason: "too-large" };
  return { ok: true, value: total, terms, hasOperator: terms.length > 1 };
}

/** "250+180" → "250 + 180" for the small line above the amount (uses a real minus sign). */
export function formatExpression(input: string): string {
  return input.replace(/\+/g, " + ").replace(/-/g, " − ").trim();
}
