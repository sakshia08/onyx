import { Archive, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Screen } from "@/app/Screen";
import { Button } from "@/components/Button";
import { Toggle } from "@/components/Toggle";
import { useToast } from "@/components/toast-context";
import { isBackupOverdue } from "@/domain/backup";
import { shareBackup } from "@/lib/share-backup";
import { backupDone, changeSettings } from "@/store/actions";
import { appStore, useAppStore } from "@/store";
import { BackButton } from "../setup/BackButton";
import { lastBackupText } from "./backup-text";
import { RestoreButton } from "./RestoreButton";

/** Backup and restore (PRD §8.11). */
export function BackupScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const data = useAppStore((s) => s.data);
  const [undoFrom, setUndoFrom] = useState<string | null>(null);
  const [used, setUsed] = useState<string | null>(null);
  const overdue = isBackupOverdue(data.meta.lastBackupAt, new Date());

  const refresh = () => {
    void appStore.getState().safetyCopyTakenAt().then(setUndoFrom);
  };
  useEffect(() => {
    refresh();
    // Not every iOS version can tell; then the line just doesn't show
    try {
      void navigator.storage
        .estimate()
        .then((e) => {
          if (e.usage === undefined) return;
          const kb = e.usage / 1024;
          setUsed(
            kb < 1024
              ? `${String(Math.max(1, Math.round(kb)))} KB`
              : `${(kb / 1024).toFixed(1)} MB`,
          );
        })
        .catch(() => undefined);
    } catch {
      // no storage estimate here
    }
  }, []);

  return (
    <Screen>
      <BackButton
        label="Settings"
        onClick={() => {
          void navigate("/settings");
        }}
      />
      <h1 className="mt-2 text-title text-text-1">Backup and restore</h1>
      <p className="mt-2 text-callout text-text-2">
        Your data lives only in this app. A backup file in the Files app is the only other copy.
      </p>

      <section
        aria-label="Back up"
        className="mt-section rounded-card border border-hairline bg-surface-1 p-5"
      >
        <p className={overdue ? "text-callout text-warning" : "text-callout text-text-2"}>
          {lastBackupText(data.meta.lastBackupAt)}
          {overdue && " · it's been a while"}
        </p>
        <Button
          size="lg"
          className="mt-4 w-full"
          onClick={() => {
            void shareBackup(appStore.getState().data).then((result) => {
              if (result === "shared" || result === "downloaded") {
                backupDone();
                toast.show({ tone: "success", message: "Backup saved" });
              } else if (result === "failed") {
                toast.show({ tone: "error", message: "That didn't work. Try again." });
              }
            });
          }}
        >
          <Archive aria-hidden="true" className="size-5" />
          Back up now
        </Button>
        <ul className="mt-4 flex flex-col gap-1.5 text-caption text-text-3">
          <li>Tap Save to Files, then pick On My iPhone or iCloud Drive.</li>
          <li>You only need your newest backup. You can delete older ones in the Files app.</li>
          <li>Saving to iCloud Drive also protects you if you lose or replace your phone.</li>
        </ul>
      </section>

      <div className="mt-4">
        <Toggle
          label="Monthly backup step"
          description="A backup card at the end of every month's recap"
          checked={data.settings.monthlyBackupStep}
          onChange={(monthlyBackupStep) => {
            changeSettings({ monthlyBackupStep });
          }}
        />
      </div>

      <section aria-label="Restore" className="mt-section flex flex-col gap-2">
        <RestoreButton onRestored={refresh} />
        {undoFrom !== null && (
          <Button
            variant="ghost"
            size="lg"
            onClick={() => {
              void appStore
                .getState()
                .undoRestore()
                .then((ok) => {
                  toast.show(
                    ok
                      ? { tone: "success", message: "Back to how it was before the restore" }
                      : { tone: "error", message: "Nothing to undo" },
                  );
                });
            }}
          >
            <RotateCcw aria-hidden="true" className="size-5" />
            Undo restore
          </Button>
        )}
      </section>

      {used !== null && (
        <p className="mt-section px-1 text-caption text-text-3">
          Onyx is using {used} on this phone.
        </p>
      )}
    </Screen>
  );
}
