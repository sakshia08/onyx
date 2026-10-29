import { useEffect } from "react";
import { useToast } from "@/components/toast-context";
import { askToKeepData } from "@/lib/device";
import { appStore, useSaveStatus } from "@/store";
import { privacyStore } from "@/store/privacy";
import { LoadErrorScreen } from "./LoadErrorScreen";
import { Splash } from "./Splash";

/** Holds the app back until saved data has loaded, and reports failed saves (PRD §13). */
export function DataGate({ children }: { children: React.ReactNode }) {
  const hydrated = useSaveStatus((s) => s.hydrated);
  const loadError = useSaveStatus((s) => s.loadError);
  const saveFailed = useSaveStatus((s) => s.saveFailed);
  const toast = useToast();

  // Once data has loaded: ask iOS to keep it (PRD §8.1), lock if there's a PIN, and hide
  // amounts if that's the setting (PRD §8.10)
  useEffect(() => {
    if (!hydrated) return;
    void askToKeepData();
    const { settings } = appStore.getState().data;
    privacyStore.setState({
      locked: settings.pin !== undefined,
      amountsHidden: settings.hideAmountsOnOpen,
    });
  }, [hydrated]);

  useEffect(() => {
    if (!saveFailed) return;
    toast.show({
      tone: "error",
      message: "Couldn't save your last change. Your iPhone may be full. Send yourself a backup.",
      duration: 8000,
    });
  }, [saveFailed, toast]);

  if (loadError !== null) return <LoadErrorScreen reason={loadError} />;
  if (!hydrated) return <Splash />;
  return <>{children}</>;
}
