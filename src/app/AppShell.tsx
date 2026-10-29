import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { useToast } from "@/components/toast-context";
import { autoStashNow } from "@/store/actions";
import { useAppStore } from "@/store";
import { TabBar } from "@/components/TabBar";
import { useQuickAdd } from "@/features/quick-add/quick-add-context";
import { QuickAddProvider } from "@/features/quick-add/QuickAddProvider";

/** Dark base, safe areas, the floating tab bar and Quick add (PRD §10.8, §9). */
export function AppShell() {
  useAutoStash();
  return (
    <QuickAddProvider>
      <div className="relative min-h-dvh">
        <Outlet />
        <AddButtonBar />
      </div>
    </QuickAddProvider>
  );
}

/** On a bucket's own screen, + opens Quick add with that bucket chosen (PRD §8.4). */
function AddButtonBar() {
  const quickAdd = useQuickAdd();
  const { pathname } = useLocation();
  const bucketId = /^\/bucket\/([^/]+)$/.exec(pathname)?.[1];
  return (
    <TabBar
      onAdd={() => {
        quickAdd.openAdd(bucketId);
      }}
    />
  );
}

/** Auto-stash (PRD §8.6) runs when the app opens and when a new month starts. */
function useAutoStash() {
  const toast = useToast();
  const activeMonth = useAppStore((s) => s.data.activeMonthKey);
  useEffect(() => {
    if (activeMonth === null) return;
    const count = autoStashNow();
    if (count > 0) {
      toast.queue({
        tone: "success",
        message:
          count === 1 ? "Auto-stashed into 1 piggy" : `Auto-stashed into ${String(count)} piggies`,
      });
    }
  }, [activeMonth, toast]);
}
