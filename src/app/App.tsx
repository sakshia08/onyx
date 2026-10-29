import { MotionConfig } from "motion/react";
import { RouterProvider } from "react-router";
import { ToastProvider } from "@/components/Toast";
import { InstallGate } from "@/features/install-guide/InstallGate";
import { DataGate } from "./DataGate";
import { MonthWatcher } from "./MonthWatcher";
import { UpdatePrompt } from "./UpdatePrompt";
import { router } from "./router";

export function App() {
  return (
    // "user" follows the iPhone's Reduce Motion setting (PRD §10.7)
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <UpdatePrompt />
        <DataGate>
          <MonthWatcher />
          <InstallGate>
            <RouterProvider router={router} />
          </InstallGate>
        </DataGate>
      </ToastProvider>
    </MotionConfig>
  );
}
