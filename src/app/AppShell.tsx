import { Outlet, useLocation } from "react-router";
import { TabBar } from "@/components/TabBar";
import { useQuickAdd } from "@/features/quick-add/quick-add-context";
import { QuickAddProvider } from "@/features/quick-add/QuickAddProvider";

/** Dark base, safe areas, the floating tab bar and Quick add (PRD §10.8, §9). */
export function AppShell() {
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
