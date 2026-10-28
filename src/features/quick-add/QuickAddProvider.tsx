import { useMemo, useRef, useState } from "react";
import type { Entry, ID } from "@/domain/types";
import { QuickAddContext, type QuickAddApi } from "./quick-add-context";
import { QuickAddSheet, type QuickAddRequest } from "./QuickAddSheet";

/** Holds the one Quick add sheet, so any screen can open it. */
export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<QuickAddRequest>({ mode: "add", session: 0 });
  const [open, setOpen] = useState(false);
  const session = useRef(0);

  const api = useMemo<QuickAddApi>(
    () => ({
      openAdd: (bucketId?: ID) => {
        session.current += 1;
        setRequest({ mode: "add", session: session.current, ...(bucketId ? { bucketId } : {}) });
        setOpen(true);
      },
      openEdit: (entry: Entry) => {
        session.current += 1;
        setRequest({ mode: "edit", session: session.current, entry });
        setOpen(true);
      },
    }),
    [],
  );

  return (
    <QuickAddContext value={api}>
      {children}
      <QuickAddSheet open={open} onOpenChange={setOpen} request={request} />
    </QuickAddContext>
  );
}
