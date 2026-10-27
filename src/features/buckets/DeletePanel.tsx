import { useState } from "react";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import type { Bucket, ID } from "@/domain/types";

interface DeletePanelProps {
  name: string;
  entryCount: number;
  others: readonly Bucket[];
  onCancel: () => void;
  onDelete?: () => void;
  onMoveAndDelete?: (toId: ID) => void;
}

/** Deleting a bucket. With entries, they move to another bucket first (PRD §13). */
export function DeletePanel({
  name,
  entryCount,
  others,
  onCancel,
  onDelete,
  onMoveAndDelete,
}: DeletePanelProps) {
  const [target, setTarget] = useState<ID | null>(null);
  const mustMove = entryCount > 0;

  return (
    <div className="flex flex-col gap-4 rounded-card border border-hairline bg-surface-2/50 p-4">
      {mustMove ? (
        <>
          <p className="text-body text-text-1">
            {name} has {entryCount} {entryCount === 1 ? "entry" : "entries"}. Move{" "}
            {entryCount === 1 ? "it" : "them"} to another bucket first.
          </p>
          {others.length === 0 ? (
            <p className="text-callout text-text-2">Add another bucket to move them to.</p>
          ) : (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Move entries to">
              {others.map((b) => (
                <Chip
                  key={b.id}
                  selected={target === b.id}
                  color={b.color}
                  leading={b.emoji}
                  onClick={() => {
                    setTarget(b.id);
                  }}
                >
                  {b.name}
                </Chip>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-body text-text-1">Delete {name}? This can't be undone.</p>
      )}
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          disabled={mustMove && target === null}
          onClick={() => {
            if (mustMove) {
              if (target !== null) onMoveAndDelete?.(target);
            } else {
              onDelete?.();
            }
          }}
        >
          {mustMove ? "Move and delete" : "Delete"}
        </Button>
      </div>
    </div>
  );
}
