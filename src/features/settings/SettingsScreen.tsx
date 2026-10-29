import { Archive, Info, Lock, Repeat, Sparkles, Star, Trash2, User } from "lucide-react";
import { useState } from "react";
import { Screen } from "@/app/Screen";
import { Button } from "@/components/Button";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Sheet } from "@/components/Sheet";
import { TextField } from "@/components/TextField";
import { Toggle } from "@/components/Toggle";
import { isBackupOverdue } from "@/domain/backup";
import { changeSettings, setProfileName } from "@/store/actions";
import { useAppStore } from "@/store";
import { EraseSheet } from "./EraseSheet";
import { lastBackupShort } from "./backup-text";
import { SettingsGroup, SettingsRow } from "./SettingsRow";

const MOTION = [
  { value: "system", label: "Follow iPhone" },
  { value: "reduced", label: "Reduce" },
] as const;

/** Settings (PRD §8.12). */
export function SettingsScreen() {
  const data = useAppStore((s) => s.data);
  const [nameOpen, setNameOpen] = useState(false);
  const [eraseOpen, setEraseOpen] = useState(false);
  const overdue = isBackupOverdue(data.meta.lastBackupAt, new Date());

  return (
    <Screen>
      <h1 className="text-title text-text-1">Settings</h1>

      <SettingsGroup title="You">
        <SettingsRow
          icon={<User className="size-5" />}
          label="Your name"
          value={data.profile.name ?? "Not set"}
          onClick={() => {
            setNameOpen(true);
          }}
        />
      </SettingsGroup>

      <SettingsGroup title="Money">
        <SettingsRow
          icon={<Repeat className="size-5" />}
          label="Recurring expenses"
          value={data.recurring.length > 0 ? String(data.recurring.length) : ""}
          to="/recurring"
        />
        <SettingsRow
          icon={<Star className="size-5" />}
          label="Favorites"
          value={data.favorites.length > 0 ? String(data.favorites.length) : ""}
          to="/settings/favorites"
        />
      </SettingsGroup>

      <SettingsGroup title="Privacy">
        <div className="p-2">
          <Toggle
            label="Hide amounts when Onyx opens"
            description="Tap the eye on Home to show them"
            checked={data.settings.hideAmountsOnOpen}
            onChange={(hideAmountsOnOpen) => {
              changeSettings({ hideAmountsOnOpen });
            }}
          />
        </div>
        <SettingsRow
          icon={<Lock className="size-5" />}
          label="PIN lock"
          value={data.settings.pin ? "On" : "Off"}
          to="/settings/pin"
        />
      </SettingsGroup>

      <SettingsGroup title="Backup">
        <SettingsRow
          icon={<Archive className="size-5" />}
          label="Backup and restore"
          value={lastBackupShort(data.meta.lastBackupAt)}
          tone={overdue ? "warning" : "default"}
          to="/settings/backup"
        />
      </SettingsGroup>

      <SettingsGroup title="Motion" note="Reduce replaces movement with gentle fades.">
        <div className="flex items-center gap-3 px-4 py-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-inner bg-surface-2 text-text-1"
          >
            <Sparkles className="size-5" />
          </span>
          <SegmentedControl
            label="Motion"
            options={MOTION}
            value={data.settings.motion}
            onChange={(motion) => {
              changeSettings({ motion });
            }}
            className="flex-1"
          />
        </div>
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          icon={<Trash2 className="size-5" />}
          label="Erase all data"
          tone="danger"
          onClick={() => {
            setEraseOpen(true);
          }}
        />
      </SettingsGroup>

      <SettingsGroup title="About" note="Works offline. Your data never leaves this phone.">
        <SettingsRow
          icon={<Info className="size-5" />}
          label="Onyx"
          value={`Version ${__APP_VERSION__}`}
        />
      </SettingsGroup>

      <NameSheet open={nameOpen} onOpenChange={setNameOpen} current={data.profile.name ?? ""} />
      <EraseSheet open={eraseOpen} onOpenChange={setEraseOpen} />
    </Screen>
  );
}

function NameSheet({
  open,
  onOpenChange,
  current,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Your name">
      <NameForm
        current={current}
        onDone={() => {
          onOpenChange(false);
        }}
      />
    </Sheet>
  );
}

function NameForm({ current, onDone }: { current: string; onDone: () => void }) {
  const [name, setName] = useState(current);
  const save = () => {
    setProfileName(name);
    onDone();
  };
  return (
    <form
      className="flex flex-col gap-4 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <TextField
        label="What should I call you?"
        placeholder="Your name (optional)"
        autoComplete="given-name"
        maxLength={40}
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
      />
      <Button type="submit" size="lg">
        Save
      </Button>
    </form>
  );
}
