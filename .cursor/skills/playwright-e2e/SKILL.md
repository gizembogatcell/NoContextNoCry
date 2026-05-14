---
name: playwright-e2e
description: "Use when: running or authoring Playwright E2E tests, headed Chrome/Chromium, smoke checks, or mapping story ACs to browser automation. Invoked by #7 browser-e2e (*e2e, *smoke), not #6 tester."
---

# Skill: Playwright E2E (headed browser)

## When to use

- **#7 browser-e2e** runs `*e2e` or `*smoke` and the repo has **`e2e/`** + **`playwright.config.ts`** + **`@playwright/test`** in `package.json`.
- You need to **execute** tests in a **real browser** (Chromium / Chrome channel) and interpret **PASS/FAIL** for ACs.

## Preconditions (agent checklist)

1. `package.json` exists and lists **`@playwright/test`** (and usually `playwright` browsers installed via `npx playwright install`).
2. `playwright.config.ts` exists — `baseURL` should match `docs/architecture.md` **local dev URL** (e.g. `http://localhost:3000`).
3. Dev server is **running** OR tests start it via `webServer` in config — prefer documenting one approach in architecture.

If any item is missing: **do not pretend tests ran** — tell the user what to add and offer minimal file snippets from `docs/e2e-playwright.md`.

## Commands the #7 agent should run

From repo root (adjust package manager: `pnpm` / `yarn` / `npm`):

```bash
# Install browsers once per machine (CI or local)
npx playwright install chromium

# Headed run — visible Chrome/Chromium window (best for hackathon demos / debugging)
npx playwright test --headed

# Single file / grep
npx playwright test e2e/smoke.spec.ts --headed
npx playwright test --grep @smoke --headed

# HTML report after run
npx playwright show-report
```

**UI mode** (interactive): `npx playwright test --ui` — mention to user for manual exploration; agent usually uses `--headed` or CI default.

## Mapping AC → automation

1. Read the story **Acceptance Criteria** literally.
2. For each AC, decide: **automatable in Playwright** (DOM, navigation, API mock) vs **manual only** (subjective UX, performance).
3. Automatable ACs: add or extend specs under `e2e/` with **test.describe** / **test** titles that echo the AC id or text.
4. After run: paste **summary** (pass/fail counts, failing test names, first error stack line) into chat. Let **#6 tester** own story Status — you supply browser evidence in chat or `docs/qa-run-{date}.md` if the team wants a paper trail.

## Trace / debug on failure

```bash
npx playwright test --trace on
```

Then open trace: `npx playwright show-trace trace.zip` (path from CLI output).

## Security

- Do not commit **secrets** into specs; use `.env` + `process.env` and document in architecture.
- E2E against **local** or **staging** only unless user explicitly approves prod.

## Reference doc in this template

See **`docs/e2e-playwright.md`** for copy-paste `playwright.config.ts` starter and folder layout.
