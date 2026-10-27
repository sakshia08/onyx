import { GripVertical } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import { Amount } from "@/components/Amount";
import { bucketTint } from "@/components/bucket-color";
import type { Bucket } from "@/domain/types";

/** A bucket in setup: drag handle, emoji, name and kind, and its amount. Tap to edit. */
export function SetupBucketRow({ bucket, onOpen }: { bucket: Bucket; onOpen: () => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={bucket}
      dragListener={false}
      dragControls={controls}
      className="flex items-center rounded-inner border border-hairline bg-surface-1"
      whileDrag={{ scale: 1.02, backgroundColor: "var(--surface-2)" }}
    >
      <span
        aria-hidden="true"
        className="grid h-16 w-10 shrink-0 cursor-grab touch-none place-items-center text-text-3"
        onPointerDown={(e) => {
          controls.start(e);
        }}
      >
        <GripVertical className="size-5" />
      </span>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${bucket.name}, ${bucket.kind === "spend" ? "spend" : "save"} bucket. Edit`}
        className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-3 pr-4 text-left"
      >
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-pill text-[20px] leading-none"
          style={{ backgroundColor: bucketTint(bucket.color) }}
        >
          {bucket.emoji}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body text-text-1">{bucket.name}</span>
          <span className="text-caption text-text-3">
            {bucket.kind === "spend" ? "Spend" : "Save"}
          </span>
        </span>
        {bucket.allocated > 0 ? (
          <Amount value={bucket.allocated} size="headline" />
        ) : (
          <span className="text-callout text-text-3">Set amount</span>
        )}
      </button>
    </Reorder.Item>
  );
}
