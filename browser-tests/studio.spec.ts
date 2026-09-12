import { readFile } from 'node:fs/promises';

import { expect, test, type Page } from '@playwright/test';

async function enablePngSharing(
  page: Page,
  outcome: 'cancelled' | 'failed' | 'shared' = 'shared',
) {
  await page.addInitScript((shareOutcome) => {
    Object.defineProperty(Navigator.prototype, 'canShare', {
      configurable: true,
      value: (data: ShareData) =>
        data.files?.length === 1 && data.files[0]?.type === 'image/png',
    });
    Object.defineProperty(Navigator.prototype, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        const target = window as Window & { __shareCallCount?: number };
        target.__shareCallCount = (target.__shareCallCount ?? 0) + 1;
        if (shareOutcome === 'cancelled') {
          throw new DOMException('Share cancelled', 'AbortError');
        }
        if (shareOutcome === 'failed') {
          throw new DOMException('Share failed', 'NotAllowedError');
        }

        const file = data.files?.[0];
        if (!file) throw new Error('Shared PNG missing.');
        const bytes = new Uint8Array(await file.arrayBuffer());
        const view = new DataView(bytes.buffer);
        (
          window as Window & {
            __sharedPng?: {
              filename: string;
              height: number;
              signature: number[];
              size: number;
              width: number;
            };
          }
        ).__sharedPng = {
          filename: file.name,
          height: view.getUint32(20),
          signature: [...bytes.slice(0, 8)],
          size: file.size,
          width: view.getUint32(16),
        };
        await new Promise((resolve) => window.setTimeout(resolve, 100));
      },
    });
  }, outcome);
  await page.reload();
  await expect(page.locator('astro-island')).not.toHaveAttribute('ssr', '');
}

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

