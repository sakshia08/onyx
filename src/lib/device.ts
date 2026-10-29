/** Running as the installed Home Screen app rather than in a Safari tab. */
export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

/** An iPhone or iPad (iPads report themselves as Macs, but have touch). */
export function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/**
 * Asks iOS not to clear this app's data when the phone runs low on space (PRD §8.1).
 * Safe to call on every launch.
 */
export async function askToKeepData(): Promise<void> {
  try {
    // Older iOS versions don't have this; the catch below covers that
    if (!(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    // Not supported: nothing to do, backups are the safety net (PRD §8.11)
  }
}
