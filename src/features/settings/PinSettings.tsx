import { useState } from "react";
import { useNavigate } from "react-router";
import { Screen } from "@/app/Screen";
import { Button } from "@/components/Button";
import { PinPad } from "@/components/PinPad";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useToast } from "@/components/toast-context";
import { checkPin, createPin } from "@/domain/pin";
import { changeSettings, setStoredPin } from "@/store/actions";
import { useAppStore } from "@/store";
import { BackButton } from "../setup/BackButton";

const LOCK_AFTER = [
  { value: "immediately", label: "Immediately" },
  { value: "1m", label: "1 min" },
  { value: "5m", label: "5 min" },
] as const;

type Step =
  | { kind: "menu" }
  | { kind: "current"; then: "change" | "remove" }
  | { kind: "new" }
  | { kind: "confirm"; first: string };

const TITLE: Record<Step["kind"], string> = {
  menu: "PIN lock",
  current: "Enter your current PIN",
  new: "Choose a 4-digit PIN",
  confirm: "Enter it again",
};

/** Set, change or remove the PIN, and when it locks (PRD §8.10). */
export function PinSettings() {
  const navigate = useNavigate();
  const toast = useToast();
  const pin = useAppStore((s) => s.data.settings.pin);
  const lockAfter = useAppStore((s) => s.data.settings.lockAfter);
  const [step, setStep] = useState<Step>(pin ? { kind: "menu" } : { kind: "new" });
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const back = () => {
    if (step.kind === "menu" || !pin) void navigate("/settings");
    else setStep({ kind: "menu" });
  };

  return (
    <Screen>
      <BackButton label="Settings" onClick={back} />
      <h1 className="mt-2 text-title text-text-1">{TITLE[step.kind]}</h1>
      <p className="mt-2 text-callout text-text-2">
        The PIN is a privacy screen: it stops other people opening Onyx on your phone. It doesn't
        encrypt your data, so keep backing up.
      </p>

      {step.kind === "menu" ? (
        <div className="mt-section flex flex-col gap-4">
          <div>
            <p className="mb-2 px-1 text-callout text-text-2">Lock after leaving Onyx</p>
            <SegmentedControl
              label="Lock after"
              options={LOCK_AFTER}
              value={lockAfter}
              onChange={(value) => {
                changeSettings({ lockAfter: value });
              }}
            />
          </div>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              setStep({ kind: "current", then: "change" });
            }}
          >
            Change PIN
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={() => {
              setStep({ kind: "current", then: "remove" });
            }}
          >
            Turn off PIN
          </Button>
        </div>
      ) : (
        <div className="mt-section flex flex-col items-center gap-4">
          <p className="min-h-5 text-callout text-negative" aria-live="polite">
            {busy ? <span className="text-text-2">Saving…</span> : message}
          </p>
          <PinPad
            key={step.kind}
            disabled={busy}
            onComplete={async (entered) => {
              setMessage(null);
              if (step.kind === "current") {
                if (!pin || !(await checkPin(entered, pin))) {
                  setMessage("That's not your PIN.");
                  return false;
                }
                if (step.then === "remove") {
                  setStoredPin(null);
                  toast.show({ tone: "info", message: "PIN turned off" });
                  void navigate("/settings");
                } else {
                  setStep({ kind: "new" });
                }
                return true;
              }
              if (step.kind === "new") {
                setStep({ kind: "confirm", first: entered });
                return true;
              }
              // Confirming: both entries must match
              if (entered !== step.first) {
                setMessage("Those didn't match. Start again.");
                setStep({ kind: "new" });
                return false;
              }
              setBusy(true);
              setStoredPin(await createPin(entered));
              setBusy(false);
              toast.show({ tone: "success", message: "PIN set" });
              void navigate("/settings");
              return true;
            }}
          />
        </div>
      )}
    </Screen>
  );
}
