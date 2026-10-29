import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  if (!("serviceWorker" in navigator)) return () => undefined;
  navigator.serviceWorker.addEventListener("controllerchange", onChange);
  return () => {
    navigator.serviceWorker.removeEventListener("controllerchange", onChange);
  };
}

function snapshot(): boolean {
  return "serviceWorker" in navigator && navigator.serviceWorker.controller !== null;
}

/** Whether the offline helper (service worker) is installed and in control of this page. */
export function useOfflineReady(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
