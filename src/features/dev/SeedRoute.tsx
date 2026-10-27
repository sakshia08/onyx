import { useEffect } from "react";
import { useNavigate } from "react-router";
import { appStore } from "@/store";
import { sampleAppState } from "./seed";

/** Dev only, at /#/dev/seed: replaces all data with a sample month, then opens Home. */
export function SeedRoute() {
  const navigate = useNavigate();
  useEffect(() => {
    appStore.getState().update(() => sampleAppState(new Date()));
    void navigate("/", { replace: true });
  }, [navigate]);
  return null;
}
