import { formatAmount, type Paise, type SignDisplay } from "@/domain/money";
import { privacyStore } from "@/store/privacy";

export const HIDDEN_AMOUNT = "₹ ••••";

/** An amount as text in buttons and toasts, hidden as "₹ ••••" while the eye is on. */
export function shownAmount(value: Paise, signDisplay: SignDisplay = "auto"): string {
  return privacyStore.getState().amountsHidden ? HIDDEN_AMOUNT : formatAmount(value, signDisplay);
}
