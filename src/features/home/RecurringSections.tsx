import { CircleAlert } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Amount } from "@/components/Amount";
import { Button } from "@/components/Button";
import { SectionHeader } from "@/components/SectionHeader";
import { bucketTint } from "@/components/bucket-color";
import { useToast } from "@/components/toast-context";
import { format } from "date-fns";
import { fromISODate, isoForDay } from "@/domain/dates";
import { formatAmount, sumPaise } from "@/domain/money";
import { comingUp, dueToAsk } from "@/domain/recurring";
import type { Month } from "@/domain/types";
import { logRule, skipRule } from "@/store/actions";
import { useAppStore } from "@/store";

/** "Due now" (PRD §8.3): "Ask me first" items whose day has come, with Log and Skip. */
export function DueNow({ month, today }: { month: Month; today: number }) {
  const rules = useAppStore((s) => s.data.recurring);
  const toast = useToast();
  const due = dueToAsk(rules, month, today);
  if (due.length === 0) return null;
  return (
    <section aria-label="Due now">
      <SectionHeader title="Due now" className="mt-section" />
      <div className="flex flex-col gap-2">
        {due.map((rule) => {
          const bucket = month.buckets.find((b) => b.id === rule.bucketId);
          return (
            <div
              key={rule.id}
              className="flex items-center gap-3 rounded-card border border-warning/30 bg-surface-1 px-4 py-3"
            >
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-pill text-[18px]"
                style={bucket ? { backgroundColor: bucketTint(bucket.color) } : undefined}
              >
                {bucket?.emoji}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-body text-text-1">{rule.name}</span>
                <Amount value={rule.amount} size="caption" tone="inherit" className="text-text-2" />
              </span>
              <Button
                variant="ghost"
                size="md"
                className="px-3 text-text-2"
                onClick={() => {
                  skipRule(rule.id);
                  toast.show({ tone: "info", message: `${rule.name} skipped this month` });
                }}
              >
                Skip
              </Button>
              <Button
                size="md"
                className="px-4"
                onClick={() => {
                  logRule(rule.id);
                  toast.show({
                    tone: "success",
                    message: `${rule.name} ${formatAmount(rule.amount)} logged`,
                  });
                }}
              >
                Log
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** "Coming up" (PRD §8.3): recurring items still due this month, with their total. */
export function ComingUp({ month, today }: { month: Month; today: number }) {
  const navigate = useNavigate();
  const rules = useAppStore((s) => s.data.recurring);
  const items = comingUp(rules, month, today);
  if (items.length === 0) return null;
  const monthShort = format(fromISODate(isoForDay(month.key, 1)), "MMM");
  const total = sumPaise(items.filter((i) => i.state === "upcoming").map((i) => i.rule.amount));
  return (
    <section aria-label="Coming up">
      <SectionHeader
        title="Coming up"
        className="mt-section"
        trailing={
          <Link
            to="/recurring"
            className="-my-3 inline-flex items-center py-3 text-callout text-text-2"
          >
            {total > 0 ? (
              <>
                <Amount value={total} size="callout" tone="inherit" />
                &nbsp;· Manage
              </>
            ) : (
              "Manage"
            )}
          </Link>
        }
      />
      <div className="overflow-hidden rounded-card border border-hairline bg-surface-1">
        {items.map((item, i) => {
          const bucket = month.buckets.find((b) => b.id === item.rule.bucketId);
          return (
            <button
              key={item.rule.id}
              type="button"
              onClick={() => {
                void navigate(`/recurring/${item.rule.id}`);
              }}
              className={`flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left ${i > 0 ? "border-t border-hairline" : ""}`}
            >
              <span className="w-14 shrink-0 text-caption text-text-3">
                {item.day === today + 1 ? "Tomorrow" : `${String(item.day)} ${monthShort}`}
              </span>
              <span className="min-w-0 flex-1 truncate text-body text-text-1">
                {item.rule.name}
              </span>
              {item.state === "needs-bucket" ? (
                <span className="flex items-center gap-1 text-caption text-warning">
                  <CircleAlert aria-hidden="true" className="size-3.5" />
                  Needs a bucket
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-[15px]">
                    {bucket?.emoji}
                  </span>
                  <Amount value={item.rule.amount} size="callout" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
