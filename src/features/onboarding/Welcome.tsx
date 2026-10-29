import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/Button";
import { PigIllustration } from "@/components/PigIllustration";
import { TextField } from "@/components/TextField";
import { setProfileName } from "@/store/actions";
import { useAppStore } from "@/store";
import { RestoreButton } from "../settings/RestoreButton";
import { FullScreen } from "../setup/FullScreen";

/** First launch (PRD §8.1): the promise, an optional name, then setup. */
export function Welcome() {
  const navigate = useNavigate();
  const savedName = useAppStore((s) => s.data.profile.name ?? "");
  const [name, setName] = useState(savedName);
  const [fill, setFill] = useState(0.06);

  // The pig fills up a little once the screen has settled
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFill(0.62);
    }, 450);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const next = () => {
    setProfileName(name);
    void navigate("/setup");
  };

  return (
    <FullScreen
      footerSpace={160}
      footer={
        <div className="flex flex-col gap-1">
          <Button size="lg" className="w-full" onClick={next}>
            Continue
          </Button>
          {/* After erasing (e.g. a forgotten PIN), or on a new phone: bring a backup back */}
          <RestoreButton variant="ghost" />
        </div>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <PigIllustration progress={fill} width={232} />
        <h1 className="mt-6 text-hero text-text-1">Onyx</h1>
        <p className="mt-2 text-body text-text-2">
          Your money, in buckets.
          <br />
          Private and offline.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        <TextField
          label="What should I call you?"
          placeholder="Your name (optional)"
          autoComplete="given-name"
          enterKeyHint="next"
          maxLength={40}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
      </form>
    </FullScreen>
  );
}
