import { useEffect, useState } from "react";
import type { Month } from "@/domain/types";
import { useAppStore } from "./index";

/** The month being lived in right now, or null before the first setup. */
export function useActiveMonth(): Month | null {
  return useAppStore((s) =>
    s.data.activeMonthKey === null ? null : (s.data.months[s.data.activeMonthKey] ?? null),
  );
}

/** The current time, refreshed every minute so "days left" and greetings stay right. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => {
      window.clearInterval(timer);
    };
  }, []);
  return now;
}
