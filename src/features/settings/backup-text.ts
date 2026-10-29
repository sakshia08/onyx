import { format } from "date-fns";
import { fromISODate } from "@/domain/dates";
import type { ISODate } from "@/domain/types";

/** "Last backup: 1 Oct", or "Never" (PRD §8.11). */
export function lastBackupText(lastBackupAt: ISODate | undefined): string {
  return lastBackupAt === undefined
    ? "Never backed up"
    : `Last: ${format(fromISODate(lastBackupAt), "d MMM")}`;
}

/** The short version for the Settings row: "18 Nov", or "Never". */
export function lastBackupShort(lastBackupAt: ISODate | undefined): string {
  return lastBackupAt === undefined ? "Never" : format(fromISODate(lastBackupAt), "d MMM");
}
