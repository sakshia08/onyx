/**
 * Money helpers. All money is integer paise (₹1 = 100 paise). PRD §7.
 * Nothing here uses floating-point maths on money.
 */

export type Paise = number;

export const PAISE_PER_RUPEE = 100;
/** ₹1,00,00,000 (one crore): the most a single entry can be (PRD §13). */
export const MAX_ENTRY_PAISE: Paise = 1_00_00_000 * PAISE_PER_RUPEE;

/** Minus sign used for display (U+2212, not a hyphen). */
export const MINUS = "−";

export function isPaise(value: number): boolean {
  return Number.isSafeInteger(value);
}

export function assertPaise(value: number): Paise {
  if (!isPaise(value)) throw new Error(`Not a whole number of paise: ${value}`);
  return value;
}

export function rupees(whole: number): Paise {
  return assertPaise(whole * PAISE_PER_RUPEE);
}

const groupFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export interface AmountParts {
  /** "" for zero or positive, "−" for negative, "+" when a plus sign is requested */
  sign: "" | "+" | typeof MINUS;
  /** Whole rupees with Indian grouping, e.g. "1,00,000" */
  rupees: string;
  /** Two-digit paise, or null when the paise are zero */
  paise: string | null;
}

export type SignDisplay = "auto" | "always" | "never";

export function amountParts(value: Paise, signDisplay: SignDisplay = "auto"): AmountParts {
  assertPaise(value);
  const abs = Math.abs(value);
  const whole = Math.floor(abs / PAISE_PER_RUPEE);
  const rest = abs % PAISE_PER_RUPEE;
  let sign: AmountParts["sign"] = "";
  if (signDisplay !== "never") {
    if (value < 0) sign = MINUS;
    else if (signDisplay === "always" && value > 0) sign = "+";
  }
  return {
    sign,
    rupees: groupFormatter.format(whole),
    paise: rest === 0 ? null : String(rest).padStart(2, "0"),
  };
}

/** Plain-text amount, e.g. "−₹500" or "₹1,00,000.50". */
export function formatAmount(value: Paise, signDisplay: SignDisplay = "auto"): string {
  const p = amountParts(value, signDisplay);
  return `${p.sign}₹${p.rupees}${p.paise === null ? "" : `.${p.paise}`}`;
}

/** What VoiceOver reads (PRD §10.9), e.g. "minus 500 rupees and 50 paise". */
export function spokenAmount(value: Paise): string {
  assertPaise(value);
  const abs = Math.abs(value);
  const whole = Math.floor(abs / PAISE_PER_RUPEE);
  const rest = abs % PAISE_PER_RUPEE;
  const parts = [`${whole} ${whole === 1 ? "rupee" : "rupees"}`];
  if (rest !== 0) parts.push(`and ${rest} paise`);
  return `${value < 0 ? "minus " : ""}${parts.join(" ")}`;
}

/** a ÷ b rounded down, exactly, for whole numbers (b > 0). */
export function floorDiv(a: number, b: number): number {
  assertPaise(a);
  if (!Number.isSafeInteger(b) || b <= 0) throw new Error(`Bad divisor: ${b}`);
  let q = Math.floor(a / b);
  // Correct any floating-point slip so q·b ≤ a < (q+1)·b always holds
  while (q * b > a) q -= 1;
  while ((q + 1) * b <= a) q += 1;
  return q;
}

/** a ÷ b rounded up, exactly, for whole numbers (b > 0). */
export function ceilDiv(a: number, b: number): number {
  return -floorDiv(-a, b);
}

/** a ÷ b rounded to the nearest whole number, halves rounding up (b > 0). */
export function roundDiv(a: number, b: number): number {
  return floorDiv(2 * a + b, 2 * b);
}

/** Rounds paise up to the next whole rupee, e.g. 600001 → 600100. */
export function roundUpToRupee(value: Paise): Paise {
  return ceilDiv(value, PAISE_PER_RUPEE) * PAISE_PER_RUPEE;
}

/** Rounds paise to the nearest whole rupee. */
export function roundToRupee(value: Paise): Paise {
  return roundDiv(value, PAISE_PER_RUPEE) * PAISE_PER_RUPEE;
}

export function sumPaise(values: Iterable<Paise>): Paise {
  let total = 0;
  for (const v of values) total += assertPaise(v);
  return assertPaise(total);
}
