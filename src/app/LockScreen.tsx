import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { PigIllustration } from "@/components/PigIllustration";
import { PinPad } from "@/components/PinPad";
import { Sheet } from "@/components/Sheet";
import {
  afterWrongPin,
  checkPin,
  cooldownLeft,
  shouldLockOnReturn,
  type StoredPin,
} from "@/domain/pin";
import { useAppStore } from "@/store";
import { privacyStore, usePrivacy } from "@/store/privacy";
import { EraseSheet } from "@/features/settings/EraseSheet";

/**
 * The PIN lock screen (PRD §8.10): a privacy screen, not encryption. After 5 wrong tries
 * there's a 30-second wait. "Forgot PIN?" explains the only way out.
 */
export function LockScreen({ pin }: { pin: StoredPin }) {
  const tries = usePrivacy((p) => p.tries);
  const [now, setNow] = useState(() => Date.now());
  const [forgotOpen, setForgotOpen] = useState(false);
  const [eraseOpen, setEraseOpen] = useState(false);
  const waiting = cooldownLeft(tries, now);

  useEffect(() => {
    if (waiting <= 0) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 500);
    return () => {
      window.clearInterval(timer);
    };
  }, [waiting]);

  return (
    <main
      className="fixed inset-0 z-50 mx-auto flex max-w-[560px] flex-col items-center justify-between bg-bg px-screen"
      style={{
        paddingTop: "calc(var(--safe-top) + 40px)",
        paddingBottom: "max(var(--safe-bottom), 16px)",
      }}
    >
      <div className="flex flex-col items-center text-center">
        <PigIllustration progress={0.5} sleeping width={120} />
        <h1 className="mt-4 text-headline text-text-1">Onyx is locked</h1>
        <p className="mt-1 text-callout text-text-2" aria-live="polite">
          {waiting > 0
            ? `Too many tries. Wait ${String(Math.ceil(waiting / 1000))} seconds.`
            : tries.failures > 0
              ? "Wrong PIN. Try again."
              : "Enter your PIN"}
        </p>
      </div>

      <PinPad
        disabled={waiting > 0}
        onComplete={async (attempt) => {
          const ok = await checkPin(attempt, pin);
          if (ok) {
            privacyStore.setState({ locked: false, tries: { failures: 0, lockedUntil: 0 } });
          } else {
            privacyStore.setState((s) => ({ tries: afterWrongPin(s.tries, Date.now()) }));
            setNow(Date.now());
          }
          return ok;
        }}
      />

      <Button
        variant="ghost"
        onClick={() => {
          setForgotOpen(true);
        }}
      >
        Forgot PIN?
      </Button>

      <Sheet open={forgotOpen} onOpenChange={setForgotOpen} title="Forgot your PIN?">
        <div className="flex flex-col gap-4 pb-4">
          <p className="text-body text-text-2">
            The PIN can't be recovered. The only way back in is to erase everything on this phone,
            then restore your latest backup from the Files app.
          </p>
          <p className="text-callout text-text-3">
            The PIN is a privacy screen. It doesn't encrypt your data.
          </p>
          <Button
            variant="destructive"
            size="lg"
            onClick={() => {
              setForgotOpen(false);
              setEraseOpen(true);
            }}
          >
            Erase everything
          </Button>
        </div>
      </Sheet>
      <EraseSheet
        open={eraseOpen}
        onOpenChange={setEraseOpen}
        onErased={() => {
          privacyStore.setState({ locked: false, tries: { failures: 0, lockedUntil: 0 } });
        }}
      />
    </main>
  );
}

/** Shows the lock screen when locked, and locks again on returning after the timeout. */
export function LockGate({ children }: { children: React.ReactNode }) {
  const pin = useAppStore((s) => s.data.settings.pin);
  const lockAfter = useAppStore((s) => s.data.settings.lockAfter);
  const locked = usePrivacy((p) => p.locked);

  useEffect(() => {
    if (!pin) return;
    let hiddenAt: number | null = null;
    const onChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else if (hiddenAt !== null) {
        if (shouldLockOnReturn(lockAfter, hiddenAt, Date.now()))
          privacyStore.setState({ locked: true });
        hiddenAt = null;
      }
    };
    document.addEventListener("visibilitychange", onChange);
    return () => {
      document.removeEventListener("visibilitychange", onChange);
    };
  }, [pin, lockAfter]);

  if (pin && locked) return <LockScreen pin={pin} />;
  return <>{children}</>;
}
