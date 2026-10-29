# Progress

Where we are, what we decided, and ideas for later. Updated at the end of every phase so a new session can pick up exactly where we left off.

**Current status:** **All 8 phases built (version 1.0.0).** Backup round trip tested on the iPhone. Still to check on the phone: airplane mode (Phase 4) and the PIN. 244 unit, 69 screen and 5 PWA tests passing.

## Checklist (PRD §14)

### Step 1: Get set up
- [x] Read PRD.md and the inspiration images
- [x] Git repository and .gitignore
- [x] CLAUDE.md
- [x] PROGRESS.md
- [x] PRD questions answered and PRD.md updated
- [x] Phase 1 plan approved

### Phase 1: Foundation
- [x] Scaffold project and tooling (Vite, React, TS strict, Tailwind v4, ESLint, Prettier, Vitest, Playwright)
- [x] Design tokens (`tokens.css`) and bundled Inter font
- [x] App shell: dark base, safe areas, glass tab bar (tabs are placeholders)
- [x] Design preview page at `/#/design` (dev only):
  - [x] Colors and type scale
  - [x] Buttons, chips, segmented control, cards
  - [x] Month tank, bucket vials, liquid fill, quick-log chip, piggy peek, entry rows (Liquid direction)
  - [x] Keypad, bottom sheet, toast, tab bar
  - [x] Pig illustration with fill animation
- [x] **Design preview approved by the user** (Liquid direction)
- [x] Domain logic in `src/domain/` with unit tests: all §7.5 examples (1–13) and the §13 edge cases that are maths. Files: money, expression, dates, budget, totals, piggy, recurring, rollover, setup, suggestions, schema, migrations, backup, state, types.
- [x] Saved store with schema version (Zustand persist + idb-keyval), safety copy, splash screen, load-error screen, failed-save toast
- §13 edge cases left for their screens: "recap within a minute of midnight" (Phase 6 timer; the month check itself is tested) and "saving fails" toast (wired up; tested at the storage level).

### Phase 2: Monthly setup and Home
- [x] First launch (welcome, name). Install guide and `navigator.storage.persist()` are Phase 4.
- [x] Monthly setup flow: budget (with the "rest of October" note on a mid-month first launch, and "Same as last month" once there is a last month), buckets (add, edit, delete, drag to reorder, emoji, color, kind), unallocated / over-allocated footer, Start.
- [x] Home: greeting, month tank, Spend and Save vials, Recent (with an empty state). Quick log is Phase 3; Due now and Coming up Phase 6; Piggy peek Phase 5; the eye (blur) Phase 8.
- [x] Bucket detail: tank in the bucket's color with pace notch and status pill, pace in words, upcoming recurring, entries by day with day totals.
- [x] Edit bucket (sheet): name, emoji, color, kind, amount; delete only when empty, otherwise move entries first.
- [x] Playwright: the core first-launch loop (welcome → setup → Home → reload keeps data), over-allocation, bucket detail, edit and move-then-delete. Dev-only `/#/dev/seed` fills a sample month for screenshots until Quick add exists.

