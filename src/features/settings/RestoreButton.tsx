import { format } from "date-fns";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Sheet } from "@/components/Sheet";
import { useToast } from "@/components/toast-context";
import { parseBackup, type BackupSummary } from "@/domain/backup";
import { fromISODate } from "@/domain/dates";
import type { AppState } from "@/domain/types";
import { appStore } from "@/store";

const REFUSED: Record<"not-json" | "not-a-backup" | "newer-version" | "invalid", string> = {
  "not-json": "That file isn't an Onyx backup.",
  "not-a-backup": "That file isn't an Onyx backup.",
  "newer-version":
    "This backup is from a newer version of Onyx. Update the app first, then try again.",
  invalid: "This backup file is damaged, so nothing was changed.",
};

/**
 * "Restore from a backup" (PRD §8.11): pick the file (the Files picker on iPhone), check it,
 * show a preview, then replace everything, keeping a safety copy for "Undo restore".
 * Used in Settings, and on Welcome after erasing.
 */
export function RestoreButton({
  variant = "secondary",
  onRestored,
}: {
  variant?: "secondary" | "ghost";
  onRestored?: () => void;
}) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ state: AppState; summary: BackupSummary } | null>(null);

  return (
    <>
      <Button
        variant={variant}
        size="lg"
        onClick={() => {
          input.current?.click();
        }}
      >
        <Upload aria-hidden="true" className="size-5" />
        Restore from a backup
      </Button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-label="Backup file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          void file.text().then((text) => {
            const result = parseBackup(text);
            if (result.ok) setPending({ state: result.state, summary: result.summary });
            else toast.show({ tone: "error", message: REFUSED[result.reason], duration: 8000 });
          });
        }}
      />
      {pending && (
        <Sheet
          open
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
          title="Restore this backup?"
        >
          <div className="flex flex-col gap-4 pb-4">
            <p className="rounded-inner bg-surface-2 px-4 py-3 text-body text-text-1">
              {summaryText(pending.summary)}
            </p>
            <p className="text-callout text-text-2">
              Everything on this phone will be replaced. A copy of what's here now is kept, so you
              can undo this in Settings → Backup.
            </p>
            <Button
              variant="destructive"
              size="lg"
              onClick={() => {
                const incoming = pending.state;
                setPending(null);
                void appStore
                  .getState()
                  .restore(incoming)
                  .then(() => {
                    onRestored?.();
                    toast.show({
                      tone: "success",
                      message: "Restored. You can undo this in Settings.",
                    });
                  });
              }}
            >
              Replace everything on this phone
            </Button>
          </div>
        </Sheet>
      )}
    </>
  );
}

/** "14 months · 1,240 entries · 3 piggies · from 26 Oct 2026" (PRD §8.11). */
function summaryText(s: BackupSummary): string {
  const n = (count: number, one: string, many: string) =>
    `${count.toLocaleString("en-IN")} ${count === 1 ? one : many}`;
  return [
    n(s.months, "month", "months"),
    n(s.entries, "entry", "entries"),
    n(s.piggies, "piggy", "piggies"),
    `from ${format(fromISODate(s.since), "d MMM yyyy")}`,
  ].join(" · ");
}
