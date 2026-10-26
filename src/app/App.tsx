import { MotionConfig } from "motion/react";
import { RouterProvider } from "react-router";
import { ToastProvider } from "@/components/Toast";
import { router } from "./router";

export function App() {
  return (
    // "user" follows the iPhone's Reduce Motion setting (PRD §10.7)
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </MotionConfig>
  );
}
