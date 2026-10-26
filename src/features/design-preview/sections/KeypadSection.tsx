import { useState } from "react";
import { AmountInputDisplay } from "@/components/AmountInputDisplay";
import { Keypad } from "@/components/Keypad";
import { useToast } from "@/components/toast-context";
import { applyKey, evaluate } from "@/domain/expression";
import { formatAmount } from "@/domain/money";
import { PreviewSection } from "../PreviewSection";

export function KeypadSection() {
  const [input, setInput] = useState("250+180");
  const toast = useToast();
  const result = evaluate(input);

  return (
    <PreviewSection id="keypad" title="Keypad" note="Try it: maths works, e.g. 250+180.">
      <div className="rounded-card border border-hairline bg-surface-1 p-4">
        <AmountInputDisplay input={input} className="py-4" />
        <Keypad
          className="mt-3"
          canSubmit={result.ok}
          onKey={(key) => {
            setInput((current) => applyKey(current, key));
          }}
          onSubmit={() => {
            if (!result.ok) return;
            toast.show({ message: `Saved ${formatAmount(result.value)}` });
            setInput("");
          }}
        />
      </div>
    </PreviewSection>
  );
}
