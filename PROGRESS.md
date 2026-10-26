# Progress

Where we are, what we decided, and ideas for later. Updated at the end of every phase so a new session can pick up exactly where we left off.

**Current status:** Phase 1 in progress. Liquid design direction chosen and built into the design preview (`/#/design`, full Home mockup at `/#/design/home`). **Waiting for the user's feedback on it.** After approval: domain logic with tests, then the saved store.

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
- [ ] **Design preview approved by the user** (before anything else is built)
- [ ] Domain logic in `src/domain/` with unit tests (all §7.5 examples, §13 edge cases). Started: `money.ts`, `expression.ts` (keypad maths) and part of `budget.ts` exist, with no tests yet.
- [ ] Saved store with schema version (Zustand + IndexedDB)

### Phase 2: Monthly setup and Home
- [ ] First launch (welcome, name)
- [ ] Monthly setup flow (budget, buckets)
- [ ] Home: hero, buckets grid, recent
- [ ] Bucket detail
- [ ] Edit bucket

### Phase 3: Quick add
- [ ] Keypad with math (safe parser)
- [ ] Destination chips
- [ ] Note suggestions
- [ ] Favorites (and "Save as favorite?" suggestion)
- [ ] Money back
- [ ] Date picker
- [ ] Edit and delete with undo
- [ ] Heads-ups at 80% and 100%
- [ ] Activity list

### Phase 4: PWA and first install on iPhone
- [ ] Manifest, icons and launch images
- [ ] Offline support (precache everything)
- [ ] Persistent storage request
- [ ] Update prompt
- [ ] Install guide (Safari only)
- [ ] Deploy (Vercel or Netlify from the public GitHub repo) and test on the iPhone

### Phase 5: Piggy banks (§8.6)
- [ ] Piggy tab hero with the pig and swipe between piggies
- [ ] Create/edit piggy, templates
- [ ] Stash sheet and animation (coin drop, squish, fill)
- [ ] Auto-stash
- [ ] Spend from a piggy
- [ ] Piggy detail and history
- [ ] Goal reached: confetti, wiggle, "You did it!"
- [ ] Yearly piggies
- [ ] Piggy plans in setup
- [ ] Empty state (sleeping pig)

### Phase 6: Recurring, rollover and recap
- [ ] Recurring rules (§8.7): auto and ask-first, Due now, Coming up
- [ ] Month rollover (§8.8)
- [ ] Recap stories
- [ ] Smarter setup hints (3-month averages, recurring amounts)
- [ ] Leftover to piggy

### Phase 7: Insights and search (§8.9)
- [ ] Month switcher and summary
- [ ] Bar chart (week and month views)
- [ ] Bucket tiles and saved this month
- [ ] Past month detail (read-only)
- [ ] Search with filters

### Phase 8: Privacy, backup and settings
- [ ] Privacy blur (§8.10)
- [ ] PIN lock
- [ ] Backup and restore, safety copy, undo restore (§8.11)
- [ ] Settings screen (§8.12)
- [ ] Test backups on the real iPhone (save to Files, erase, restore, undo restore)
- [ ] Final polish, accessibility and performance pass
- [ ] Redeploy

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

_None yet._
