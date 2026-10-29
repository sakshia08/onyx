import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PRD §12.3: installable, works offline, asks before updating
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      pwaAssets: { config: true, overrideManifestIcons: true },
      manifest: {
        name: "Onyx",
        short_name: "Onyx",
        description: "Your money, in buckets. Private and offline.",
        lang: "en-IN",
        display: "standalone",
        orientation: "portrait",
        start_url: "./",
        scope: "./",
        background_color: "#09090b",
        theme_color: "#09090b",
      },
      workbox: {
        // Everything the app needs, so it opens in airplane mode
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2,webmanifest}"],
        // Launch screens are read by iOS when installing, not by the app
        globIgnores: ["**/apple-splash-*"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5173, strictPort: true },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
