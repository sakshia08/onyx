# Onyx: Product Requirements Document

> **App name:** Onyx
> **Version:** 1.2, 26 October 2026 (updated with answers to the setup questions, see §17)
> **Platform:** installable web app (PWA) for iPhone that works fully offline
> **Design inspiration:** `design/inspo/`

---

## 1. Summary

Onyx is a personal monthly budget app. On the 1st of every month I decide how much I'll use that month and split it into **buckets** (Commute, Food, Leisure, Investing, Saving and so on). Every expense I log comes out of a bucket, so I always know exactly what's left, including when I've gone over. A ₹2,000 Leisure bucket with ₹2,500 spent shows **−₹500**.

Alongside the monthly buckets, **piggy banks** let me save over several months for things I know are coming, like a trip, a festival, a gift or a yearly insurance premium.

The app runs entirely on my phone. There's no account and no server, it needs no internet after it's installed, and it uses no AI or API keys.

## 2. Why build this

Free budget apps are cluttered, full of ads, push bank syncing and subscriptions, and are slow to log in. I want:

- To log an expense in about 3 seconds.
- To see at a glance what I can still spend this month, in total and in each bucket.
- A clean monthly rhythm: plan on the 1st, log during the month, review at the end.
- To save for specific future plans without them wrecking a single month's budget.
- A calm, dark interface that feels like a premium iPhone app.

## 3. Product principles

1. **Logging must be effortless.** Every extra tap is a reason to stop using the app, so the add-expense flow matters more than anything else.
2. **Private and offline.** Data never leaves the phone unless I send a backup myself. No network calls, accounts, analytics, trackers, ads, AI or API keys.
3. **Honest numbers.** Overspending is never hidden. A negative balance is shown as negative.
4. **Calm, not naggy.** Helpful heads-ups, no guilt, no stream of alerts.
5. **Beautiful by default.** Dark, elegant and smooth. Every screen should look intentional.

## 4. Platform and constraints

- Web app built with Vite, React and TypeScript. It's installed on iPhone with **Safari → Share → Add to Home Screen** and runs full-screen (standalone) with its own icon.
- Developed on a Windows laptop. Tested in a desktop browser at iPhone size and on a real iPhone.
- Hosted as static files on a free host (Vercel, Netlify or GitHub Pages). The host only serves the app's code and never receives my data.
- Must work 100% offline after the first load. The service worker precaches everything, including fonts and icons.
- **No** backend, login, sync or push notifications.
- **No** AI features, external APIs, API keys or CDNs at runtime.
- All data is stored on the device in IndexedDB.
- iOS limitations to design around:
  - There's no vibration or haptics API.
  - Nothing can run in the background.
  - Web apps can't have widgets.
  - The installed app's storage is separate from Safari's.

## 5. Scope

### In scope for v1

- Monthly budget setup with two kinds of buckets: spend and save.
- Logging expenses and "money back" in about 3 seconds, with an amount-first keypad, math in the amount field, note suggestions and favorites.
- What's left in each bucket (including negatives), pace warnings, and heads-ups at 80% and 100%. No per-day spending amounts (§7.2).
- Recurring expenses, logged automatically or after asking.
- Piggy banks (one-time and yearly goals) with suggested monthly amounts, stashing, auto-stash, spending from a piggy, moving leftover money into a piggy, and celebrations.
- Automatic month rollover with a month-end recap.
- Smarter setup: copy last month and see 3-month averages.
- Insights: charts, past months (read-only) and search.
- A privacy blur and an optional PIN lock.
- One-tap backups saved to the iPhone's Files app, a backup step in every month-end recap, an automatic safety copy before risky changes, and restore.
- PWA features: installable, works offline, iOS icons and launch screens, and an update prompt.

### Out of scope for v1 (do not build)

- Accounts, login, cloud sync or multiple devices
- Importing from banks, UPI or SMS, or scanning receipts
- AI of any kind, or any feature that needs an API key or the internet
- Push notifications and reminders (they need a server)
- Home-screen widgets, Siri or Shortcuts (they need a native app)
- A light theme (v1 is dark only)
- Currencies other than INR
- Adding or editing expenses in past months
- Splitting bills with friends or tracking who owes what
- Carrying unspent money into next month's buckets

## 6. Concepts and glossary

| Term | Meaning |
|---|---|
| **Month** | A calendar month in the phone's local time, from 00:00:00 on the 1st to 23:59:59 on the last day. |
| **Monthly budget** | The total I plan to use this month, entered on the 1st. |
| **Bucket** | A slice of the monthly budget for one purpose. Each has an allocated amount, an emoji, a color and a kind. |
| **Spend bucket** | A bucket for spending (Commute, Food, Leisure). It gets pace warnings and heads-ups. |
| **Save bucket** | A bucket for money I'm putting away (Investing, Saving). It shows "left to put away" and gets no pace warnings. Putting away more than planned is shown calmly ("₹1,000 extra put away"), never in red. |
| **Entry** | One logged item in a bucket. Either an **expense**, which reduces the bucket, or **money back** (a refund, or a friend paying me back), which increases it. |
| **Remaining** | Allocated amount, minus expenses, plus money back. Can be negative. |
| **Piggy bank** | A savings goal that spans months, e.g. "Goa trip, ₹30,000 by 15 March". Its balance never resets. |
| **Stash** | Moving money from this month's budget into a piggy. |
| **Piggy plan** | How much of this month's budget is set aside for a piggy. |
| **Recurring expense** | An expense that repeats on the same day every month (rent, SIP, Netflix). |
| **Favorite** | A saved one-tap entry, e.g. "Metro ₹40 → Commute". |

**Saving bucket vs piggy bank:** the Saving bucket is general savings for the month (e.g. money moved into an FD). A piggy bank is savings for one specific future plan.

## 7. Rules and calculations

All money is stored as **integer paise** (₹1 = 100 paise). Never use floating-point maths for money.

### 7.1 Month

- `monthKey` is the local date formatted as `yyyy-MM`.
- `today` is the day of the month (1–31).
- `daysLeft` (including today) = `daysInMonth − today + 1`.
- `elapsedFraction` = `today / daysInMonth`.

### 7.2 Bucket

- `used` = sum of expenses − sum of money back.
- `remaining` = `allocated − used`. This can be negative.
- `upcoming` = the sum of this bucket's recurring expenses that are due later this month and haven't been logged or skipped yet. Shown in bucket detail and in "Coming up".
- **No per-day amounts.** The app never shows a "safe to spend per day" figure, for a bucket or for the month. It creates anxiety. (Decided 26 Oct 2026.)
- For **spend buckets** only:
  - **Ahead of pace** means `used / allocated > elapsedFraction + 0.15` while `remaining > 0`. Shown in amber.
  - **Over** means `remaining < 0`. Shown in red.
  - **Pace tick:** the progress bar shows a small tick at `elapsedFraction`, marking where spending "should" be today.
  - **Heads-up toasts:** shown when a bucket first crosses 80% used and 100% used in a month. Each threshold fires once per bucket per month.
