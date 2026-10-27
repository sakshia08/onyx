import { Pencil } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Screen } from "@/app/Screen";
import { Button } from "@/components/Button";
import { SectionHeader } from "@/components/SectionHeader";
import { groupEntriesByDay } from "@/domain/activity";
import { bucketUsed } from "@/domain/budget";
import { dayInMonth, dayKeyOfDate, daysInMonth, monthName } from "@/domain/dates";
import { upcomingForBucket } from "@/domain/recurring";
import { deleteBucket, moveEntriesAndDelete, saveBucket } from "@/store/actions";
import { useActiveMonth, useNow } from "@/store/hooks";
import { useAppStore } from "@/store";
import { BackButton } from "../setup/BackButton";
import { DayGroups } from "../entries/EntryList";
import { BucketEditorSheet } from "./BucketEditorSheet";
import { BucketTank } from "./BucketTank";
import { PaceNote } from "./PaceNote";

/** Bucket detail (PRD §8.5): the bucket's tank, its pace, and its entries by day. */
export function BucketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const month = useActiveMonth();
  const rules = useAppStore((s) => s.data.recurring);
  const now = useNow();
  const [editorOpen, setEditorOpen] = useState(false);
  const goHome = () => {
    void navigate("/");
  };

  const bucket = month?.buckets.find((b) => b.id === id);
  if (month === null || bucket === undefined) {
    return (
      <Screen>
        <BackButton label="Home" onClick={goHome} />
        <p className="mt-6 text-body text-text-2">
          This bucket isn't in {month ? monthName(month.key) : "this month"}.
        </p>
      </Screen>
    );
  }

  const today = dayInMonth(month.key, now);
  const days = daysInMonth(month.key);
  const used = bucketUsed(month.entries, bucket.id);
  const entries = month.entries.filter((e) => e.bucketId === bucket.id);
  const upcoming = upcomingForBucket(rules, month, today, bucket.id);
  const others = month.buckets.filter((b) => b.id !== bucket.id);

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <BackButton label="Home" onClick={goHome} />
        <Button
          variant="ghost"
          size="md"
          className="-mr-3"
          onClick={() => {
            setEditorOpen(true);
          }}
        >
          <Pencil aria-hidden="true" className="size-4" />
          Edit
        </Button>
      </div>
      <h1 className="mt-2 flex items-center gap-2.5 text-title text-text-1">
        <span aria-hidden="true">{bucket.emoji}</span>
        {bucket.name}
      </h1>

      <BucketTank className="mt-5" bucket={bucket} used={used} today={today} days={days} />
      <PaceNote
        className="mt-4"
        bucket={bucket}
        used={used}
        today={today}
        days={days}
        monthKey={month.key}
        upcoming={upcoming}
      />

      <SectionHeader title="Entries" className="mt-section" />
      {entries.length === 0 ? (
        <p className="rounded-card border border-dashed border-hairline-strong px-5 py-5 text-callout text-text-2">
          Nothing in {bucket.name} yet. Tap + to log an expense here.
        </p>
      ) : (
        <DayGroups groups={groupEntriesByDay(entries, dayKeyOfDate(now))} buckets={month.buckets} />
      )}

      <BucketEditorSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        bucket={bucket}
        isNew={false}
        others={others}
        entryCount={entries.length}
        onSave={(saved) => {
          saveBucket(month.key, saved);
          setEditorOpen(false);
        }}
        onDelete={() => {
          setEditorOpen(false);
          deleteBucket(month.key, bucket.id);
          goHome();
        }}
        onMoveAndDelete={(toId) => {
          setEditorOpen(false);
          moveEntriesAndDelete(month.key, bucket.id, toId);
          void navigate(`/bucket/${toId}`, { replace: true });
        }}
      />
    </Screen>
  );
}
