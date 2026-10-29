import { Button } from "@/components/Button";
import { PigIllustration } from "@/components/PigIllustration";
import { Sheet } from "@/components/Sheet";
import { piggyBalance } from "@/domain/piggy";
import { formatAmount } from "@/domain/money";
import type { Piggy } from "@/domain/types";
import { markPiggyDone } from "@/store/actions";

/** "You did it!" when a piggy first reaches its target (PRD §8.6). */
export function GoalSheet({
  piggy,
  open,
  onOpenChange,
}: {
  piggy: Piggy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="You did it!">
      <div className="flex flex-col items-center pb-2 text-center">
        <PigIllustration progress={1} wiggleSignal={open ? 1 : 0} width={180} />
        <p className="mt-4 text-body text-text-2">
          {piggy.emoji} {piggy.name} is fully saved: {formatAmount(piggyBalance(piggy))}.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2">
          <Button
            variant="piggy"
            size="lg"
            className="w-full"
            onClick={() => {
              markPiggyDone(piggy.id);
              onOpenChange(false);
            }}
          >
            Mark as done
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Keep saving
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
