import { useEffect } from "react";
import { useToast } from "@/components/toast-context";
import { monthName } from "@/domain/dates";
import { formatAmount } from "@/domain/money";
import { checkTheMonth, runRecurringNow } from "@/store/actions";
import { useAppStore } from "@/store";

const EVERY_MINUTE = 60_000;

/**
 * Keeps the month up to date (PRD §8.7, §8.8): on launch, on returning to the app and every
 * minute, it closes a finished month (the recap follows) and logs due recurring expenses.
 */
export function MonthWatcher() {
  const toast = useToast();
  const activeMonth = useAppStore((s) => s.data.activeMonthKey);

  useEffect(() => {
    let warnedClock = false;
    const tick = () => {
      const check = checkTheMonth();
      if (check.kind === "clock-back" && !warnedClock) {
        warnedClock = true;
        toast.show({
          tone: "warning",
          duration: 10_000,
          message: `Your iPhone's date is before ${monthName(check.active)}. Nothing was changed.`,
        });
      }
      const logged = runRecurringNow();
      const [first] = logged;
      if (first !== undefined) {
        toast.queue({
          tone: "success",
          message:
            logged.length === 1
              ? `${first.name} ${formatAmount(first.amount)} logged automatically`
              : `${String(logged.length)} recurring expenses logged automatically`,
        });
      }
    };
    tick();
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(tick, EVERY_MINUTE);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [activeMonth, toast]);

  return null;
}
