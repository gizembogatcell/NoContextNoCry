# Playwright E2E (optional) — setup for hackathon projects

The **#7 browser-e2e** subagent runs Playwright after your app is a Node project with dependencies installed. This doc is the **minimal** layout that agent expects.

## 1. Install dependencies

```bash
npm add -D @playwright/test
npx playwright install chromium
```

(Use `pnpm` / `yarn` if your repo standard says so.)

## 2. `playwright.config.ts` (starter)

Create at repo root; set **`baseURL`** to your dev server from `docs/architecture.md`.

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

> **Note:** Adjust `webServer.command` / `url` to match your stack. If you always start the server yourself, remove `webServer` and run the app before `npx playwright test`.

## 3. Example smoke spec — `e2e/smoke.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test.describe('@smoke', () => {
  test('home loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
  });
});
```

## 4. Scripts (add to `package.json`)

```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:headed": "playwright test --headed",
    "e2e:ui": "playwright test --ui"
  }
}
```

## 5. Browser E2E agent (**optional**, not step 7 of mandatory pipeline)

When you want **headed Playwright** / real UI flows, run subagent **`#7 browser-e2e`** and `*e2e` or `*smoke`. **#6 tester** stays on **lint + unit/integration + AC vs test evidence**.

See **`.cursor/agents/07-browser-e2e.md`** and **`.cursor/skills/playwright-e2e/SKILL.md`**.
