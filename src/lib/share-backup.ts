import { createBackup } from "@/domain/backup";
import type { AppState } from "@/domain/types";

export type ShareResult = "shared" | "downloaded" | "cancelled" | "failed";

/**
 * Saves a backup file (PRD §8.11): the iOS share sheet ("Save to Files") where it can share
 * files, otherwise a download. "cancelled" means nothing was saved.
 */
export async function shareBackup(state: AppState, now = new Date()): Promise<ShareResult> {
  const { filename, text } = createBackup(state, now);
  const file = new File([text], filename, { type: "application/json" });
  try {
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
      return "shared";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    if (!(error instanceof TypeError)) return "failed";
    // TypeError: sharing files isn't supported here, so download instead
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
  return "downloaded";
}
