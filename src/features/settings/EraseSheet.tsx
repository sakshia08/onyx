import { useState } from "react";
import { Button } from "@/components/Button";
import { Sheet } from "@/components/Sheet";
import { TextField } from "@/components/TextField";
import { appStore } from "@/store";

const CONFIRM = "ERASE";

/** "Erase all data" (PRD §8.12): type ERASE to confirm. Can't be undone. */
export function EraseSheet({
  open,
  onOpenChange,
  onErased,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onErased?: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Erase all data">
      <EraseForm
        onDone={() => {
          onOpenChange(false);
          onErased?.();
        }}
      />
    </Sheet>
  );
}

function EraseForm({ onDone }: { onDone: () => void }) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-col gap-4 pb-4">
      <p className="text-body text-text-2">
        Every month, entry, piggy and setting on this phone will be deleted. This can't be undone.
        If you have a backup in the Files app, you can restore it afterwards.
      </p>
      <TextField
        label={`Type ${CONFIRM} to confirm`}
        autoCapitalize="characters"
        autoComplete="off"
        value={typed}
        onChange={(e) => {
          setTyped(e.target.value);
        }}
      />
      <Button
        variant="destructive"
        size="lg"
        disabled={typed.trim() !== CONFIRM || busy}
        onClick={() => {
          setBusy(true);
          void appStore.getState().eraseEverything().then(onDone);
        }}
      >
        Erase everything
      </Button>
    </div>
  );
}
