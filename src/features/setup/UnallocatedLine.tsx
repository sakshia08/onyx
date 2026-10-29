import { Amount } from "@/components/Amount";
import type { Paise } from "@/domain/money";

/** "₹1,000 unallocated", or "Over-allocated by ₹1,500" in amber (PRD §8.2). */
export function UnallocatedLine({ amount }: { amount: Paise }) {
  if (amount < 0) {
    return (
      <p className="text-center text-callout text-warning">
        Over-allocated by <Amount value={-amount} size="callout" tone="inherit" />
      </p>
    );
  }
  if (amount === 0) {
    return <p className="text-center text-callout text-text-2">Every rupee has a bucket</p>;
  }
  return (
    <p className="text-center text-callout text-text-2">
      <Amount value={amount} size="callout" tone="inherit" /> unallocated
    </p>
  );
}
