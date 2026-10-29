import { Check, Share, SquarePlus } from "lucide-react";
import { Button } from "@/components/Button";
import { FullScreen } from "../setup/FullScreen";

const STEPS = [
  {
    icon: <Share aria-hidden="true" className="size-5" />,
    text: (
      <>
        Tap <strong className="font-semibold text-text-1">Share</strong> in Safari's toolbar.
      </>
    ),
  },
  {
    icon: <SquarePlus aria-hidden="true" className="size-5" />,
    text: (
      <>
        Scroll down and tap{" "}
        <strong className="font-semibold text-text-1">Add to Home Screen</strong>.
      </>
    ),
  },
  {
    icon: <Check aria-hidden="true" className="size-5" />,
    text: (
      <>
        Tap <strong className="font-semibold text-text-1">Add</strong>, then open Onyx from your
        Home Screen.
      </>
    ),
  },
];

/** Shown in Safari before Onyx is installed (PRD §8.1). */
export function InstallGuide({ onContinue }: { onContinue: () => void }) {
  return (
    <FullScreen
      footer={
        <Button variant="secondary" size="lg" className="w-full" onClick={onContinue}>
          Continue in browser
        </Button>
      }
    >
      <div className="flex flex-1 flex-col justify-center py-8">
        <img src="./icon.svg" alt="" className="size-20 rounded-[22%]" />
        <h1 className="mt-6 text-title text-text-1">Add Onyx to your Home Screen</h1>
        <p className="mt-2 text-body text-text-2">
          It opens like an app, works offline, and keeps your data on this phone.
        </p>

        <ol className="mt-8 flex flex-col gap-3">
          {STEPS.map((step, i) => (
            <li
              key={i}
              className="flex items-center gap-4 rounded-inner border border-hairline bg-surface-1 px-4 py-3.5"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-surface-2 text-accent">
                {step.icon}
              </span>
              <span className="text-body text-text-2">{step.text}</span>
            </li>
          ))}
        </ol>

        <p className="mt-6 text-callout text-text-3">
          Onyx in Safari and Onyx on your Home Screen keep separate data. Use the Home Screen app,
          so everything stays in one place.
        </p>
      </div>
    </FullScreen>
  );
}