- For **save buckets** only:
  - `remaining > 0` is shown as "₹X left to put away".
  - `remaining = 0` is shown as "All put away".
  - `remaining < 0` means I put away more than planned. It's shown as "₹X extra put away" in neutral text, never red, with no "Over by" wording. This doesn't change the month totals in §7.3.

### 7.3 Month totals

- `allocatedTotal` = sum of bucket allocations + sum of piggy plans.
- `unallocated` = `totalBudget − allocatedTotal`. If this is negative, show "Over-allocated by ₹X" as a warning, but still allow it.
- `stashedThisMonth` = sum of piggy stashes dated in this month.
- `used` = sum of all buckets' `used` + `stashedThisMonth`.
- `remaining` = `totalBudget − used`. This can be negative. It's the hero number on Home ("Left this month") and the month's final "left" figure, shown in history. Unspent money does not roll over: each new month starts fresh. The only way leftover money leaves a month is the optional "leftover to piggy" step (§8.6).

### 7.4 Piggy banks

- `balance` = opening + stashes + leftovers − spends. This can be negative.
- `progress` = `balance / target`, clamped to 0–100% for visuals.
- `monthsLeft` = the number of months from the current month to the target date's month, counting both ends (minimum 1).
- `balanceAtStartOfMonth` = the balance from every transaction dated before this month started, plus any `leftover` deposits made this month (that money came from last month, so it counts as start-of-month money).
- `suggestedThisMonth` = `max(0, target − balanceAtStartOfThisMonth) / monthsLeft`, rounded up to the whole rupee. Using the balance at the start of the month means the suggestion doesn't shift as I stash mid-month.
- `plannedThisMonth` = the piggy plan I set in this month's setup (prefilled with `suggestedThisMonth`, and I can change it). If the piggy has no plan this month (e.g. it was created after setup), use `suggestedThisMonth`.
- `toStashThisMonth` = `max(0, plannedThisMonth − amount stashed into this piggy this month)`. The Stash button and "This month: ₹2,000 of ₹6,000 stashed" both use `plannedThisMonth`.
- `expectedAtStartOfMonth` = `target × monthsSinceCreation / totalMonths`, where `totalMonths` counts from the creation month to the target month, both included. For yearly piggies, "creation" means the start of the current cycle (see below).
- **Status:**
  - **Done:** `balance ≥ target`.
  - **On track:** `balanceAtStartOfMonth ≥ expectedAtStartOfMonth`.
  - **Behind by ₹X:** the balance at the start of the month is below the expected amount.
  - **Date passed:** a one-time piggy whose target date is past and that isn't done.
  - **No date:** no target date was set, so there's no suggestion; only progress is shown.
- Spending from a piggy reduces only that piggy. It never touches the month's buckets or totals.
- **Yearly piggies:** once the target date passes, the next cycle starts automatically with the date moved one year ahead, and the balance carries over.
  - A new cycle starts on the day after the old target date (e.g. due 15 Mar 2027 → the new cycle starts 16 Mar 2027, due 15 Mar 2028).
  - All the maths for the new cycle (`monthsLeft`, `expectedAtStartOfMonth`, status) counts from the cycle's start month instead of the piggy's creation month. The old cycles stay in the history.
  - This is a first version and may be refined later.

### 7.5 Worked examples (each one must be a unit test)

**Setup:** November 2026 has 30 days and a budget of ₹60,000.
- Buckets: Commute ₹3,000, Food ₹8,000, Leisure ₹2,000 (spend); Investing ₹15,000, Saving ₹25,000 (save).
- Piggy plan: Goa trip ₹6,000.
- So `allocatedTotal` = ₹59,000 and `unallocated` = ₹1,000.

1. **Overspending.** Leisure entries of ₹1,200 and ₹1,300 make `used` ₹2,500, so `remaining` is **−₹500**, shown in red as "Over by ₹500".
2. **Save bucket.** Logging "Education ₹20,000" in Saving leaves `remaining` at ₹5,000.
3. **Pace.** On 18 Nov (`elapsedFraction` = 0.60), Food has ₹5,200 used:
   - `remaining` = ₹2,800.
   - 0.65 used vs 0.60 elapsed is within 0.15, so it's on pace.
   - With ₹6,500 used instead: 0.8125 > 0.75, so it's **ahead of pace** (amber), and the 80% heads-up fires.
4. **Money back.** A friend repays ₹400 into Food, so Food's `used` drops by ₹400.
5. **Upcoming recurring.** Netflix (₹649, day 28) is a recurring Leisure expense. On 18 Nov, Leisure has ₹1,200 used:
   - `remaining` = ₹800 and `upcoming` = ₹649.
   - On 28 Nov, once Netflix is logged, `upcoming` = ₹0 and `remaining` = ₹151.
6. **Piggy suggestion.** Goa trip: target ₹30,000, date 15 March 2027, created 1 Nov 2026 with ₹0.
   - `monthsLeft` = 5 (Nov, Dec, Jan, Feb, Mar), so `suggestedThisMonth` = ₹6,000.
7. **Falling behind.** Same piggy, with only ₹4,000 stashed in November. On 1 Dec:
   - `monthsLeft` = 4, so the suggestion becomes (30,000 − 4,000) / 4 = ₹6,500.
   - Expected = 30,000 × 1/5 = ₹6,000, so the status is **Behind by ₹2,000**.
8. **Month boundary.** An entry at 23:59:59 on 30 Nov belongs to November. One at 00:00:00 on 1 Dec belongs to December.
9. **Day 31 rule.** A recurring expense set for day 31 happens on the 30th in a 30-day month, and on the 28th in February (the 29th in leap years).
10. **Totals with a stash.** Stashing ₹6,000 into Goa trip in November raises November's `used` by ₹6,000 and leaves every bucket unchanged.
11. **Saving more than planned.** Putting ₹16,000 into Investing (₹15,000 allocated) makes `remaining` −₹1,000. It's shown as "₹1,000 extra put away", not red and not "Over by".
12. **Savings carry across months.** Goa trip gets ₹4,000 stashed in October. In November it shows ₹4,000 saved and ₹26,000 to go. After ₹6,500 more is stashed in November, it shows ₹10,500 saved and ₹19,500 to go. October's and November's own `remaining` each end with their month.
13. **Plan vs suggestion.** Goa trip's suggestion is ₹6,000, but I plan ₹4,000 in setup. With ₹1,000 stashed, `toStashThisMonth` = ₹3,000, and the page shows "₹1,000 of ₹4,000 stashed".

