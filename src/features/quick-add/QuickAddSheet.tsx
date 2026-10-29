import { Sheet } from "@/components/Sheet";
import type { Entry, ID } from "@/domain/types";
import { QuickAddForm } from "./QuickAddForm";

export type QuickAddRequest =
  | { mode: "add"; session: number; bucketId?: ID; piggyId?: ID }
  | { mode: "edit"; session: number; entry: Entry };

/** Quick add and Edit entry share one sheet (PRD §8.4, §8.5). */
export function QuickAddSheet({
  open,
  onOpenChange,
  request,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: QuickAddRequest;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={request.mode === "edit" ? "Edit entry" : "Add expense"}
      hideTitle={request.mode === "add"}
    >
      <QuickAddForm
        key={request.session}
        request={request}
        onDone={() => {
          onOpenChange(false);
        }}
      />
    </Sheet>
  );
}
