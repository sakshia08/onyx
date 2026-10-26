import { useState } from "react";
import { Outlet } from "react-router";
import { Sheet } from "@/components/Sheet";
import { TabBar } from "@/components/TabBar";

/** Dark base, safe areas and the floating tab bar (PRD §10.8, §9). */
export function AppShell() {
  const [addOpen, setAddOpen] = useState(false);
  return (
    <div className="relative min-h-dvh">
      <Outlet />
      <TabBar
        onAdd={() => {
          setAddOpen(true);
        }}
      />
      <Sheet open={addOpen} onOpenChange={setAddOpen} title="Quick add">
        <p className="pb-6 text-callout text-text-2">Logging expenses arrives in Phase 3.</p>
      </Sheet>
    </div>
  );
}
