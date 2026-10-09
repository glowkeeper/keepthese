import { readFile } from 'node:fs/promises';

import { expect, test, type Page } from '@playwright/test';

const passageId = 'frankenstein-1831-chapter-4-life-and-death';

async function archiveRecords(page: Page) {
  return page.evaluate(() =>
    Object.keys(localStorage)
      .filter((key) => key.startsWith('keep-these:archive:'))
      .map((key) => JSON.parse(localStorage.getItem(key)!)),
  );
}

async function openStudio(page: Page, path = '/') {
  await page.goto(path);
  await expect(page.locator('astro-island').first()).not.toHaveAttribute(
    'ssr',
    '',
  );
}

async function keepWords(page: Page) {
  await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
  await page
    .getByRole('button', { exact: true, name: 'Keep death' })
    .first()
    .click();
  await expect(page.getByLabel('Your poem text')).toHaveText('Life death');
}

test('saving is optional, explicit, and keeps the creative state and credit', async ({
  page,
}) => {
  await openStudio(page);
  const save = page.getByRole('button', { name: 'Save to my archive' });
  await expect(save).toBeDisabled();
  expect(await archiveRecords(page)).toEqual([]);

  await keepWords(page);
  // Choosing words alone never saves anything.
  expect(await archiveRecords(page)).toEqual([]);

  await page.getByRole('button', { name: 'Graphite' }).click();
  await save.click();

  await expect(page.locator('.archive-status')).toContainText(
    'Saved to your archive on this device.',
  );
  await expect(
    page.getByRole('button', { name: 'Saved to my archive' }),
  ).toBeDisabled();
  const [record] = await archiveRecords(page);
  expect(record).toMatchObject({
    material: 'graphite',
    passageId,
    poem: 'Life death',
    schemaVersion: 1,
    source: { title: expect.stringContaining('Frankenstein') },
  });
  expect(record.source.requiredCredit).toBeTruthy();
  expect(record.source.recordUrl).toMatch(/^https:\/\//);

  // A different poem can be saved as its own entry, never overwriting.
  await page.getByRole('button', { exact: true, name: 'Keep one' }).click();
  await expect(
    page.getByRole('button', { name: 'Save to my archive' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Save to my archive' }).click();
  expect(await archiveRecords(page)).toHaveLength(2);
});

test('the archive page lists saved poems, reopens a copy, exports text, and deletes', async ({
  page,
}) => {
  await openStudio(page);
  await keepWords(page);
  await page.getByRole('button', { name: 'Save to my archive' }).click();

  // Unfinished work for the page, which reopening must never change.
  const unfinishedKey = `keep-these:unfinished:${passageId}`;
  const unfinished = await page.evaluate(
    (key) => localStorage.getItem(key),
    unfinishedKey,
  );
  expect(unfinished).not.toBeNull();

  await page.getByRole('link', { name: 'View my poems' }).click();
  await expect(page).toHaveURL(/\/my-poems\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('My poems');
  await expect(page.getByText('Life death', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Browsers usually allow a site about 5 MB', {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.locator('.my-poems')).not.toContainText(
    /streak|views|likes|popular/i,
  );

  // Export: plain text with the poem, source and credit.
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download text/ }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^keep-these-frankenstein.*\.txt$/);
  const text = await readFile((await file.path())!, 'utf8');
  expect(text).toContain('Life death');
  expect(text).toContain('Mary Wollstonecraft Shelley');
  expect(text).toContain('Source:');

  // Reopen as a working copy.
  await page.getByRole('link', { name: /Open a working copy/ }).click();
  await expect(page).toHaveURL(/#archive=/);
  await expect(
    page.getByRole('heading', { name: /A working copy of your poem/ }),
  ).toBeFocused();
  await expect(page.getByLabel('Your poem text')).toHaveText('Life death');
  await expect(page.locator('.storage-status')).toContainText(
    'The saved poem and your unfinished work for this page have not been changed',
  );
  expect(
    await page.evaluate((key) => localStorage.getItem(key), unfinishedKey),
  ).toBe(unfinished);

  // Editing the copy changes neither the saved poem nor the unfinished work.
  await page
    .getByRole('button', { exact: true, name: 'Keep corruption' })
    .click();
  await page
    .getByRole('button', { name: 'Clear changes to this copy' })
    .click();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), unfinishedKey),
  ).toBe(unfinished);
  expect((await archiveRecords(page))[0].poem).toBe('Life death');

  await page
    .getByRole('button', { name: 'Make a new poem from this page' })
    .click();
  expect(new URL(page.url()).hash).toBe('');

  // Delete, with a confirmation that can be declined.
  await page.goto('/my-poems/');
  await page.getByRole('button', { name: /Delete the poem/ }).click();
  // Keyboard and screen-reader users land on the question, not on the page.
  await expect(
    page.getByRole('group', {
      name: 'Delete this poem? This cannot be undone.',
    }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Keep it' }).click();
  await expect(
    page.getByRole('button', { name: /Delete the poem/ }),
  ).toBeFocused();
  expect(await archiveRecords(page)).toHaveLength(1);

  await page.getByRole('button', { name: /Delete the poem/ }).click();
  await page.getByRole('button', { name: 'Delete poem' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Poem deleted from this browser.',
  );
  await expect(
    page.getByRole('heading', { name: 'Nothing saved yet' }),
  ).toBeVisible();
  expect(await archiveRecords(page)).toEqual([]);
});

test('a full browser store is reported honestly and the poem is not lost', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key.startsWith('keep-these:archive:')) {
        throw new DOMException('Full', 'QuotaExceededError');
      }
      return original.call(this, key, value);
    };
  });
  await openStudio(page);
  await keepWords(page);
  await page.getByRole('button', { name: 'Save to my archive' }).click();

  await expect(page.locator('.archive-status')).toContainText(
    'storage is full, so the poem was not saved',
  );
  await expect(page.getByLabel('Your poem text')).toHaveText('Life death');
  await expect(
    page.getByRole('button', { name: 'Save to my archive' }),
  ).toBeEnabled();
  await expect(
    page.getByRole('button', { name: 'Download PNG' }),
  ).toBeEnabled();
});