### Phase 3: Quick add
- [x] Keypad with math (safe parser): "250 + 180" shows small, ₹430 large; saved amounts type over
- [x] Destination chips: buckets (spend then save). Piggy destinations come with piggies in Phase 5.
- [x] Note suggestions (up to 3; picking one chooses its usual bucket)
- [x] Favorites: "Save as favorite?" after 3 times in 30 days (asked once), one-tap row in Quick add and on Home. Managing favorites is Settings, Phase 8.
- [x] Money back
- [x] Date picker (1st of the month to today)
- [x] Edit and delete, each with Undo
- [x] Heads-ups at 80% and 100% (once per bucket per month, also after edits)
- [x] Activity list with bucket filters ("See all" on Home). Piggy stashes and spends join it in Phase 5.
- [x] Long-press a vial: Quick add with that bucket; + on a bucket's page preselects it too
- [x] Playwright: core loop (log → see what's left → Undo), heads-up, money back, back-dating, suggestions, edit/delete with Undo, favorites, long-press, activity

### Phase 4: PWA and first install on iPhone
- [x] Manifest, icons and launch images: all generated from `public/icon.svg` (`pwa-assets.config.ts`) at build time
- [x] Offline support: every built file is precached; page loads fall back to the cached app
- [x] Persistent storage request (`navigator.storage.persist()` after data loads)
- [x] Update prompt: "New version available" toast with Refresh, stays until tapped; checks hourly
- [x] Install guide (iPhone/iPad Safari only, "Continue in browser" skips it for good)
- [x] Less-used screens (welcome, setup, bucket detail, activity) load on demand
- [x] `npm run test:pwa`: production-build tests (precache list, service worker control, manifest and icons, install guide, no outside requests)
- [x] **Deployed** to Vercel from the public GitHub repo: https://onyx-rust-one.vercel.app (redeploys on every push to `main`)
- [ ] **Test on the iPhone**: add to Home Screen, airplane mode, update prompt
- [x] **Phone feedback 1** (29 Oct): swipe left to delete entries (with Undo); tap the month tank to change the budget; the note field is now "What was it?" and shows as the entry's name (PRD §17 answer 12). Tested in `tests/e2e/phone-feedback.spec.ts`.

### Phase 5: Piggy banks (§8.6)
- [x] Piggy tab: hero pig per active piggy (swipe sideways, page dots), status pill, "This month: ₹X of ₹Y stashed", All piggies list with rings, completed section
- [x] Create/edit piggy (full screen), templates, live "₹X/month for N months"
- [x] Stash sheet (prefilled with what's left of the plan) and animation (coin drop, squish, fill), with Undo
- [x] Auto-stash (fixed transaction id per piggy and month, so it can never happen twice)
- [x] Spend from a piggy: from the Piggy tab or as a Quick add destination (expenses only)
- [x] Piggy detail and history (swipe to delete, with Undo); done summary (saved, spent, left) with "move what's left" to another piggy
- [x] Goal reached: confetti, wiggle, "You did it!" (Mark as done / Keep saving)
- [x] Yearly piggies: cycles roll on; "New cycle started" note
- [x] Piggy plans in setup (prefilled with suggestions, editable, ₹0 to skip)
- [x] Empty state (sleeping pig and templates)
- [x] Home: piggy peek (nearest date). Activity: stashes and spends with a pig badge, a Piggies filter
- [x] Playwright: `tests/e2e/phase-5.spec.ts` (11 tests). Dev seed now has 3 piggies; `/#/dev/seed?setup=1` opens setup with piggies

### Phase 6: Recurring, rollover and recap
- [x] Recurring rules (§8.7): list (Settings → Recurring expenses, and "Manage" in Coming up), editor (full screen), auto and ask-first, Due now (Log / Skip), Coming up (with total and "Needs a bucket"); a rule created after its day offers "Log"; delete with Undo
- [x] Month rollover (§8.8): `MonthWatcher` checks on launch, on returning to the app and every minute; closes the month; a backwards clock shows a calm warning and changes nothing. One `appStage` decides welcome → month → recap → setup (`StageGate` in `src/app/gates.tsx`)
- [x] Recap stories: review (confetti when under budget), buckets, highlights, compared with last month (skipped without one), piggies, backup (share sheet / download; records the date only on success), "Plan December →". Reopen any closed month at `/#/recap/2026-11` (Insights links it in Phase 7)
- [x] Smarter setup hints: "Avg ₹X" (last 3 closed months; tap to use) and "Rent ₹X recurring"; "Same as last month" uses the latest earlier month even after a gap
- [x] Leftover to piggy: after the recap, never more than what's left; the closed month keeps its full remaining amount
- [x] Playwright: `tests/e2e/phase-6.spec.ts` (time travel to 28 Nov, 1 Dec and backwards). Dev seed has 3 recurring rules

### Phase 7: Insights and search (§8.9)
- [x] Month switcher (newest first) and summary (left, used of budget, "Closed" for past months)
- [x] Bar chart in custom SVG (`BarChart`): Week (Mon–Sun, today's week; days outside the month are empty) and Month (by day); tap a bar to light it with a value tag; spend buckets only
- [x] Bucket tiles (used, change vs last month: ↑/↓ %, "New") and saved this month (save buckets + piggy stashes)
- [x] Past months: "View recap", "Move leftover to a piggy" (`/#/leftover/:key`), and a read-only month detail (`/#/month/:key`) with "₹X moved to Goa trip" lines; tapping an entry only shows its details
- [x] Search (`/#/search`): names across all months, any part, any capitals; filters for bucket, type and month range; "N entries · ₹X", grouped by month
- [x] Playwright: `tests/e2e/phase-7.spec.ts`. Dev seed now has a closed October

### Phase 8: Privacy, backup and settings
- [x] Privacy blur (§8.10): the eye on Home and Piggy; amounts show as "₹ ••••" everywhere (VoiceOver says "Amount hidden"); "Hide amounts when Onyx opens"
- [x] PIN lock: 4 digits, PBKDF2 (210,000 rounds, random salt) via Web Crypto; locks on launch and on return after Immediately / 1 min / 5 min; 5 wrong tries → 30-second wait; "Forgot PIN?" explains erase + restore; "a privacy screen, not encryption"
- [x] Backup and restore (§8.11): back up now (share sheet, or download), last backup date (amber after 35 days or never), monthly step toggle, restore with zod check and preview, "Replace everything", undo restore, storage used. Restore is also on Welcome, for after an erase or on a new phone
- [x] Settings screen (§8.12): name, recurring, favorites manager (drag to reorder, edit, delete with Undo), privacy, backup, motion (follow iPhone / reduce: `MotionConfig` "always" + `data-motion`), erase all data (type ERASE; removes the safety copy too), about (version from package.json)
- [x] **Tested backups on the real iPhone** (29 Oct): saved to Files, erased, restored from Welcome, undo restore, restored again. All data came back.
- [x] Final polish, accessibility and performance pass: launch JS 240 KB gzipped (budget 250); every icon button has a VoiceOver label; tabs announce the current one
- [x] **Redeployed** (version 1.0.0 live at https://onyx-rust-one.vercel.app)

## Decisions

- **App name:** Onyx.
- **Git:** the user runs every `git add` and `git commit`. Claude never does; it says when a phase is ready and suggests a message.
- **Terminal:** Cursor's terminal runs WSL (Linux), so commands are Linux commands.
- **Public GitHub repo** (user's choice). `design/inspo/` is in .gitignore and stays local, since those images are other people's designs.
- **Package manager:** npm (comes with Node, simplest to use).
- **Language:** TypeScript only. Python was considered and dropped completely (a browser app on iPhone can only run JavaScript well).
- **Library versions:** exact versions, each the newest release at least two weeks old (as of 26 Oct 2026). TypeScript stays on 6.0.x because typescript-eslint doesn't support 7 yet.
- **Extra helpers approved:** clsx, tailwind-merge, class-variance-authority (shadcn/ui style helpers), fake-indexeddb (tests only), @types/node (config only).
- **Bottom sheet:** custom Motion sheet on top of Radix Dialog (not vaul), for full control of springs, drag-to-dismiss and keyboard handling.
- **Screenshots:** Playwright uses WebKit (Safari's engine) at iPhone sizes.
- **Design preview** at `/#/design` exists only in the dev server, not in the deployed app (checked: not in the build).
- **vitest is 5.0.5**, 11 days old: an exception to the two-week rule, because 5.0.4 makes npm crash on a peer-dependency clash with Vite's optional devtools.
- **Node:** WSL has Node 22.14; React Router 8.4 asks for 22.22+. It works for now (browser code), but upgrade Node before Phase 4.
- **tailwind-merge** is taught our token names in `src/lib/cn.ts` (otherwise it drops sizes like `text-display`). A test guards this.
- **Tailwind defaults switched off** (colors, text sizes, radii, shadows), so only design tokens can be used.
- **Design direction "Liquid":** the first design copied the inspo too closely; the user picked "Liquid" from three concepts (Liquid, Ledger, Dial). PRD §8.3, §9 and §10 updated. Tokens: `--accent-a/b/c` replaced by `--liquid` and `--accent`; new `text-hero`, `rounded-tank`, `rounded-vial`.
- **Privacy and backup decisions (Phase 8):**
  - The eye hides amounts in buttons and toasts too, except the keypad's own display while typing.
  - The lock screen appears on launch whenever a PIN is set (the timeout only applies when returning to the app).
  - The cooldown after 5 wrong tries lasts for this session (closing and reopening Onyx starts the count again).
  - "Erase all data" also deletes the restore safety copy, so a forgotten PIN can't be got around with "Undo restore".
  - Restore lives in Settings → Backup and on the Welcome screen.
  - Possible later saving: the data check could use `zod/mini` (smaller) if the launch size ever passes 250 KB.
- **Insights decisions (Phase 7):**
  - A day's bar is expenses minus money back in spend buckets. A day with more money back than spent shows its tag as "+₹X" in green, never as a red minus.
  - A past month's chart starts on its last day; the current month's on today.
  - Search starts empty ("Search names across every month") and shows results once you type or pick a filter. Its total is expenses minus money back.
  - The tab bar keeps each tab lit inside its own screens (search and month detail light Insights) and tells VoiceOver which tab is current.
- **Month-end decisions (Phase 6):**
  - "Biggest expense" and "most-used bucket" count spend buckets only (a fixed deposit isn't spending).
  - The recap's Piggies card shows every piggy that existed that month, even with ₹0 stashed.
  - The comparison shows ↑/↓ and a percentage in neutral grey (no red/green judgement); buckets new this month show "New".
  - The leftover step appears only if the month ended above ₹0 and there's an active piggy; otherwise the recap goes straight to setup.
  - The recap's backup card uses the share sheet where it can, otherwise downloads the file. Full backup and restore settings are Phase 8.
- **Piggy decisions (Phase 5):**
  - Templates: only Insurance is yearly, as the PRD lists it (Birthday and Diwali are one-time; changeable).
  - A yearly piggy needs a date.
  - Auto-stash stashes what's left of the month's plan, once. A piggy created this month starts auto-stashing next month.
  - "Move what's left" from a done piggy is a spend from it plus an opening amount on the other, never a stash, so the month isn't touched.
  - Piggy spends are logged through Quick add but aren't editable there; tap them to open the piggy, swipe to delete.
  - In Activity a stash shows as −₹ (money out of the month); in a piggy's history it shows as +₹.
- **App icon:** the pig filled with pink liquid on near-black, with a soft pink glow (`public/icon.svg`). Launch screens are black with the icon small in the middle.
- **Offline (fixed 29 Oct):** the service worker listed `manifest.webmanifest` twice with different revisions, so Workbox refused to install it ("add-to-cache-list-conflicting-entries") and Onyx didn't work offline on the iPhone. In Phase 4 the Chromium offline test showed this, and it was wrongly put down to Playwright. Now `globPatterns` leaves the manifest to the plugin, `tests/pwa/offline.spec.ts` fails on any duplicate, and `tests/pwa/offline-reload.spec.ts` does a real no-network reload (Chromium). Also: iPhone resumes home-screen apps without reloading, so Onyx now checks for a new version whenever it comes back to the front, registers the service worker straight away, says "Onyx is ready to work offline" once it is, and Settings → About shows Offline: Ready / Not ready yet.
- **Install guide only on iPhone/iPad** (not on the laptop), and the Playwright tests pretend to be the installed app.
- **Heads-ups ride on the "logged" toast** ("₹1,200 logged to Food. 80% of Food used.", amber icon) so Undo is never lost behind a second toast.
- **"Save as favorite?" is asked once**: showing it counts as asking, whether or not Save is tapped. It waits until the Undo toast has gone.
- **Toasts move to the top** of the screen while a sheet is open, so they never cover the keypad.
- **The keypad never hides** while typing a note: the sheet sits above the iOS keyboard and scrolls instead. Swapping the keypad for a button made the layout jump and swallowed taps.
- **A short ✓ (320 ms)** shows when saving, then the sheet closes (PRD §8.4 success animation).
- **Typing over a saved amount:** when an amount is already set (editing a bucket, going back to the budget), it shows highlighted and the first digit replaces it, like selected text; ⌫ and + / − edit it instead.
- **Bucket names** must be unique in a month (ignoring capitals), up to 24 characters.
- **Emoji picker:** 36 common emoji plus a field for any emoji from the iOS keyboard. No library.
- **Edit bucket is a sheet**, opened from bucket detail (same editor as setup).
- **Day totals:** spent shows as −₹, a day with more money back as +₹ (PRD §17 answer 10).
- **Opening balance counts as start-of-month money** for piggy suggestions, like leftover moves (PRD §7.4 only named leftovers). Otherwise "Already saved ₹X" wouldn't lower the monthly suggestion.
- **Days left includes today** (PRD §7.1): 18 of 30 November is 13 days left. The design samples now use the domain function.
- **Saved store never overwrites data it couldn't load:** writes are blocked until saved data has loaded and passed the zod check. Newer-version or damaged data shows a calm screen ("Nothing has been changed or deleted") and stays untouched. Before an upgrade, the raw old data is copied to `onyx-before-upgrade`; the restore safety copy lives under `onyx-safety-copy`, outside AppState (PRD §11).
- **Save status lives in its own small store**, so reporting a failed save can never trigger another save.
- **Heads-ups:** if one entry jumps past both 80% and 100%, only the 100% toast shows, and both are recorded.
- **Yearly piggy cycles** skip ahead several years if the app wasn't opened; a 29 Feb target lands on 28 Feb in non-leap years.
- **Bundle:** 240 KB gzipped at launch at 1.0.0 (budget 250). 233 KB after Phase 6. About 231 KB after Phase 4 (welcome, setup, bucket detail and activity now load on demand; budget 250). Was 201 KB after Phase 1; zod added ~35 KB. `zod/mini` is an option later if size gets tight.
- **Save bucket over plan:** big number shows "+₹1,000" in normal white, with "extra put away" (user confirmed).
- **Status-bar fade:** a soft gradient under the status bar so scrolled content doesn't clash with the clock.
- **Toast** is near-solid (`surface-2` at 95% + blur), not glass, so its text stays readable over busy content.
- **Save bucket over plan** shows the big number as "+₹1,000" in normal color with "extra put away" underneath. (To confirm with the user.)
- **Hero footer** shows only "13 days left" (no per-day amount).
- **Initial JS** ~166 KB gzipped (budget 250 KB).
- **No per-day amounts** ("safe per day", "safe today") anywhere. They create anxiety. Show only what's left.
- **Saving more than planned** in a save bucket shows "₹X extra put away", never red.
- **Piggy plan beats suggestion** for the Stash button and monthly progress.
- **Yearly piggies:** a new cycle starts the day after the old target date, and its maths counts from there. First version.
- **Leftover money** ends with its month. The optional "move leftover into a piggy" step stays, and the moved money counts as start-of-month money for that piggy.
- **`--text-3`** is `#83838D` (the PRD's `#6B6B75` failed AA contrast).

See PRD §17 for the full answers.

## Decisions to make later

Small details, parked until the phase that needs them. Until then, use the default shown.

| # | Question (in plain words) | Default for now | Phase |
|---|---|---|---|
| a | A bucket with a ₹0 budget: when should the "you've used 80% / 100%" heads-up appear? | No pace warning. The 100% heads-up shows on its first expense. | 3 |
| b | If I log an expense for an earlier day, what time should it show? | The current time of day. | 3 |
| c | The weekly spending chart: a week can start in one month and end in the next. Show the other month's days? | No, only days in the selected month. | 7 |
| d | Is there a maximum monthly budget? | ₹1,00,00,000, the same as the per-entry limit. | 2 |
| e | If I travel to another time zone, could an entry move to a different month? | No. Times are saved as local time without a time zone, so they never shift. | 1 |
| f | Month-end comparison "Food +12% vs last month": what if the bucket is new, or was ₹0 last month? | Show "New". | 6 |
| g | The design preview page: should it be in the live app too, or only on the dev server? | Dev server only. | 1 |

## Ideas for later

- **Add a bucket mid-month** from Home or bucket detail. The PRD only adds buckets in setup; right now a new bucket waits for next month's setup.
