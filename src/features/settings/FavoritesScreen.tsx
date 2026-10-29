import { GripVertical, Star, Trash2 } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Screen } from "@/app/Screen";
import { Amount } from "@/components/Amount";
import { AmountInputDisplay } from "@/components/AmountInputDisplay";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Keypad } from "@/components/Keypad";
import { Sheet } from "@/components/Sheet";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/toast-context";
import { applyKeyToSaved, evaluate, paiseToInput } from "@/domain/expression";
import { bucketsForHome } from "@/domain/setup";
import type { Bucket, Favorite } from "@/domain/types";
import { deleteFavorite, putBackFavorite, reorderFavorites, saveFavorite } from "@/store/actions";
import { useActiveMonth } from "@/store/hooks";
import { useAppStore } from "@/store";
import { BackButton } from "../setup/BackButton";

/** Favorites (PRD §8.12): reorder, edit and delete one-tap entries. */
export function FavoritesScreen() {
  const navigate = useNavigate();
  const favorites = useAppStore((s) => s.data.favorites);
  const month = useActiveMonth();
  const sorted = [...favorites].sort((a, b) => a.order - b.order);
  const [editing, setEditing] = useState<Favorite | null>(null);
  const [open, setOpen] = useState(false);
  const buckets = month
    ? [...bucketsForHome(month.buckets).spend, ...bucketsForHome(month.buckets).save]
    : [];

  return (
    <Screen>
      <BackButton
        label="Settings"
        onClick={() => {
          void navigate("/settings");
        }}
      />
      <h1 className="mt-2 text-title text-text-1">Favorites</h1>
      <p className="mt-2 text-callout text-text-2">
        One tap logs them from Home. Onyx offers to save something as a favorite after you log it
        three times.
      </p>

      {sorted.length === 0 ? (
        <div className="mt-section flex flex-col items-center rounded-card border border-dashed border-hairline-strong px-6 py-8 text-center">
          <Star aria-hidden="true" className="size-8 text-text-3" />
          <p className="mt-3 text-body text-text-1">No favorites yet</p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={sorted.map((f) => f.id)}
          onReorder={reorderFavorites}
          className="mt-section flex flex-col gap-2"
        >
          {sorted.map((f) => (
            <FavoriteRow
              key={f.id}
              favorite={f}
              bucket={buckets.find((b) => b.id === f.bucketId)}
              onOpen={() => {
                setEditing(f);
                setOpen(true);
              }}
            />
          ))}
        </Reorder.Group>
      )}

      {editing && (
        <Sheet open={open} onOpenChange={setOpen} title={`Edit ${editing.label}`}>
          <FavoriteForm
            key={editing.id}
            favorite={editing}
            buckets={buckets}
            onDone={() => {
              setOpen(false);
            }}
          />
        </Sheet>
      )}
    </Screen>
  );
}

function FavoriteRow({
  favorite,
  bucket,
  onOpen,
}: {
  favorite: Favorite;
  bucket: Bucket | undefined;
  onOpen: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={favorite.id}
      dragListener={false}
      dragControls={controls}
      className="flex items-center rounded-inner border border-hairline bg-surface-1"
      whileDrag={{ scale: 1.02 }}
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
        className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-3 pr-4 text-left"
      >
        <span aria-hidden="true" className="text-[20px]">
          {favorite.emoji ?? "⭐"}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body text-text-1">{favorite.label}</span>
          <span className={bucket ? "text-caption text-text-3" : "text-caption text-warning"}>
            {bucket ? bucket.name : "Needs a bucket this month"}
          </span>
        </span>
        <Amount value={favorite.amount} size="headline" />
      </button>
    </Reorder.Item>
  );
}

function FavoriteForm({
  favorite,
  buckets,
  onDone,
}: {
  favorite: Favorite;
  buckets: Bucket[];
  onDone: () => void;
}) {
  const toast = useToast();
  const [label, setLabel] = useState(favorite.label);
  const [bucketId, setBucketId] = useState(favorite.bucketId);
  const [input, setInput] = useState(paiseToInput(favorite.amount));
  const [fresh, setFresh] = useState(true);
  const result = evaluate(input);
  const canSave = result.ok && label.trim() !== "" && buckets.some((b) => b.id === bucketId);

  return (
    <div className="flex flex-col gap-3 pb-2">
      <TextField
        label="Name"
        hideLabel
        placeholder="e.g. Metro"
        value={label}
        maxLength={40}
        onChange={(e) => {
          setLabel(e.target.value);
        }}
      />
      <div
        role="group"
        aria-label="Bucket"
        className="relative -mx-screen flex gap-2 overflow-x-auto px-screen py-1 [scrollbar-width:none]"
      >
        {buckets.map((b) => (
          <Chip
            key={b.id}
            color={b.color}
            leading={b.emoji}
            selected={b.id === bucketId}
            onClick={() => {
              setBucketId(b.id);
            }}
          >
            {b.name}
          </Chip>
        ))}
      </div>
      <AmountInputDisplay input={input} selected={fresh} className="py-2" />
      <Keypad
        onKey={(key) => {
          setInput((i) => applyKeyToSaved(i, key, fresh));
          setFresh(false);
        }}
        canSubmit={canSave}
        onSubmit={() => {
          if (!result.ok || !canSave) return;
          const bucket = buckets.find((b) => b.id === bucketId);
          saveFavorite({
            ...favorite,
            label,
            bucketId,
            amount: result.value,
            ...(bucket ? { emoji: bucket.emoji } : {}),
          });
          onDone();
        }}
      />
      <Button
        variant="ghost"
        className="self-center text-negative"
        onClick={() => {
          const removed = deleteFavorite(favorite.id);
          onDone();
          if (removed) {
            toast.show({
              tone: "info",
              message: `${removed.label} removed from favorites`,
              action: {
                label: "Undo",
                onAction: () => {
                  putBackFavorite(removed);
                },
              },
            });
          }
        }}
      >
        <Trash2 aria-hidden="true" className="size-4" />
        Delete favorite
      </Button>
    </div>
  );
}
