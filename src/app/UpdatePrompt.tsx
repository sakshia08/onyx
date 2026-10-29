import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useToast } from "@/components/toast-context";

const CHECK_EVERY_MS = 60 * 60 * 1000;

/**
 * Offline support and updates (PRD §12.3). A new version waits until I tap Refresh,
 * so the app never reloads while I'm typing.
 */
export function UpdatePrompt() {
  const toast = useToast();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // Look for a new version every hour while the app is open
      window.setInterval(() => {
        if (navigator.onLine) void registration.update();
      }, CHECK_EVERY_MS);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    toast.queue({
      tone: "info",
      message: "New version available",
      duration: Infinity,
      action: {
        label: "Refresh",
        onAction: () => {
          void updateServiceWorker(true);
        },
      },
    });
  }, [needRefresh, toast, updateServiceWorker]);

  return null;
}
