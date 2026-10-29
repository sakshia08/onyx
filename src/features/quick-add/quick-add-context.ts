import { createContext, useContext } from "react";
import type { Entry, ID } from "@/domain/types";

export interface QuickAddApi {
  /** Opens Quick add, with a bucket already chosen if given (PRD §8.4). */
  openAdd: (bucketId?: ID) => void;
  /** Quick add with a piggy chosen: "Spend from piggy" (PRD §8.6). */
  openSpendFromPiggy: (piggyId: ID) => void;
  /** Opens the same sheet to edit an entry (PRD §8.5). */
  openEdit: (entry: Entry) => void;
}

export const QuickAddContext = createContext<QuickAddApi | null>(null);

export function useQuickAdd(): QuickAddApi {
  const api = useContext(QuickAddContext);
  if (!api) throw new Error("useQuickAdd must be used inside <QuickAddProvider>");
  return api;
}
