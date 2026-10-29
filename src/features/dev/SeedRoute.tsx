import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { appStore } from "@/store";
import { sampleAppState, sampleBeforeSetup } from "./seed";

/**
 * Dev only, at /#/dev/seed: replaces all data with a sample month, then opens Home.
 * /#/dev/seed?setup=1 instead opens setup for a new month, with piggies to plan.
 */
export function SeedRoute() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setup = params.get("setup") === "1";
  useEffect(() => {
    appStore
      .getState()
      .update(() => (setup ? sampleBeforeSetup(new Date()) : sampleAppState(new Date())));
    void navigate(setup ? "/setup" : "/", { replace: true });
  }, [navigate, setup]);
  return null;
}
