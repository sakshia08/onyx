import { Button } from "@/components/Button";
import { useToast } from "@/components/toast-context";
import { PreviewSection } from "../PreviewSection";

export function SheetSection({ onOpenSheet }: { onOpenSheet: () => void }) {
  const toast = useToast();
  return (
    <PreviewSection
      id="sheet"
      title="Bottom sheet, toast and tab bar"
      note="The sheet opens from here or the + in the tab bar. Drag its top down to close."
    >
      <div className="flex flex-col gap-3">
        <Button variant="secondary" size="lg" className="w-full" onClick={onOpenSheet}>
          Open Quick add sheet
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => {
            toast.show({
              message: "₹430 logged to Food",
              action: {
                label: "Undo",
                onAction: () => {
                  toast.show({ message: "Undone", tone: "info", duration: 1500 });
                },
              },
            });
          }}
        >
          Show toast with Undo
        </Button>
      </div>
    </PreviewSection>
  );
}
