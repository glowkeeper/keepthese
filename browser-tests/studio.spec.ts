import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('astro-island')).not.toHaveAttribute('ssr', '');
});

test('pointer choices can be corrected and remain in source order', async ({
  page,
}) => {
  await page
    .getByRole('button', { exact: true, name: 'Keep death' })
    .first()
    .click();
  await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
  await expect(
    page.getByRole('button', { exact: true, name: 'Remove Life' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Your poem text')).toHaveText('Life death');

  await page.getByRole('button', { exact: true, name: 'Remove death' }).click();
  await expect(page.getByLabel('Your poem text')).toHaveText('Life');
});

test('keyboard choices announce status and can be undone', async ({ page }) => {
  const firstWord = page
    .getByRole('button', { exact: true, name: 'Keep No' })
    .first();
  await firstWord.focus();
  await page.keyboard.press('End');
  await expect(
    page.getByRole('button', { exact: true, name: 'Keep corruption' }),
  ).toBeFocused();
  await page.keyboard.press('Home');
  await expect(firstWord).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('button', { exact: true, name: 'Keep one' }),
  ).toBeFocused();

  const life = page.getByRole('button', { exact: true, name: 'Keep Life' });
  await life.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText(/Life kept. 1 word kept/);

  const death = page
    .getByRole('button', { exact: true, name: 'Keep death' })
    .first();
  await death.focus();
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Your poem text')).toHaveText('Life death');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByLabel('Your poem text')).toHaveText('Life');
});

test('blackout and restart remain recoverable', async ({ page }) => {
  await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
  await page.getByRole('button', { name: 'Let the rest fall away' }).click();
  await expect(page.getByLabel('Source passage')).toHaveClass(
    /source-page--blackout/,
  );
  await expect(page.getByRole('status')).toHaveText(
    'Unkept words have fallen away.',
  );

  await page.getByRole('button', { name: 'Undo' }).click();
  const restorePage = page.getByRole('button', { name: 'Bring the page back' });
  await expect(restorePage).toBeEnabled();
  await restorePage.click();
  await expect(page.getByLabel('Source passage')).not.toHaveClass(
    /source-page--blackout/,
  );

  await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
  await page.getByRole('button', { name: 'Let the rest fall away' }).click();
  await page.getByRole('button', { name: 'Restart' }).click();
  await expect(page.getByLabel('Source passage')).not.toHaveClass(
    /source-page--blackout/,
  );
  await expect(page.getByLabel('Your poem text')).toHaveText(
    'Your chosen words will gather here.',
  );
});

test('materials remain operable and selected words remain legible', async ({
  page,
}) => {
  await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
  await page.getByRole('button', { exact: true, name: 'Graphite' }).click();
  await expect(
    page.getByRole('button', { exact: true, name: 'Graphite' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Let the rest fall away' }).click();
  await expect(
    page.getByRole('button', { exact: true, name: 'Remove Life' }),
  ).toBeVisible();
  await expect(page.getByLabel('Your poem text')).toHaveText('Life');
});

test('source attribution is visible and details remain available', async ({
  page,
}) => {
  await expect(page.locator('.source-credit')).toContainText(
    'Frankenstein; Or, The Modern Prometheus by Mary Wollstonecraft Shelley',
  );
  await expect(
    page
      .getByRole('link', {
        name: 'Read the 1831 edition at Project Gutenberg',
      })
      .first(),
  ).toBeVisible();
  await page.getByText('Source details', { exact: true }).click();
  await expect(
    page.locator('.source-information').getByRole('link', {
      name: 'Read the 1831 edition at Project Gutenberg',
    }),
  ).toHaveAttribute('href', 'https://www.gutenberg.org/ebooks/42324');
  await expect(page.locator('.source-information cite')).toHaveText(
    'Frankenstein; Or, The Modern Prometheus',
  );
});

test('creative state is recovered after reload and reopening, then can be discarded', async ({
  context,
  page,
}) => {
  await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
  await page.getByRole('button', { exact: true, name: 'Graphite' }).click();
  await page.getByRole('button', { name: 'Let the rest fall away' }).click();
  await expect(page.locator('.storage-status')).toHaveText(
    'Saved privately in this browser.',
  );

  await page.reload();
  await expect(
    page.getByRole('button', { exact: true, name: 'Remove Life' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { exact: true, name: 'Graphite' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Source passage')).toHaveClass(
    /source-page--blackout/,
  );

  await page.close();
  const reopenedPage = await context.newPage();
  await reopenedPage.goto('/');
  await expect(
    reopenedPage.getByRole('button', { exact: true, name: 'Remove Life' }),
  ).toBeVisible();
  await reopenedPage
    .getByRole('button', { name: 'Discard saved work' })
    .click();
  await expect(reopenedPage.locator('.storage-status')).toHaveText(
    'Saved work discarded from this browser.',
  );

  await reopenedPage.reload();
  await expect(
    reopenedPage.getByRole('button', { exact: true, name: 'Keep Life' }),
  ).toHaveAttribute('aria-pressed', 'false');
  await expect(
    reopenedPage.getByRole('button', { exact: true, name: 'Ink' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(reopenedPage.getByLabel('Source passage')).not.toHaveClass(
    /source-page--blackout/,
  );
});

test('storage failure is explained without stopping the creative flow', async ({
  page,
}) => {
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Storage unavailable', 'SecurityError');
    };
  });

  await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
  await expect(page.getByLabel('Your poem text')).toHaveText('Life');
  await expect(page.locator('.storage-status')).toHaveText(
    'This browser is not allowing local saves. Your work will last only in this open page.',
  );
});

test('the complete shelf changes passages and keeps their work separate', async ({
  page,
}) => {
  await page.getByText('Choose a page', { exact: true }).click();
  await expect(page.locator('.passage-discovery li')).toHaveCount(10);

  await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
  await expect(page.locator('.storage-status')).toHaveText(
    'Saved privately in this browser.',
  );
  await page
    .getByRole('button', { name: /Persuasion Jane Austen Chapter IV/ })
    .click();

  await expect(page.getByRole('heading', { name: 'Persuasion' })).toBeVisible();
  await expect(page.getByLabel('Your poem text')).toHaveText(
    'Your chosen words will gather here.',
  );
  await expect(
    page
      .getByRole('link', { name: 'Read Persuasion at Project Gutenberg' })
      .first(),
  ).toHaveAttribute('href', 'https://www.gutenberg.org/ebooks/105');

  await page
    .getByRole('button', {
      name: /Frankenstein; Or, The Modern Prometheus Mary Wollstonecraft Shelley/,
    })
    .click();
  await expect(
    page.getByRole('button', { exact: true, name: 'Remove Life' }),
  ).toBeVisible();
  await expect(page.getByLabel('Your poem text')).toHaveText('Life');
});

test('surprise me replaces the current page in one action', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Surprise me' }).click();

  await expect(
    page.getByRole('heading', {
      name: 'Frankenstein; Or, The Modern Prometheus',
    }),
  ).toHaveCount(0);
  await expect(page.getByLabel('Your poem text')).toHaveText(
    'Your chosen words will gather here.',
  );
});

test('finished artwork downloads as a useful-resolution private PNG', async ({
  page,
}) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).hostname !== '127.0.0.1') {
      externalRequests.push(request.url());
    }
  });

  await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
  await page.getByRole('button', { exact: true, name: 'Graphite' }).click();
  await page.getByRole('button', { name: 'Let the rest fall away' }).click();
  await expect(page.locator('.source-credit')).toContainText(
    'Frankenstein; Or, The Modern Prometheus by Mary Wollstonecraft Shelley (1818)',
  );

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PNG' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    'keep-these-frankenstein-or-the-modern-prometheus.png',
  );
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const png = await readFile(downloadPath!);

  expect(png.subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  expect(png.readUInt32BE(16)).toBeGreaterThanOrEqual(1200);
  expect(png.readUInt32BE(20)).toBeGreaterThan(1200);
  expect(externalRequests).toEqual([]);
  await expect(page.locator('.export-status')).toHaveText(
    'PNG downloaded to your device.',
  );
  await expect(page.getByLabel('Your poem text')).toHaveText('Life');
});

test('PNG failure leaves the poem intact and offers a retry', async ({
  page,
}) => {
  await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toBlob = (callback) => callback(null);
  });

  await page.getByRole('button', { name: 'Download PNG' }).click();

  await expect(page.locator('.export-status')).toHaveText(
    "We couldn't create the PNG. Your poem is still here; please try again.",
  );
  await expect(
    page.getByRole('button', { name: 'Download PNG' }),
  ).toBeEnabled();
  await expect(page.getByLabel('Your poem text')).toHaveText('Life');
});
