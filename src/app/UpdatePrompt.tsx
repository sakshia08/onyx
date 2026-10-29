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
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    // Register straight away rather than waiting for the page to finish loading
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (navigator.onLine) void registration.update();
      };
      // iPhone resumes home-screen apps without reloading them, so look for a new version
      // every time Onyx comes back to the front, as well as every hour
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
      window.setInterval(check, CHECK_EVERY_MS);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    toast.queue({ tone: "success", message: "Onyx is ready to work offline" });
  }, [offlineReady, toast]);

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
