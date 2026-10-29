import type { Page } from "@playwright/test";

/** iPhone widths to check (PRD §10.8). */
export const WIDTHS = [375, 390, 430] as const;

/**
 * Makes a desktop browser look like an iPhone 15 for screenshots:
 * safe-area insets for the Dynamic Island and home indicator, plus outlines of both,
 * so we can see whether anything collides with them.
 */
export async function simulateIPhone(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Behave like the installed Home Screen app, so the Safari install guide stays out of the way
    Object.defineProperty(navigator, "standalone", { value: true, configurable: true });
    const apply = () => {
      const root = document.documentElement;
      root.style.setProperty("--safe-top", "59px");
      root.style.setProperty("--safe-bottom", "34px");
      if (document.getElementById("__iphone")) return;
      const overlay = document.createElement("div");
      overlay.id = "__iphone";
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML = `
        <div style="position:fixed;top:11px;left:50%;transform:translateX(-50%);width:125px;height:37px;border-radius:20px;background:#000;z-index:9999"></div>
        <div style="position:fixed;top:16px;left:34px;font:600 17px -apple-system,'Inter Variable',sans-serif;color:#f5f5f7;z-index:9999">9:41</div>
        <div style="position:fixed;bottom:8px;left:50%;transform:translateX(-50%);width:139px;height:5px;border-radius:3px;background:#f5f5f7;z-index:9999"></div>`;
      document.body.appendChild(overlay);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply);
    else apply();
  });
}

export async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
}
