We're building a personal budget app from scratch in this folder. I'm not an experienced developer, so explain things simply and don't assume I know the tools.

PRD.md in this folder is the source of truth for what to build. Read all of it before doing anything else. The images in design/inspo/ are UI inspiration I like. Study them for mood and quality, but don't copy them.

== STEP 1: GET SET UP (no app code yet) ==
1. Read PRD.md and look at every image in design/inspo/.
2. Initialize a git repository with a sensible .gitignore.
3. Create CLAUDE.md, which is loaded at the start of every session, so keep it short. Include:
   - a short project summary
   - the tech stack
   - the commands to run, test and build
   - the rules below
   - the key design rules from PRD section 10
   - a note that PRD.md is the source of truth
4. Create PROGRESS.md with:
   - a checklist of every phase and feature from PRD section 14
   - a "Decisions" section
   - an "Ideas for later" section
   Update it at the end of every phase, so a new session can pick up exactly where we left off.
5. Ask me all your questions about anything unclear or contradictory in the PRD, in one numbered list. Wait for my answers, then update PRD.md with them.
6. Show me your plan for phase 1: the folder structure, the libraries and versions, and how data is saved. Wait for my OK.

== HOW WE WORK IN EVERY PHASE ==
- Build one phase at a time, in the order in PRD section 14. Never start the next phase until I say so.
- Before you tell me a phase is done:
  - Run the type check, the linter and all tests. Fix everything.
  - Start the app and use Playwright to screenshot every screen you touched at iPhone size: 390x844, plus 375 and 430 wide for the main screens.
  - Look at the screenshots yourself and compare them with PRD section 10. Fix anything that looks off: spacing, alignment, cut-off text, contrast, or anything that looks generic.
  - Tell me in simple words what you built, what you decided and why. Give me a short list of things to try myself.
  - Update PROGRESS.md and make a git commit with a clear message.
- If something in the PRD is unclear, ask me. Don't guess, and don't quietly change a requirement.
- If you think of a good feature that isn't in the PRD, add it to "Ideas for later" in PROGRESS.md. Don't build it.
- When I send you screenshots from my phone or describe a problem, fix it, then screenshot again to check.

== RULES THAT ALWAYS APPLY ==
- 100% offline and private:
  - no backend, accounts, AI, API keys or analytics
  - no external fonts or CDNs; bundle everything into the app
  - no network requests at runtime except loading the app itself
- Money is always stored as whole numbers of paise. Never use floating-point maths for money.
- All the rules and calculations from PRD section 7 live in plain TypeScript in src/domain/, with no React.
- Every worked example in PRD section 7.5 and every edge case in PRD section 13 gets a unit test.
- Past months are read-only.
- TypeScript strict mode, no "any". Small, focused components with clear names.
- Use the stack in PRD section 12. Ask me before adding any other library.
- Saved data must never be lost. Version the data shape, and whenever it changes, write a migration and a test for it.
- I'm on Windows. Give me commands that work in Cursor's terminal on Windows.

== DESIGN QUALITY BAR ==
This app has to look and feel like a premium, native iPhone app: dark, elegant and calm, at the level of the images in design/inspo/. A generic-looking UI isn't good enough.
- In phase 1, build the design preview page before any real screens (PRD section 14, phase 1).
  - It shows: colors, type scale, buttons, chips, cards, the hero card, a bucket card, entry rows, the keypad, a bottom sheet, the tab bar, and the pig illustration with its fill animation.
  - Screenshot it, then stop and wait for my feedback. We'll keep refining it until I love it.
- Use the design tokens from PRD section 10 everywhere. No one-off colors or sizes.
- Get the details right:
  - tabular numbers, with the ₹ sign and paise smaller and dimmer
  - safe areas around the notch and home indicator
  - tap targets at least 44px
  - smooth spring animations, with reduced-motion support
- The pig must be cute and drawn with care. It's the personality of the app.

== TESTING ON MY IPHONE ==
- Before we deploy, show me how to open the dev server on my iPhone over the same Wi-Fi: run it with --host, find my laptop's IP address, and allow it through Windows Firewall if needed. This is only for checking the look; installing to the home screen and offline mode need the deployed version.
- In phase 4, walk me step by step through deploying it for free and adding it to my iPhone's home screen. Recommend Vercel or Netlify connected to a private GitHub repo, so every push updates the app automatically.
- In phase 8, help me test backups on the real iPhone (PRD section 8.11), because the share sheet and the Files app only behave properly on the phone:
  1. Save a backup to the Files app.
  2. Erase all data in the app.
  3. Restore from that file and check that everything came back.
  4. Try "Undo restore".

Start with Step 1.
