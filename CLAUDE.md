# Onyx

Personal monthly budget PWA for iPhone. Split each month's budget into spend/save buckets, log expenses in ~3 seconds, save across months in piggy banks. 100% offline and private. Dark, premium, native-iPhone feel.

**PRD.md is the source of truth.** Read the relevant section before building anything. Progress, decisions and ideas live in PROGRESS.md: read it at the start of a session, update it at the end of every phase.

## The user
Not an experienced developer. Explain simply, don't assume tool knowledge. Works on Windows in Cursor, with the terminal running **WSL** (Linux): give commands for that. Opening the dev server on the iPhone needs WSL port forwarding / Windows Firewall steps.

## Stack (PRD §12, ask before adding any other library)
Vite + React + TypeScript (strict) · Tailwind CSS v4 · shadcn/ui (Radix, restyled) · Motion (`motion/react`) · lucide-react · Zustand + persist → IndexedDB (`idb-keyval`) · zod · date-fns · React Router (hash) · canvas-confetti · `@fontsource-variable/inter` · vite-plugin-pwa · Vitest · Playwright · ESLint + Prettier

## Commands
- `npm install`: install dependencies
- `npm run dev`: dev server (`npm run dev -- --host` to open on the iPhone over Wi-Fi)
- `npm run typecheck` · `npm run lint` · `npm test` (Vitest) · `npm run test:e2e` (Playwright)
- `npm run build` · `npm run preview`

## Rules
- Offline and private: no backend, accounts, AI, API keys, analytics, external fonts or CDNs. No runtime network requests except loading the app.
- Money is always integer paise. Never use floating-point maths for money.
- All PRD §7 rules and calculations live in plain TypeScript in `src/domain/`, no React.
- Every §7.5 worked example and §13 edge case has a unit test.
- Past months are read-only.
- TypeScript strict, no `any`. Small, focused components with clear names.
- Saved data must never be lost: data shape is versioned (`schemaVersion`); every change gets a migration and a test.
- One phase at a time (PRD §14). Never start the next phase without the user's go-ahead.
- PRD unclear? Ask. Don't guess or quietly change a requirement.
- Good idea not in the PRD? Add it to "Ideas for later" in PROGRESS.md. Don't build it.

## Before calling a phase done
1. Typecheck, lint and all tests pass.
2. Playwright screenshots of every touched screen at 390×844 (main screens also at 375 and 430 wide). Review them against PRD §10 and fix anything off.
3. Plain-language summary, decisions and a short "things to try" list for the user.
4. Update PROGRESS.md and suggest a commit message.

**Never run `git add` or `git commit`.** The user does all adds and commits.

## Design rules (PRD §10)
- Use only the tokens in `src/styles/tokens.css` (from §10.2–10.4). No one-off colors or sizes.
- Design direction **"Liquid"** (§10.1): money is liquid in containers, like the pig's fill. Month tank drains, bucket vials drain (spend) or fill (save). Near-black `--bg`, one soft glow at the top, everything else quiet. Don't copy the inspo.
- Depth from layered surfaces and hairlines, not heavy shadows. Glass for tab bar, sheet headers, sticky footers.
- 4px grid, 20px screen padding, 28px between sections. Radii: 24 cards, 16 inner, full pills.
- Numbers: tabular-nums, ₹ at ~55% size in `--text-2`, paise only when non-zero in `--text-3`, `en-IN` grouping.
- Red (`--negative`) is only for negative balances (never for saving more than planned). Money back is green. Negatives always have a minus sign and "Over by".
- No per-day spending amounts anywhere (PRD §7.2).
- Safe areas (`env(safe-area-inset-*)`), `100dvh`, tap targets ≥ 44px, input font ≥ 16px.
- Springs for sheets/layout (stiffness 400, damping 36), 150–250ms fades. Respect reduced motion (fades instead of movement).
- The pig (§10.6) is custom SVG line art, cute and drawn with care. It's the app's personality.
- WCAG AA contrast. VoiceOver labels on every icon button.
