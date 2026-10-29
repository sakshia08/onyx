import { useState } from "react";
import { isIOS, isStandalone } from "@/lib/device";
import { dismissInstallGuide } from "@/store/actions";
import { useAppStore } from "@/store";
import { InstallGuide } from "./InstallGuide";

/** In Safari on an iPhone, suggest installing first (PRD §8.1). Dismissed for good once skipped. */
export function InstallGate({ children }: { children: React.ReactNode }) {
  const dismissed = useAppStore((s) => s.data.meta.installGuideDismissed === true);
  const [show] = useState(() => isIOS() && !isStandalone());
  if (show && !dismissed) return <InstallGuide onContinue={dismissInstallGuide} />;
  return <>{children}</>;
}
