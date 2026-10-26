import { useState } from "react";
import { Screen } from "@/app/Screen";
import { PigIcon } from "@/components/PigIcon";
import { TabBar } from "@/components/TabBar";
import { ColorsSection } from "./sections/ColorsSection";
import { ControlsSection } from "./sections/ControlsSection";
import { EntriesSection } from "./sections/EntriesSection";
import { HomeSection } from "./sections/HomeSection";
import { KeypadSection } from "./sections/KeypadSection";
import { PigSection } from "./sections/PigSection";
import { QuickAddSheetDemo } from "./sections/QuickAddSheetDemo";
import { SheetSection } from "./sections/SheetSection";
import { TypeSection } from "./sections/TypeSection";

/** Dev-only page at /#/design (PRD §14, phase 1): every building block in one place. */
export function DesignPreview() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const openSheet = () => {
    setSheetOpen(true);
  };

  return (
    <>
      <Screen>
        <header className="pt-2">
          <p className="micro-label flex items-center gap-1.5">
            <PigIcon className="size-3.5 text-piggy-strong" strokeWidth={2.4} />
            Onyx · dev only
          </p>
          <h1 className="mt-2 text-title text-text-1">Design preview</h1>
          <p className="mt-1 text-callout text-text-2">
            Every building block, before any real screen.
          </p>
        </header>

        <ColorsSection />
        <TypeSection />
        <ControlsSection />
        <HomeSection />
        <EntriesSection />
        <KeypadSection />
        <SheetSection onOpenSheet={openSheet} />
        <PigSection />
      </Screen>

      <TabBar onAdd={openSheet} />
      <QuickAddSheetDemo open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