## 8. Features

Each feature lists its requirements and acceptance criteria (AC).

### 8.1 First launch

- If the app is opened in Safari rather than installed (`navigator.standalone !== true`), show an **Add to Home Screen** guide with the steps and the Share icon. Explain that data in Safari and in the installed app are kept separately. The guide can be dismissed with "Continue in browser".
- **Welcome screen:** the app name, a one-line promise ("Your money, in buckets. Private and offline."), and an optional "What should I call you?" field for the greeting.
- Then go to **Monthly setup** for the current month.
- Call `navigator.storage.persist()` on first launch, so iOS is less likely to clear the data when the phone runs low on space.
- **AC:** a fresh install goes from welcome through setup to Home in under a minute using the defaults.

### 8.2 Monthly setup

Shown on first launch, and when a new month begins (after the recap).

- **Step 1: Budget.** "How much for November?" A large amount with the custom keypad, plus a chip: "Same as October · ₹60,000".
- **Step 2: Buckets.** A list of rows, each with an emoji, name and amount.
  - **Defaults on first launch:** Commute 🚇, Food 🍜, Leisure 🎉 (spend); Investing 📈, Saving 🏦 (save).
  - **Later months:** prefilled from last month, with the same names, amounts and ids.
  - **Hints on each row:**
    - "Avg ₹6,200": the average used over the last 3 closed months that had this bucket. Tap it to use that amount.
    - Recurring amounts already committed to the bucket, e.g. "Rent ₹15,000 recurring".
  - I can add, rename, delete and reorder (drag) buckets, and pick each one's emoji, color and kind.
- **Piggy section:** each active piggy with its suggested amount prefilled. I can edit it or set it to 0.
- **Sticky footer:**
  - The live unallocated amount: "₹1,000 unallocated" (neutral) or "Over-allocated by ₹1,500" (amber).
  - A "Start November" primary button.
- **One-tap path:** "Same as last month" fills in the budget, buckets and piggy suggestions, so setup can take two taps.
- **AC:**
  - The total, bucket and piggy amounts are saved.
  - Over-allocating is allowed, with a warning.
  - Buckets keep the same ids across months.
  - A month can't be started with zero buckets.

### 8.3 Home

From top to bottom:

1. **Header:** "Good evening, {name}" and the month name. An eye icon toggles the privacy blur.
2. **Month tank** (the hero, §10.1): a tall card filled with violet liquid that drains as money is used.
   - Label "Left this month" with a "12 days left" pill beside it, over the remaining amount, large.
   - Footer: "₹26,550 used of ₹60,000". (No "safe today" figure, see §7.2.)
   - Over budget: the tank is empty, the amount is red with a minus sign, and the edge turns red.
3. **Due now:** shown only when ask-first recurring items are due. One row per item, with Log and Skip.
4. **Quick log:** a horizontal row of favorite chips. One tap logs the entry and shows an undo toast.
5. **Buckets:** "Spend" and "Save" groups, each a 3-column grid of tall **vials**. Each vial shows:
   - Liquid in the bucket's color. Spend vials drain as money is used; save vials fill up as money is put away. An over-budget vial is empty with a red edge.
   - The emoji at the top; the name and the remaining amount at the bottom, over the liquid.
   - A sub-line:
     - Spend buckets: "of ₹8,000", or "Over by ₹500" in red.
     - Save buckets: "left to put away", "All put away", or "extra put away" with the big number shown as "+₹1,000" (neutral, never red).
   - A small pace notch on the right edge of spend vials (where the level "should" be today), plus an amber dot when ahead of pace.
   - Tap opens the bucket's detail screen. Long-press opens Quick add with that bucket already selected.
6. **Coming up:** recurring items still due this month, with their total.
7. **Piggy peek:** a compact card for the active piggy with the nearest date ("Goa trip · 62% · 47 days"). Tapping it opens the Piggy tab.
8. **Recent:** the last 5 entries. "See all" opens the month's activity list.

Empty states guide the first actions.

**AC:**
- Every number updates instantly after logging.
- Negative balances are red and have a minus sign.
- The layout looks right at widths from 375 to 430 px.

### 8.4 Quick add (the most important flow)

Opened as a bottom sheet from the floating + button, or from a bucket card.

- **Order:** amount → destination → note (optional) → ✓.
- **Favorites row** at the top. Tapping one logs it immediately and closes the sheet.
- **Amount:**
  - A large display and a custom keypad (1–9, 0, ., ⌫, +, −).
  - Typing `250+180` shows "250 + 180" small above, and "₹430" large.
  - Use a safe parser, never `eval`.
  - Maximum two decimal places, and the result must be more than 0.
- **Type toggle:** Expense / Money back.
- **Destination chips:**
  - Buckets first (colored, scrolling horizontally), then active piggies (with a pig icon) for spending from a piggy.
  - Piggies are hidden when the type is Money back.
  - If the sheet was opened from a bucket, that bucket is preselected. Otherwise nothing is selected, and ✓ stays disabled until a destination is chosen.
- **Note** (optional), with up to 3 suggestion chips from past notes:
  - Matching is case-insensitive. Rank by prefix match first, then how often the note was used, then how recently.
  - Choosing a suggestion fills in the note and, if no bucket is chosen yet, picks the bucket that note is most often logged in.
  - With a bucket chosen and the note still empty, show that bucket's most common notes.
- **Date chip:** shows "Today". Tapping it opens a day picker limited to the 1st of this month through today.
- **Saving:** ✓ saves the entry, and the sheet closes with a short success animation. A toast offers Undo for 5 seconds.
- **Favorite suggestion:** when the same note, amount and bucket are logged 3 times within 30 days, offer "Save as favorite?" once. If I dismiss it, never ask again for that combination.
- **Keyboard:** the iOS keyboard only appears for the note field, and the sheet stays above it.
- **AC:**
  - A typical entry takes no more than 3 taps after typing the amount.
  - A favorite takes 2 taps (+, then the favorite), or 1 tap from Home.

### 8.5 Entries, bucket detail and editing

- **Bucket detail:**
  - A header with the emoji and name, then the bucket as a large tank in its color (Liquid, §10.1): the remaining amount (large), a status pill (On pace, Ahead of pace, Over, ₹0 budget; for save buckets: Save, All put away, Goal met), "₹5,200 used of ₹8,000", and the pace notch on the tank's edge in place of a progress bar.
  - Below it: the pace in words, as percentages only ("On pace: 65% used, with 60% of November gone"), and upcoming recurring items.
  - Below it, entries newest first, grouped by day ("Today", "Yesterday", "Mon 16 Nov"), with a total for each day.
