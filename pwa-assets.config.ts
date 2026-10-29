import {
  createAppleSplashScreens,
  defineConfig,
  minimal2023Preset,
} from "@vite-pwa/assets-generator/config";

// The icon already has its dark background, so nothing is padded or made transparent.
const dark = { background: "#09090b", fit: "contain" } as const;

/** App icons and iOS launch screens, all from public/icon.svg (PRD §12.3). */
export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0, resizeOptions: dark },
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: dark },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: dark },
    // Black launch screens with the icon small in the middle, so there's no white flash
    appleSplashScreens: createAppleSplashScreens(
      {
        padding: 0.62,
        resizeOptions: dark,
        linkMediaOptions: { log: true, addMediaScreen: true, xhtml: false },
        png: { compressionLevel: 9, quality: 70 },
      },
      [
        "iPhone 17 Pro Max",
        "iPhone 17 Pro",
        "iPhone Air",
        "iPhone 17",
        "iPhone 16 Pro Max",
        "iPhone 16 Pro",
        "iPhone 16 Plus",
        "iPhone 16",
        "iPhone 16e",
        "iPhone 15 Pro Max",
        "iPhone 15 Pro",
        "iPhone 15",
        "iPhone 14 Plus",
        "iPhone 13 mini",
        "iPhone 11 Pro Max",
        "iPhone 11",
        'iPhone SE 4.7"',
      ],
    ),
  },
  images: ["public/icon.svg"],
});
