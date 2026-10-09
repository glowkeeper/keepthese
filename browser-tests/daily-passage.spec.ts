import { expect, test } from '@playwright/test';

import { chooseDailyPassage } from '../src/lib/daily-passage';

// site-content imports astro:content, which Playwright cannot load, so the
// shelf order is read from its source text.
async function shelf() {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile('src/lib/site-content.ts', 'utf8');
  const block = /passageOrder = \[([\s\S]*?)\] as const/.exec(source)![1]!;
  return [...block.matchAll(/'([^']+)'/g)].map((match) => match[1]!);
}

test('the homepage offers today’s page for the UTC day without moving the studio', async ({
  page,
}) => {
  const ids = await shelf();
  // 00:30 on 10 October in Europe/London is still 9 October in UTC.
  const now = new Date('2026-10-09T23:30:00Z');
  await page.clock.install({ time: now });
  await page.goto('/');

  const link = page.getByRole('link', { name: /Today’s page/ });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute(
    'href',
    `/passages/${chooseDailyPassage(ids, now)}/`,
  );

  const rolled = new Date('2026-10-10T00:00:30Z');
  await page.clock.setFixedTime(rolled);
  await page.evaluate(() =>
    document.dispatchEvent(new Event('visibilitychange')),
  );
  await expect(link).toHaveAttribute(
    'href',
    `/passages/${chooseDailyPassage(ids, rolled)}/`,
  );
  expect(chooseDailyPassage(ids, rolled)).not.toBe(
    chooseDailyPassage(ids, now),
  );
});

test('today’s page opens that passage with its source credit', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Today’s page/ }).click();
  await expect(page).toHaveURL(/\/passages\/.+\//);
  await expect(
    page.getByRole('link', { name: /^Read .* at / }).first(),
  ).toBeVisible();
});

test('the studio does not move when the link appears', async ({ browser }) => {
  const studioTop = async (javaScriptEnabled: boolean) => {
    const context = await browser.newContext({ javaScriptEnabled });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4321/');
    if (javaScriptEnabled) {
      await expect(
        page.getByRole('link', { name: /Today’s page/ }),
      ).toBeVisible();
    }
    const top = (await page.locator('.studio').first().boundingBox())!.y;
    await context.close();
    return top;
  };

  // Without JavaScript the link never appears, so this is the server-rendered
  // layout that the hydrated page must match.
  expect(await studioTop(true)).toBe(await studioTop(false));
});

test('Explore and passage pages offer today’s page too', async ({ page }) => {
  await page.goto('/explore/');
  await expect(page.getByRole('link', { name: /Today’s page/ })).toBeVisible();
  await page.goto('/passages/alice-1865-chapter-1-daisy-chain/');
  await expect(page.getByRole('link', { name: /Today’s page/ })).toBeVisible();
});
