import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { ToastProvider } from "@/components/Toast";
import { InstallGate } from "@/features/install-guide/InstallGate";
import { useAppStore } from "@/store";
import { DataGate } from "./DataGate";
import { LockGate } from "./LockScreen";
import { MonthWatcher } from "./MonthWatcher";
import { UpdatePrompt } from "./UpdatePrompt";
import { router } from "./router";

export function App() {
  // "user" follows the iPhone's Reduce Motion; the in-app setting can force it (PRD §10.7, §8.12)
  const motion = useAppStore((s) => s.data.settings.motion);
  useEffect(() => {
    document.documentElement.dataset.motion = motion === "reduced" ? "reduced" : "system";
  }, [motion]);

  return (
    <MotionConfig reducedMotion={motion === "reduced" ? "always" : "user"}>
      <ToastProvider>
        <UpdatePrompt />
        <DataGate>
          <LockGate>
            <MonthWatcher />
            <InstallGate>
              <RouterProvider router={router} />
            </InstallGate>
          </LockGate>
        </DataGate>
      </ToastProvider>
    </MotionConfig>
  );
}
