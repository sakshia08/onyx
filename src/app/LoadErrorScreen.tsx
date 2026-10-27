import { ShieldCheck } from "lucide-react";
import type { LoadError } from "@/store/save-status";

const COPY: Record<LoadError, { title: string; body: string }> = {
  "newer-version": {
    title: "Update Onyx to open your data",
    body: "Your data was saved by a newer version of Onyx. Close the app and open it again to get the latest version.",
  },
  invalid: {
    title: "Onyx couldn't read your data",
    body: "Something in your saved data doesn't look right. You can restore your latest backup from Settings once this is fixed.",
  },
  unreadable: {
    title: "Onyx couldn't open its storage",
    body: "Close the app completely and open it again. If this keeps happening, restart your iPhone.",
  },
};

/** Saved data exists but can't be used. It is never touched, and the screen says so. */
export function LoadErrorScreen({ reason }: { reason: LoadError }) {
  const { title, body } = COPY[reason];
  return (
    <main
      className="mx-auto flex min-h-dvh max-w-[560px] flex-col justify-center px-screen"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      <h1 className="text-title text-text-1">{title}</h1>
      <p className="mt-3 text-body text-text-2">{body}</p>
      <p className="mt-6 flex items-center gap-2 text-callout text-text-1">
        <ShieldCheck aria-hidden="true" className="size-5 text-positive" />
        Nothing has been changed or deleted.
      </p>
    </main>
  );
}