test('source attribution is visible without opening a disclosure', async ({
  page,
}) => {
  expect(await page.content()).not.toContain(
    'The paragraph offers vivid, opposing images and flexible language',
  );
  await expect(page.locator('.passage-context')).toHaveText(
    'In Chapter IV of Shelley’s revised 1831 edition, Victor Frankenstein recalls the ambition that drove his experiment.',
  );
  await expect(page.locator('.studio-introduction')).toContainText(
    'by Mary Wollstonecraft Shelley · first published 1818',
  );
  await expect(
    page.locator('.studio-introduction').getByRole('link', {
      name: 'Read the 1831 edition at Project Gutenberg',
    }),
  ).toHaveAttribute('href', 'https://www.gutenberg.org/ebooks/42324');
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
  await expect(page.locator('.source-credit')).toContainText(
    '1831 revised edition · Chapter IV',
  );
  await expect(page.locator('.source-credit')).toContainText(
    'Transcription produced by Greg Weeks, Mary Meehan and the Online Distributed Proofreading Team.',
  );
  await expect(
    page.locator('.source-credit').getByRole('link', {
      name: 'Read the 1831 edition at Project Gutenberg',
    }),
  ).toHaveAttribute('href', 'https://www.gutenberg.org/ebooks/42324');
  await expect(page.getByText('Source details', { exact: true })).toHaveCount(
    0,
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
  await expect(
    page.getByText('Your saved work for this page has been restored.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Restart' }).click();
  await expect(
    page.getByText('Your saved work for this page has been restored.'),
  ).toHaveCount(0);
  await expect(page.getByLabel('Your poem text')).toHaveText(
    'Your chosen words will gather here.',
  );

  await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
  await page.getByRole('button', { name: 'Let the rest fall away' }).click();
  await expect(page.locator('.storage-status')).toHaveText(
    'Saved privately in this browser.',
  );

  await page.close();
  const reopenedPage = await context.newPage();
  await reopenedPage.goto('/');
  await expect(
    reopenedPage.getByRole('button', { exact: true, name: 'Remove Life' }),
  ).toBeVisible();
  await reopenedPage
    .getByRole('button', { name: 'Start this page again' })
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
  await expect(page.getByText('20 pages, carefully chosen')).toBeVisible();
  await expect(page.locator('.passage-chooser li')).toHaveCount(20);
  await page.getByText('How to choose words', { exact: true }).click();
  await expect(page.locator('.studio-help')).toHaveAttribute('open', '');

  await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
  await expect(page.locator('.storage-status')).toHaveText(
    'Saved privately in this browser.',
  );
  await page
    .getByRole('button', { name: /Persuasion Jane Austen Chapter IV/ })
    .click();

  await expect(page.getByRole('heading', { name: 'Persuasion' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Persuasion' })).toBeFocused();
  await expect(
    page.getByText('Choose a page', { exact: true }),
  ).not.toBeInViewport();
  await expect(page.locator('.studio-help')).not.toHaveAttribute('open', '');
  await expect(page.getByLabel('Your poem text')).toHaveText(
    'Your chosen words will gather here.',
  );
  await expect(
    page
      .getByRole('link', { name: 'Read Persuasion at Project Gutenberg' })
      .first(),
  ).toHaveAttribute('href', 'https://www.gutenberg.org/ebooks/105');

  await page.getByText('Choose a page', { exact: true }).click();
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

test('a finite literary path shows position and moves between its pages', async ({
  page,
}) => {
  await page.getByText('Follow a literary path', { exact: true }).click();
  await expect(page.locator('.journey-card')).toHaveCount(3);
  expect(await page.content()).not.toContain(
    'The sequence begins with curiosity, moves through a consciously imagined departure',
  );
  await page
    .getByRole('button', { name: 'Begin this 5-page path' })
    .first()
    .click();

  await expect(page.getByText('Literary path · page 1 of 5')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Thresholds and departures' }),
  ).toBeFocused();
  await expect(
    page.getByRole('heading', { name: "Alice's Adventures in Wonderland" }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Previous page' }),
  ).toBeDisabled();

  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText('Literary path · page 2 of 5')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Thresholds and departures' }),
  ).toBeFocused();

  await page.getByRole('button', { name: 'Leave this path' }).click();
  await expect(page.locator('.active-journey')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Jane Eyre: An Autobiography' }),
  ).toBeVisible();
});

test('a literary path resolves into a five-poem sequence', async ({ page }) => {
  await enablePngSharing(page);
  await page.getByText('Follow a literary path', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Begin this 5-page path' })
    .first()
    .click();

  for (let pageNumber = 1; pageNumber <= 5; pageNumber += 1) {
    await page.locator('.source-word').first().click();
    await page
      .getByRole('button', {
        name:
          pageNumber === 5
            ? 'Complete this path'
            : 'Keep this poem and continue',
      })
      .click();
  }

  await expect(page.getByText('Literary path complete')).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Your Thresholds and departures sequence',
    }),
  ).toBeFocused();
  await expect(
    page.getByRole('button', { name: 'Return to this poem' }),
  ).toHaveCount(5);
  await expect(page.locator('.journey-complete > ol > li')).toHaveCount(5);
  await expect(page.locator('.studio')).toHaveCount(0);

  const exportArtwork = page.locator('.journey-sequence-export');
  await expect(exportArtwork).toContainText('Keep These · literary path');
  await expect(exportArtwork.locator('.journey-sequence-page')).toHaveCount(5);
  await expect(
    exportArtwork.locator('.journey-sequence-page.source-page--blackout'),
  ).toHaveCount(5);
  await expect(exportArtwork.locator('.source-word--kept')).toHaveCount(5);
  await expect(exportArtwork).toContainText(
    "Alice's Adventures in Wonderland by Lewis Carroll (1865)",
  );
  await expect(exportArtwork).toContainText(
    'Transcription produced by Arthur DiBianca and David Widger.',
  );
  await expect(exportArtwork.locator('a').first()).toHaveAttribute(
    'href',
    'https://www.gutenberg.org/ebooks/11',
  );
  await expect(exportArtwork.locator('a').first()).toHaveAttribute(
    'tabindex',
    '-1',
  );
  await expect(exportArtwork.getByRole('button')).toHaveCount(0);

  const downloadPromise = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Download complete sequence' })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    'keep-these-thresholds-and-departures-sequence.png',
  );
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const png = await readFile(downloadPath!);
  expect(png.subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  expect(png.readUInt32BE(16)).toBeGreaterThanOrEqual(1800);
  expect(png.readUInt32BE(20)).toBeGreaterThan(png.readUInt32BE(16));
  await expect(page.locator('.journey-export-status')).toHaveText(
    'Complete sequence downloaded to your device.',
  );

  const secondDownloadPromise = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Download complete sequence' })
    .click();
  await secondDownloadPromise;

  await page
    .getByRole('button', { name: 'Share complete sequence' })
    .evaluate((button) => {
      const shareButton = button as HTMLButtonElement;
      shareButton.click();
      shareButton.click();
    });
  await expect(page.locator('.journey-export-status')).toHaveText(
    'Complete sequence passed to your device’s share controls.',
  );
  const sharedSequence = await page.evaluate(
    () =>
      (
        window as Window & {
          __sharedPng?: {
            filename: string;
            height: number;
            signature: number[];
            width: number;
          };
        }
      ).__sharedPng,
  );
  expect(sharedSequence?.filename).toBe(
    'keep-these-thresholds-and-departures-sequence.png',
  );
  expect(sharedSequence?.signature).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(sharedSequence?.width).toBeGreaterThanOrEqual(1800);
  expect(sharedSequence?.height).toBeGreaterThan(sharedSequence!.width);
  expect(
    await page.evaluate(
      () => (window as Window & { __shareCallCount?: number }).__shareCallCount,
    ),
  ).toBe(1);

  await page.setViewportSize({ height: 720, width: 320 });
  const actionLayout = await page
    .locator('.journey-actions')
    .evaluate((row) => {
      const rowRect = row.getBoundingClientRect();
      return [...row.children].every((child) => {
        const childRect = child.getBoundingClientRect();
        return (
          childRect.left >= rowRect.left && childRect.right <= rowRect.right
        );
      });
    });
  expect(actionLayout).toBe(true);

  await page.getByRole('button', { name: 'Choose another path' }).click();
  await expect(
    page.getByText('Follow a literary path', { exact: true }),
  ).toBeFocused();
  await expect(page.locator('.journey-chooser')).toHaveAttribute('open', '');
  await expect(page.locator('.studio')).toBeVisible();
});

test('release metadata and local brand assets are complete', async ({
  page,
}) => {
  await expect(page).toHaveTitle('Keep These');
  await expect(page.locator('.introduction')).toHaveText(
    'Find the poem that was waiting in the page.',
  );
  await expect(page.locator('.studio')).toHaveCSS('margin-top', '0px');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://keepthese.com/',
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://keepthese.com/brand/keep-these-og.png',
  );
  await expect(page.locator('.wordmark')).toHaveAttribute(
    'aria-label',
    'Keep These',
  );
  await expect(page.locator('.site-footer')).toContainText('Private by design');

  for (const path of [
    '/favicon.svg',
    '/favicon-32.png',
    '/apple-touch-icon.png',
    '/brand/keep-these-og.png',
  ]) {
    expect((await page.request.get(path)).status()).toBe(200);
  }
});

test('unknown routes offer a calm way back', async ({ page }) => {
  await page.goto('/not-a-page');
  await expect(page).toHaveTitle('Page not found — Keep These');
  await expect(
    page.getByRole('heading', { name: 'This page fell away.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Return to Keep These' }).click();
  await expect(page).toHaveURL('/');
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

  const exportedDecoration = await page.evaluate(async () => {
    const moduleUrl = '/src/lib/png-export.ts';
    const { prepareElementForExport } = await import(moduleUrl);
    const sourcePage = document.querySelector<HTMLElement>('.source-page');
    if (!sourcePage) throw new Error('Source page missing.');
    const clone = await prepareElementForExport(sourcePage);
    const paperOverlay = clone.querySelector(
      '[data-export-pseudo="before"]',
    ) as HTMLElement | null;
    return {
      backgroundImage: paperOverlay?.style.backgroundImage ?? '',
      exists: Boolean(paperOverlay),
    };
  });
  expect(exportedDecoration.exists).toBe(true);
  expect(exportedDecoration.backgroundImage).toContain('data:image/webp');

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
  await expect(page.getByRole('button', { name: 'Share PNG' })).toHaveCount(0);
});

test('supported native sharing receives the faithful attributed PNG', async ({
  page,
}) => {
  await enablePngSharing(page);
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).hostname !== '127.0.0.1') {
      externalRequests.push(request.url());
    }
  });

  await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
  await page.getByRole('button', { name: 'Let the rest fall away' }).click();
  await page.getByRole('button', { name: 'Share PNG' }).evaluate((button) => {
    const shareButton = button as HTMLButtonElement;
    shareButton.click();
    shareButton.click();
  });

  await expect(page.locator('.export-status')).toHaveText(
    'PNG passed to your device’s share controls.',
  );
  const shared = await page.evaluate(
    () =>
      (
        window as Window & {
          __sharedPng?: {
            filename: string;
            height: number;
            signature: number[];
            width: number;
          };
        }
      ).__sharedPng,
  );
  expect(shared?.filename).toBe(
    'keep-these-frankenstein-or-the-modern-prometheus.png',
  );
  expect(shared?.signature).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(shared?.width).toBeGreaterThanOrEqual(1200);
  expect(shared?.height).toBeGreaterThan(1200);
  expect(
    await page.evaluate(
      () => (window as Window & { __shareCallCount?: number }).__shareCallCount,
    ),
  ).toBe(1);
  expect(externalRequests).toEqual([]);
  await expect(page.getByLabel('Your poem text')).toHaveText('Life');
  await expect(
    page.getByRole('button', { name: 'Download PNG' }),
  ).toBeEnabled();
});

for (const outcome of ['cancelled', 'failed'] as const) {
  test(`native sharing ${outcome} without losing the poem or download`, async ({
    page,
  }) => {
    await enablePngSharing(page, outcome);
    await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
    await page.getByRole('button', { name: 'Share PNG' }).click();

    await expect(page.locator('.export-status')).toHaveText(
      outcome === 'cancelled'
        ? 'Sharing cancelled. Your poem is still here.'
        : "We couldn't open your device’s share controls. Your poem is still here; download remains available.",
    );
    await expect(page.getByLabel('Your poem text')).toHaveText('Life');
    await expect(page.getByRole('button', { name: 'Share PNG' })).toBeEnabled();
    await expect(
      page.getByRole('button', { name: 'Download PNG' }),
    ).toBeEnabled();

    await page.getByRole('button', { name: 'Share PNG' }).click();
    await expect(page.locator('.export-status')).toHaveText(
      outcome === 'cancelled'
        ? 'Sharing cancelled. Your poem is still here.'
        : "We couldn't open your device’s share controls. Your poem is still here; download remains available.",
    );
    expect(
      await page.evaluate(
        () =>
          (window as Window & { __shareCallCount?: number }).__shareCallCount,
      ),
    ).toBe(2);
  });
}

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
