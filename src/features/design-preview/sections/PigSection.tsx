import { Moon, PartyPopper } from "lucide-react";
import { Slider } from "radix-ui";
import { useState } from "react";
import { Amount } from "@/components/Amount";
import { Button } from "@/components/Button";
import { PigIcon } from "@/components/PigIcon";
import { PigIllustration } from "@/components/PigIllustration";
import { rupees } from "@/domain/money";
import { cn } from "@/lib/cn";
import { PreviewSection } from "../PreviewSection";

const TARGET = rupees(30_000);
const STASH_STEP = rupees(2_000);

export function PigSection() {
  const [balance, setBalance] = useState(rupees(18_600));
  const [stashSignal, setStashSignal] = useState(0);
  const [wiggleSignal, setWiggleSignal] = useState(0);
  const [sleeping, setSleeping] = useState(false);
  const progress = balance / TARGET;

  return (
    <PreviewSection
      id="pig"
      title="The pig"
      note="Idle bob, wave on the fill, coin drop and squish, wiggle, and sleeping."
    >
      <div className="relative overflow-hidden rounded-card border border-hairline bg-surface-1 px-5 pt-8 pb-5">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-64"
          style={{
            background:
              "radial-gradient(60% 80% at 50% 30%, color-mix(in srgb, var(--piggy-strong) 18%, transparent), transparent 75%)",
          }}
        />
        <div className="relative flex flex-col items-center">
          <PigIllustration
            progress={sleeping ? 0 : progress}
            stashSignal={stashSignal}
            wiggleSignal={wiggleSignal}
            sleeping={sleeping}
            width={248}
          />
          <p className="micro-label mt-5">Goa trip</p>
          <Amount value={sleeping ? 0 : balance} size="display" rounded animated className="mt-1" />
          <p className="mt-1 text-callout text-text-2">of ₹30,000 · 47 days left</p>
        </div>

        <div className="relative mt-6">
          <Slider.Root
            aria-label="Fill level"
            className="relative flex h-11 touch-none items-center select-none"
            min={0}
            max={TARGET}
            step={rupees(100)}
            value={[balance]}
            onValueChange={([v]) => {
              if (v !== undefined) setBalance(v);
            }}
          >
            <Slider.Track className="relative h-1.5 grow overflow-hidden rounded-pill bg-text-1/8">
              <Slider.Range className="absolute h-full rounded-pill bg-piggy" />
            </Slider.Track>
            <Slider.Thumb className="block size-6 rounded-pill bg-text-1 shadow-[0_0_0_4px_var(--surface-1)]" />
          </Slider.Root>
        </div>

        <div className="relative mt-3 flex flex-col gap-2">
          <Button
            variant="piggy"
            size="lg"
            className="w-full"
            disabled={sleeping}
            onClick={() => {
              setBalance((b) => Math.min(TARGET, b + STASH_STEP));
              setStashSignal((s) => s + 1);
            }}
          >
            <PigIcon className="size-5" strokeWidth={2.2} />
            Stash ₹2,000
          </Button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              disabled={sleeping}
              onClick={() => {
                setWiggleSignal((s) => s + 1);
              }}
            >
              <PartyPopper aria-hidden="true" className="size-4" />
              Wiggle
            </Button>
            <Button
              variant="secondary"
              className={cn("flex-1", sleeping && "bg-surface-3")}
              aria-pressed={sleeping}
              onClick={() => {
                setSleeping((s) => !s);
              }}
            >
              <Moon aria-hidden="true" className="size-4" />
              {sleeping ? "Wake up" : "Sleep"}
            </Button>
          </div>
        </div>
      </div>

      <h3 className="mt-5 mb-2 text-caption text-text-2">Small pig (tab icon and title accent)</h3>
      <div className="flex items-end gap-5 rounded-card border border-hairline bg-surface-1 p-5">
        <PigIcon className="size-4 text-piggy-strong" />
        <PigIcon className="size-[22px] text-piggy-strong" />
        <PigIcon className="size-8 text-piggy-strong" strokeWidth={1.75} />
        <PigIcon className="size-[22px] text-text-1" />
        <PigIcon className="size-[22px] text-text-3" />
        <span className="ml-auto flex items-center gap-2 text-title text-text-1">
          Piggy <PigIcon className="size-6 text-piggy-strong" strokeWidth={2.2} />
        </span>
      </div>
    </PreviewSection>
  );
}