test('a saved poem that is missing or unreadable fails safely on reopen', async ({
  page,
}) => {
  await openStudio(page, `/passages/${passageId}/#archive=does-not-exist`);
  await expect(page.locator('.poem-link-notice')).toContainText(
    'could not be found in this browser',
  );
  await expect(page.getByLabel('Source passage')).toBeVisible();
});

test('a poem from an earlier page version keeps its words but cannot be reopened', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate((id) => {
    localStorage.setItem(
      'keep-these:archive:old',
      JSON.stringify({
        blackout: false,
        id: 'old',
        material: 'ink',
        passageId: id,
        poem: 'kept words',
        savedAt: '2026-10-01T09:00:00.000Z',
        schemaVersion: 1,
        selectedIds: ['word-1'],
        source: {
          author: 'Mary Shelley',
          chapter: 'Chapter IV',
          recordUrl: 'https://www.gutenberg.org/ebooks/84',
          requiredCredit: 'Text from Project Gutenberg.',
          sourceLabel: 'Project Gutenberg',
          title: 'Frankenstein',
        },
        textVersion: 999,
      }),
    );
  }, passageId);
  await page.goto('/my-poems/');

  await expect(page.getByText('kept words')).toBeVisible();
  await expect(page.getByText(/earlier version of its page/)).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Open a working copy/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: /Download text/ }),
  ).toBeVisible();
});

test('the footer reaches My poems on every page and the page has no horizontal scroll', async ({
  page,
}) => {
  await page.goto('/about/');
  await page.getByRole('link', { name: 'My poems' }).click();
  await expect(page).toHaveURL(/\/my-poems\/$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