- **Edit bucket** (current month only):
  - Change the name, emoji, color, kind or allocated amount.
  - A bucket can only be deleted when it has no entries. Otherwise, offer to move its entries to another bucket first.
- **Entry row:**
  - A tinted emoji avatar, the note (or the bucket name if there's no note), the time and bucket, and the amount on the right.
  - Expenses use normal text, e.g. "−₹450". Money back is green, e.g. "+₹400". Red is reserved for negative balances.
- **Edit entry** (current month only): tap an entry to open the same sheet, prefilled. I can change the amount, destination, note, date or type, or delete it with Undo.
- **Past months are read-only.** Tapping an entry there only shows its details.
- **Activity list:** every entry this month, plus piggy stashes and spends, with filter chips by bucket.
  - Piggy spends get a pig badge and are excluded from the month's totals.

### 8.6 Piggy banks 🐷

This tab is called **Piggy**. It has its own personality: the same dark base, with a soft pink glow and a cute pig.

- **Hero:**
  - A large line-art pig (§10.6) that fills from the bottom with a pink gradient up to the selected piggy's progress.
  - Swipe between active piggies, with page dots.
  - The piggy's name as a small uppercase label, its balance in large rounded figures, "of ₹30,000 · 47 days left", and a status pill: On track, Behind by ₹2,000, Done 🎉 or Date passed.
- **Primary action:** a pink pill button, "Stash ₹4,000", prefilled with `toStashThisMonth`. Tapping it opens the stash sheet, where the amount can be changed.
- **Secondary action:** "Spend from piggy".
- A progress line for the month: "This month: ₹2,000 of ₹6,000 stashed".
- **All piggies list:** a card for each, with a small progress ring, emoji, name, balance and target, and a countdown. Plus a "+ New piggy" card, and a collapsed section for completed piggies.
- **Create a piggy:**
  - Fields: name, emoji, target amount, target date (optional), repeat (one-time or yearly), opening balance ("Already saved ₹X"), and an auto-stash toggle.
  - Templates: Trip ✈️, Birthday 🎂, Diwali 🪔, New phone 📱, Emergency fund 🛟, Insurance (yearly) 🛡️.
  - Show the calculated monthly amount live, e.g. "₹6,000/month for 5 months".
- **Stash:**
  - A keypad sheet. The stash counts toward this month's `used`.
  - Animation: a coin drops into the pig's slot, the pig squishes slightly, and the fill rises.
- **Auto-stash:** when it's on, the piggy's planned amount is stashed automatically on the 1st (once setup is done), and it shows up in the piggy's history.
- **Spend from a piggy:**
  - Logged through Quick add (with the piggy as the destination) or from the Piggy page.
  - It reduces only the piggy.
- **Piggy detail:**
  - The full history: opening balance, stashes, leftovers and spends.
  - Edit the name, target, date, repeat or auto-stash, and "Mark as done".
- **Done:**
  - When the balance first reaches the target: confetti, a pig wiggle, and a "You did it!" sheet with "Keep saving" and "Mark as done".
  - Marking a piggy done shows a summary of saved vs spent. Any leftover can be moved to another piggy.
- **Yearly piggies:** after the target date, the next cycle starts automatically, with a small "New cycle started" note.
- **Leftover to piggy:**
  - In the month-end recap (and in a past month's detail), if the closed month had money left, ask: "₹1,800 left in October. Stash some into a piggy?" This records a `leftover` deposit on the piggy.
  - The past month still shows its full remaining amount, plus a line like "₹1,000 moved to Goa trip".
  - The total moved can never be more than that month's remaining amount.
- **Empty state:** a sleeping pig outline ("z z") with the templates.
- **AC:**
  - Piggy balances carry across months.
  - Stashes reduce the month's remaining amount, and piggy spends don't.
  - Suggested amounts follow §7.4.

### 8.7 Recurring expenses

- Managed from **Settings → Recurring**, and from "Coming up" on Home.
- **Fields:** name, amount, bucket, day of month (1–31), mode ("Log automatically" or "Ask me first"), and an active toggle.
- **When it runs:** on launch, when the app returns to the foreground, and once a minute while it's open. Only the active month is affected.
- **Due items** (day ≤ today, not yet handled):
  - Auto: create the entry, dated that day at 09:00, with source "recurring".
  - Ask: show it under "Due now".
- **Future items this month:** shown in "Coming up" and counted in `upcoming`.
- A skipped item stays skipped for that month.
- Days 29–31 move to the last day in shorter months.
- If a rule's bucket doesn't exist in the current month, show the rule as "Needs a bucket" in Coming up.
- If a rule is created mid-month after its day has passed, ask whether to log it for this month.
- **AC:** opening the app on the 10th, after last opening it on the 1st, logs rent (day 1) and the SIP (day 5) exactly once each. Duplicates must never happen.

### 8.8 Month rollover and recap

- The app checks the month on launch, when `visibilitychange` makes it visible, and every 60 seconds while it's open.
- **When the current month is later than the active month:**
  1. Close the active month. It becomes read-only, and `closedAt` is set.
  2. Show the **recap**.
  3. Offer the optional **leftover to piggy** step.
  4. Show **setup** for the new month.
- Months in which the app was never opened are not created.
- If the clock moves backwards (the current month is earlier than the active month), do nothing destructive and show a small warning.
- **Recap:** story-style cards I swipe through, dark with the soft violet glow and liquid fills.
  1. "October in review": budget, used, and left (or over).
  2. Buckets: which stayed within budget, and which went over and by how much.
  3. The biggest expense and the most-used bucket.
  4. Compared with September: the percentage change per bucket.
  5. Piggies: the total stashed this month and the progress made.
  6. "Back up October": one tap to save a backup (§8.11). Shown when the monthly backup step is on. It can be skipped.
  7. "Plan November →"
- If the month ended under budget, a little confetti plays on the first card.
- Recaps are saved and can be reopened from Insights.
- **Monthly backup:** the backup card in the recap is the main way backups happen, so each month ends with a fresh backup. Skipping it never blocks the new month.

### 8.9 Insights, past months and search

- This tab is called **Insights**.
- **Month switcher:** the current month and past months, newest first. Past months are read-only.
- **Summary** for the selected month: used vs budget, and what's left.
- **Bar chart** of spending (spend buckets only):
  - A Week view (Mon–Sun, defaulting to the current week) and a Month view (by day).
  - The selected bar is lit with the accent gradient and has a small value label. The other bars are muted.
- **Bucket tiles** in a 2-column grid: the bucket name, amount used, and the change vs the previous month.
- **Saved this month:** the total from save buckets plus piggy stashes.
- For closed months: "View recap", and "Move leftover to a piggy" if some leftover hasn't been moved yet.
- **Search** (magnifier icon):
  - Searches notes across all months (case-insensitive, matching any part of the note).
  - Filters: bucket, month range and type.
  - Shows a summary such as "23 entries · ₹8,450", with results grouped by month.
- Charts are custom SVG, with no chart library.

### 8.10 Privacy: blur and PIN

- **Blur:**
  - An eye icon in the Home and Piggy headers replaces every amount with "₹ ••••" everywhere, until I tap it again.
  - A setting: "Hide amounts when the app opens".
- **PIN lock** (optional):
  - A 4-digit PIN. The lock screen appears on launch, and when I return to the app after the chosen timeout (Immediately, 1 min or 5 min).
  - The PIN is stored only as a PBKDF2 hash with a random salt, using Web Crypto.
  - After 5 wrong tries, there's a 30-second cooldown.
  - "Forgot PIN?" explains that the only way out is to erase all data, then optionally restore a backup.
  - The UI must say clearly that the PIN is a privacy screen, not encryption.

### 8.11 Backup and restore (saved to the iPhone's Files app)

**Why it matters:** the app's data lives only inside the installed app. If the home-screen icon is deleted, website data is cleared, or iOS clears storage because the phone is nearly full, the data is gone. A backup file saved outside the app is the only other copy. The file is tiny (a whole year of data should be well under 1 MB, smaller than a single photo), so keeping it on the phone is fine.

- **Back up now** (in Settings, and as a step in the month-end recap):
  - Creates `onyx-backup-YYYY-MM-DD.json` containing all data.
  - Opens the iOS share sheet using the Web Share API with the file attached. The screen tells me to tap **Save to Files** and pick a folder: On My iPhone, or iCloud Drive.
  - The same sheet also lets me email the file or send it to myself, if I ever prefer that.
  - On a laptop, or anywhere sharing files isn't supported, download the file instead.
  - Record `lastBackupAt` only after the share completes. If I cancel, don't record it.
  - A web app can't save files silently in the background, so every backup needs this one tap. The monthly recap step turns it into a habit.
- **Monthly backup step:** on by default, and can be turned off in Settings. It adds a "Back up October" card to every month-end recap (§8.8).
- **Tips shown in the backup screen:**
  - "You only need your newest backup. You can delete older ones in the Files app."
  - "Saving to iCloud Drive also protects you if you lose or replace your phone."
- **Status:** Settings shows the last backup date, e.g. "Last backup: 1 Oct". If there's been no backup for over 35 days, show this in amber.
- **Restore:**
  - Pick a backup file. On iPhone this opens the Files picker.
  - Validate it with zod and show a preview, e.g. "14 months · 1,240 entries · 3 piggies · from 26 Oct 2026".
  - Confirm "Replace everything on this phone", then restore.
  - Reject invalid files, or files from a newer version of the app, with a clear message.
- **Safety copy:**
  - Before a restore or a data migration, the app automatically keeps one copy of the current data inside the app.
  - After a restore, Settings offers "Undo restore", which brings that copy back.
  - This protects against mistakes, not against the app's data being wiped, which is why the backup file still matters.
- **Storage info:** "This app is using 312 KB on your phone" (from `navigator.storage.estimate()`).
- **AC:**
  - Backing up, erasing and then restoring gives back exactly the same data, checked by a round-trip test.
  - "Undo restore" gives back exactly the data from before the restore.

### 8.12 Settings

- Your name
- Recurring expenses
- Favorites (reorder, edit, delete)
- Privacy: hide amounts on open; PIN lock (set, change, remove, timeout)
- Backup: back up now, restore, undo restore, monthly backup step (on/off), last backup date, storage used
- Motion: follow system, or reduce
- Erase all data (type "ERASE" to confirm)
- About: version, and "Works offline. Your data never leaves this phone."

## 9. Navigation and screens

**Tab bar:** a floating glass pill with icon tabs **Home · Insights · Piggy · Settings** (a small dot marks the active tab; each has a VoiceOver label), and a separate white circular **+** beside it that opens Quick add.

**Screens:**

| Area | Screens |
|---|---|
| Entry | Install guide (Safari only), Welcome, Lock |
| Setup | Month setup (budget, then buckets and piggies) |
| Home | Home, Bucket detail, Edit bucket, Activity (month) |
| Logging | Quick add / Edit entry (sheet) |
| Piggy | Piggy, Piggy detail, Create/Edit piggy, Stash (sheet), Goal reached (sheet) |
| Insights | Insights, Search, Past month detail, Recap (full-screen stories) |
| Settings | Settings, Recurring list and editor, Favorites manager, Backup and restore, PIN setup |

Use hash-based routing, so the app works on any static host.

## 10. Design

### 10.1 Direction

Dark, elegant, calm and premium, with its own personality. It must not look like a template dashboard or a copy of any fintech app.

**The idea: liquid.** Money is shown as liquid in containers, the same language as the pig's fill (§10.6), which is the app's heart.
- **The month** is a tank that drains as money is used (§8.3).
- **Buckets** are vials in their own color. Spend vials drain; save vials fill up, like the pig.
- **Piggies** fill up as you stash.
- Liquid has a gentle two-layer wave that drifts slowly, and springs to its new level when an amount changes.

**Everything else stays quiet** so the liquid stands out:
- **Background:** near-black, with one soft colored glow at the top of the screen.
- **Numbers:** huge and confident, with the ₹ sign and paise smaller and dimmer.
- **Controls:** a glassy floating tab bar, pill buttons, and white primary buttons on dark.
- **Lists:** clean rows with round, tinted emoji avatars.
- **Charts:** bars where only the selected bar is lit.
- **Piggy page:** a cute "stash" feel (the pig, goal cards, progress) in this dark style with pink accents.

`design/inspo/` (kept local, not in git) is for mood and quality only. Do not copy any of its screens.

### 10.2 Color tokens (CSS variables)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#09090B` | app background |
| `--surface-1` | `#121215` | cards |
| `--surface-2` | `#1A1A1F` | raised elements, inputs, chips |
| `--surface-3` | `#24242B` | pressed / selected |
| `--hairline` | `rgba(255,255,255,0.07)` | borders, dividers |
| `--text-1` | `#F5F5F7` | primary text |
| `--text-2` | `#A1A1AA` | secondary text |
| `--text-3` | `#83838D` | tertiary text, dimmed paise (changed from `#6B6B75`, which failed AA contrast; don't put it on `--surface-3`) |
| `--liquid` | `#7C6CFF` | the month tank's liquid, the screen glow |
| `--accent` | `#3E8BFF` | focus ring, text caret, links |
| `--piggy` | `#FF8FB8` | piggy pink (fills, buttons) |
| `--piggy-strong` | `#FF5FA2` | pig outline strokes, glow |
| `--positive` | `#4ADE80` | money back, done |
| `--warning` | `#FFB547` | ahead of pace, over-allocated |
| `--negative` | `#FF5A5F` | negative balances only |

**Bucket palette** (one per bucket): Violet `#8B7CFF` · Blue `#5B9DFF` · Teal `#3DD6C6` · Green `#5BD68A` · Amber `#FFC25B` · Orange `#FF8F5B` · Rose `#FF6FAE` · Slate `#9AA3B2`. Tinted backgrounds use the color at 14–18% opacity.

All text must meet WCAG AA contrast against its background.

### 10.3 Typography

- **UI font:** `-apple-system, "SF Pro Text", "SF Pro Display", "Inter Variable", system-ui, sans-serif`.
  - Bundle Inter Variable locally (`@fontsource-variable/inter`) so the app also looks right on Windows during development. The iPhone uses SF Pro.
- **Piggy amounts:** `ui-rounded, "SF Pro Rounded", "Inter Variable", sans-serif`, for a soft, friendly look.
- **All numbers** use `font-variant-numeric: tabular-nums`.
- **Scale** (size/line height in px):

| Style | Size | Weight | Notes |
|---|---|---|---|
| Hero | 56/60 | Semibold | Tracking −0.03em; the month tank's amount |
| Display | 48/52 | Semibold | Tracking −0.03em; large amounts (keypad, piggy) |
| Title | 28/34 | Semibold | |
| Headline | 17/22 | Semibold | |
| Body | 16/22 | Regular | |
| Callout | 15/20 | Regular | |
| Caption | 13/18 | Medium | |
| Micro label | 11/14 | Semibold | Uppercase, tracking +0.08em |

- **Amount component:**
  - The "₹" is about 55% of the size, in `--text-2`.
  - Paise appear only when they aren't zero, in `--text-3`.
  - Indian grouping (₹1,00,000) via `Intl.NumberFormat('en-IN')`.

### 10.4 Shape, spacing and depth

- **Spacing:** a 4 px grid, 20 px side padding on screens, and 28 px between sections.
- **Radii:** 32 px for the month tank, 28 px for bucket vials, 24 px for cards, 16 px for inner elements, and full pills for chips and buttons.
- **Depth:** create depth with layered surfaces and hairlines rather than heavy shadows. Use soft colored glows for emphasis.
- **Glass:** `backdrop-filter: blur(20px) saturate(140%)` over `rgba(18,18,21,0.72)` with a hairline border. Used for the tab bar, sheet headers and sticky footers.
- **Grain:** a fine noise overlay (inline SVG, 3–5% opacity) on the month tank.

### 10.5 Components

- **Button** (primary white, secondary surface, piggy pink, ghost, destructive), Chip (selectable, colored), Segmented control
- **Card**, Month tank, Bucket vial, Liquid fill, Quick-log chip, Piggy peek, Entry row, Section header, Empty state
- **Amount display**, Progress bar with pace tick, Progress ring
- **Bottom sheet**, Custom keypad, Toast with Undo
- **Tab bar** (glass pill of icon tabs, with a separate white +)
- **Pig illustration**

### 10.6 The pig

- **Drawing:** a custom SVG line-art pig, not an emoji. Side or three-quarter view, with:
  - A rounded oval body, one ear, a snout with two nostrils, a dot eye and a small blush.
  - A curly tail, four stubby legs, and a coin slot on its back.
  - 2 px rounded strokes in `--piggy-strong`.
- **Fill:** the inside of the body fills from the bottom with a pink gradient (`--piggy` → `--piggy-strong`) up to the progress level, with a gentle animated wave on the surface.
- **Animation:**
  - Idle: a slow, gentle bob on a 3–4 second loop.
  - Stash: a coin drops into the slot, the pig squishes by about 4%, and the fill springs up.
  - Goal reached: a wiggle and confetti.
  - Empty state: eyes closed, with "z z".
- **Small version:** a small outline version is the Piggy tab icon, and sits next to the Piggy page title.
- The 🐷 emoji may appear as a playful accent in text, but the illustration is the hero.

### 10.7 Motion

- **Library:** Motion. Use springs for sheets and layout changes (e.g. stiffness 400, damping 36), and 150–250 ms for fades.
- **What animates:**
  - Numbers count or roll when they change.
  - Cards stagger in on first load, 30 ms apart.
  - Tapping scales elements to 0.97.
  - Progress bars and the pig's fill animate to new values.
  - Liquid waves drift slowly, and levels spring to new values (spend: the bucket's vial and the month tank drain).
- **Reduced motion:** respect `prefers-reduced-motion` and the in-app setting by replacing movement with fades.
- **No haptics:** iOS web apps can't vibrate, so give visual feedback instead.

### 10.8 iPhone details

- **Screen edges:** use `viewport-fit=cover`, and pad with `env(safe-area-inset-*)` for the notch, the Dynamic Island and the home indicator.
- **Layout:** use `100dvh`, and make sure nothing jumps when the keyboard opens (use `visualViewport`).
- **Inputs and touch:**
  - Input font size at least 16 px, so Safari doesn't zoom in.
  - `touch-action: manipulation`, no tap highlight, and `overscroll-behavior: none`.
  - Tap targets at least 44 × 44 px.
- **Status bar and colors:** status bar style `black-translucent` and `theme-color` `#09090B`. Set the html and body background to `#09090B` to avoid white flashes.
- **Test widths:** 375 (mini/SE), 390/393 (standard) and 430 (Pro Max).

### 10.9 Accessibility

- VoiceOver labels on every icon button. Amounts are read in full ("minus 500 rupees").
- Never rely on color alone. Negative amounts always have a minus sign and the words "Over by".
- Visible focus styles and a logical heading order. Avoid clipped text at larger text sizes.

## 11. Data model (TypeScript)

```ts
type Paise = number;   // integer; ₹1 = 100
type ID = string;      // crypto.randomUUID()
type MonthKey = string; // "2026-11"
type ISODate = string;  // local date-time, ISO 8601

interface AppState {
  schemaVersion: 1;
  profile: { name?: string };
  settings: Settings;
  activeMonthKey: MonthKey | null;
  months: Record<MonthKey, Month>;
  piggies: Piggy[];
  recurring: RecurringRule[];
  favorites: Favorite[];
  meta: {
    createdAt: ISODate;
    lastBackupAt?: ISODate;
    dismissedFavoriteSuggestions: string[]; // "note|amount|bucketId"
    installGuideDismissed?: boolean;
  };
}

interface Month {
  key: MonthKey;
  status: 'active' | 'closed';
  totalBudget: Paise;
  buckets: Bucket[];
  piggyPlans: { piggyId: ID; planned: Paise }[];
  entries: Entry[];
  recurringLog: { ruleId: ID; status: 'logged' | 'skipped'; entryId?: ID }[];
  alertsShown: { bucketId: ID; threshold: 80 | 100 }[];
  createdAt: ISODate;
  closedAt?: ISODate;
  recapSeenAt?: ISODate;
}

interface Bucket {
  id: ID;            // stable across months
  name: string;
  emoji: string;
  color: BucketColor; // one of the palette names in §10.2
  kind: 'spend' | 'save';
  allocated: Paise;
  order: number;
}

interface Entry {
  id: ID;
  type: 'expense' | 'refund';  // refund = "money back"
  bucketId: ID;
  amount: Paise;               // always positive
  note?: string;
  date: ISODate;
  createdAt: ISODate;
  updatedAt?: ISODate;
  source: 'manual' | 'favorite' | 'recurring';
  recurringRuleId?: ID;
}

interface Piggy {
  id: ID;
  name: string;
  emoji: string;
  target: Paise;
  targetDate?: string;         // "yyyy-MM-dd"
  repeat: 'none' | 'yearly';
  autoStash: boolean;
  status: 'active' | 'completed';
  createdAt: ISODate;
  completedAt?: ISODate;
  transactions: PiggyTxn[];
}

interface PiggyTxn {
  id: ID;
  type: 'opening' | 'stash' | 'leftover' | 'spend';
  amount: Paise;               // always positive
  note?: string;
  date: ISODate;
  monthKey: MonthKey;          // for 'leftover': the month the money came from
  createdAt: ISODate;
}

interface RecurringRule {
  id: ID;
  name: string;
  amount: Paise;
  bucketId: ID;
  dayOfMonth: number;          // 1–31, clamped to the month's last day
  mode: 'auto' | 'ask';
  active: boolean;
  createdAt: ISODate;
}

interface Favorite {
  id: ID;
  label: string;
  emoji?: string;
  amount: Paise;
  bucketId: ID;
  order: number;
}

interface Settings {
  currency: 'INR';
  hideAmountsOnOpen: boolean;
  pin?: { hash: string; salt: string; iterations: number };
  lockAfter: 'immediately' | '1m' | '5m';
  monthlyBackupStep: boolean;  // the backup card in the month-end recap; default true
  motion: 'system' | 'reduced';
}
```

**Notes:**

- Bucket ids stay the same across months (they're copied along with the plan), so averages, favorites and recurring rules keep working.
- Closed months are never modified, except for setting `recapSeenAt`. Leftover moves are stored on the piggy, not the month.
- The safety copy (§8.11) is stored under its own IndexedDB key, outside `AppState`, together with the date it was taken.
- Note suggestions are computed from entries (and memoized), not stored.
- The whole state is saved to IndexedDB (Zustand `persist` with an `idb-keyval` storage adapter). Show a splash screen until the saved data has loaded.
- **Migrations:** every time `schemaVersion` changes, add a migration function with a test.

## 12. Technical architecture

### 12.1 Stack

| Area | Choice |
|---|---|
| Build | Vite + React + TypeScript (strict) |
| Styling | Tailwind CSS v4, using the CSS-variable tokens from §10 |
| UI primitives | shadcn/ui (Radix), fully restyled. Bottom sheets: shadcn Drawer (vaul) or a custom Motion sheet; either way they must feel native (drag to dismiss, spring) |
| Animation | Motion (`motion/react`) |
| Icons | lucide-react, plus custom SVG (the pig) |
| State and storage | Zustand + `persist` → IndexedDB via `idb-keyval` |
| Validation | zod (backup import, migrations) |
| Dates | date-fns |
| Routing | React Router in hash mode |
| Celebrations | canvas-confetti |
| Fonts | `@fontsource-variable/inter` (bundled) |
| PWA | vite-plugin-pwa (Workbox) + `@vite-pwa/assets-generator` for icons and iOS launch screens |
| Tests | Vitest (domain logic) and Playwright (smoke tests and screenshots at iPhone size) |
| Code quality | ESLint + Prettier |

### 12.2 Folder structure (suggested)

```
src/
  app/           App shell, routes, providers, tab bar
  domain/        Pure TypeScript, no React: money, expression, dates, budget,
                 piggy, recurring, rollover, suggestions, backup, migrations
  store/         Zustand store, persistence, selectors
  features/      setup, home, quick-add, buckets, piggy, insights, search,
                 recap, settings, lock, install-guide
  components/    Shared UI: Amount, ProgressBar, ProgressRing, Keypad, Sheet,
                 HeroCard, PigIllustration, Toast, EmptyState
  styles/        tokens.css, globals.css
tests/e2e/       Playwright tests and screenshot checks
public/          Icons, apple-touch-icon, launch images
design/inspo/    Inspiration images (not shipped)
```

### 12.3 PWA

- vite-plugin-pwa with `registerType: 'prompt'`. When a new version is ready, show a "New version available, tap to refresh" toast, so the app never reloads while I'm typing.
- Precache every asset, so the app works in airplane mode after the first load.
- **Manifest:**
  - `name`, `short_name`, `display: standalone`, and `#09090B` for both `background_color` and `theme_color`.
  - Icons at 192, 512 and maskable sizes, plus a 180 px apple-touch-icon.
- **iOS launch images:** black background with the app icon, to avoid a white flash on start.
- **iOS meta tags:** `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` and `apple-mobile-web-app-title`.

### 12.4 Quality bars

- **Network:** no requests at runtime other than loading the app itself.
- **Performance:**
  - Initial JavaScript under about 250 KB gzipped.
  - Animations at 60 fps.
  - Taps respond in under 100 ms.
- **Tests:**
  - Vitest covers every worked example in §7.5, every edge case in §13, the backup round trip, and every migration.
  - Playwright runs a smoke test of the core loop (setup → log → see remaining) and takes screenshots at 390×844.
- **Hosting:** a static build deployed to Vercel or Netlify from a public GitHub repo, redeploying automatically on every push. GitHub Pages also works.

## 13. Edge cases

| Situation | Behavior |
|---|---|
| First launch mid-month (e.g. 26 Oct) | Set up October as normal, with the budget for the rest of the month. |
| App not opened for months | Close the last active month and show its recap. Don't create empty months. |
| Month changes while the app is open (midnight) | Show the recap within a minute. |
| Clock or timezone changes | Always use the current local time. A clock going backwards never closes or deletes anything. |
| Bucket allocated ₹0 | Show "₹0 budget". Any spending makes it negative. |
| Buckets add up to more than the total | Allowed, with an amber warning. |
| Amount input | Max 2 decimals and ₹1,00,00,000 per entry. Empty or 0 can't be saved. A trailing operator ("250+") is ignored. A negative result is rejected. |
| Deleting a bucket that has entries | Its entries must be moved to another bucket first. |
| Recurring rule whose bucket was removed | Shown as "Needs a bucket". |
| Recurring rule created after its day has passed this month | Ask whether to log it for this month. |
| Piggy with no target date | No suggestion; progress only. |
| One-time piggy past its target date | "Date passed". Offer to extend the date or mark it done. |
| Piggy spent below zero | Show the negative balance in red. |
| Moving leftover money | Can't exceed the month's remaining amount. Not offered when the month ended at ₹0 or below. |
| Restoring a backup from a newer app version | Refuse, and say to update the app first. |
| Backup share sheet cancelled | Don't update the last backup date. |
| A restore brings back the wrong data | "Undo restore" brings back the safety copy. |
| Saving to storage fails (e.g. the phone is full) | Show an error toast and suggest sending a backup. Never silently drop data. |
| Expense logged just after midnight for something bought before | It belongs to the new month, because past months are read-only. Known limitation in v1. |

## 14. Build phases

Each phase ends with:
- The type check, linter and tests passing.
- Screenshots at iPhone size, reviewed against §10.
- A plain-language summary and a list of things for me to try.
- A suggested commit message. I run `git add` and `git commit` myself; Claude never does.

Wait for my go-ahead before starting the next phase.

1. **Foundation**
   - Scaffold the project and tooling, set up git, and create CLAUDE.md and PROGRESS.md.
   - Add the design tokens and fonts, and build the app shell: dark base, safe areas, glass tab bar.
   - **Design preview page** (dev only, at `/#/design`): colors, type scale, buttons, chips, cards, the hero card, a bucket card, entry rows, the keypad, a bottom sheet, the tab bar, and the pig with its fill animation. **I approve this before anything else is built.**
   - Write the domain logic in `src/domain/` with unit tests, and the saved store with a schema version.
2. **Monthly setup and Home:** first launch, the setup flow, Home (hero, buckets, recent), bucket detail and edit bucket.
3. **Quick add:** the keypad with math, destination chips, note suggestions, favorites, money back, the date picker, edit and delete with undo, heads-ups, and the activity list.
4. **PWA and first install on iPhone:**
   - Manifest, icons and launch images, offline support, persistent storage, the update prompt and the install guide.
   - Deploy it, then test on the phone.
5. **Piggy banks:** everything in §8.6, including the pig animations and celebrations, plus piggy plans in setup.
6. **Recurring, rollover and recap:** §8.7 and §8.8, smarter setup hints, and leftover to piggy.
7. **Insights and search:** §8.9.
8. **Privacy, backup and settings:**
   - §8.10 to §8.12.
   - A final polish, accessibility and performance pass, then redeploy.

## 15. Success criteria

- I log every expense for a full month without it feeling like a chore.
- A typical expense takes 3 seconds or less to log; a favorite takes about 1 second.
- The app works in airplane mode after installing.
- The numbers always follow the rules in §7, and all unit tests pass.
- It feels as polished as the inspiration apps.

## 16. Open questions

- ~~The app icon~~: decided, see §17 answer 11.
- Add a light theme later?
- Should a forgotten expense be allowed into last month during a short grace period (e.g. the first 2 days of the new month)? v1: no.
- Small details still to decide; see "Decisions to make later" in PROGRESS.md.

## 17. Answers to the setup questions (26 October 2026)

1. **App name:** Onyx. Backup files are `onyx-backup-YYYY-MM-DD.json`.
2. **Saving more than planned** in a save bucket shows "₹X extra put away", never red (§7.2).
3. **No per-day amounts anywhere:** "safe per day" and "safe today" are removed, because they create anxiety. Home shows what's left this month; bucket cards show what's left of each bucket (§7.2, §7.3, §8.3).
4. **Piggy plan beats suggestion:** the Stash button and the monthly progress use the amount I planned in setup (§7.4).
5. **Yearly piggies:** each cycle's maths counts from the day after the previous target date. First version, to be refined (§7.4).
6. **Leftover money** ends with its month, and each new month starts fresh. Piggy savings carry across months. The optional "move leftover into a piggy" step stays. A leftover move counts as start-of-month money for the piggy's suggestion (§7.4, §8.6).
7. **`--text-3`** changed to `#83838D` for AA contrast (§10.2).
8. **Public repo:** the GitHub repo is public (was private). `design/inspo/` is git-ignored because those are other people's designs (§12).
9. **Design direction "Liquid"** (chosen from three concepts after the first design looked too close to the inspo): month tank, bucket vials, liquid fills everywhere, new tab bar. Replaces the aurora hero card and the 2-column bucket grid (§8.3, §9, §10).
10. **Bucket detail uses a tank** in the bucket's color with the pace notch, instead of a progress bar, to match the Liquid direction (§8.5). Day totals follow the entry rule: spent shows as −₹, a day with more money back than spent as +₹.
11. **App icon:** the pig filled with pink liquid on near-black (`public/icon.svg`). All icon sizes and the black iOS launch screens are generated from it at build time (§12.3).
12. **Changes after the first iPhone test (29 Oct 2026):**
    - **Swipe to delete:** swipe an entry left (in Recent, bucket detail and Activity) to reveal Delete; a full swipe deletes at once. Undo as always (§8.5).
    - **The month's budget can be changed after the month starts:** tap the month tank on Home to open the keypad. Unallocated / over-allocated updates live, and there's Undo (§8.2, §8.3).
    - **The note is presented as the entry's name** ("What was it? e.g. Starbucks"). It's the row's title, and the "logged" toast includes it (§8.4, §8.5).
13. **Piggy details (Phase 5):** only Insurance is a yearly template; yearly piggies need a date; auto-stash puts in what's left of the month's plan once (piggies created this month start next month); moving what's left from a done piggy into another is a spend plus an opening amount, never a stash (§8.6).
14. **Month-end details (Phase 6):** the recap's biggest expense and most-used bucket count spend buckets only; the Piggies card lists every piggy that existed that month; the comparison is neutral (↑/↓ with a percentage, "New" for new buckets); the leftover step is offered only with an active piggy (§8.8).
15. **Insights details (Phase 7):** a day's bar is spend-bucket expenses minus money back; a net money-back day is tagged "+₹X" in green; past months' charts start on their last day; search shows results once something is typed or filtered, totalled as expenses minus money back (§8.9).
