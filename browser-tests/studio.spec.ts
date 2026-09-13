import { readFile } from 'node:fs/promises';

import { expect, test, type Page } from '@playwright/test';

import { encodePoemFragment } from '../src/lib/stateless-poem-link';

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
    .getByRole('link', { name: /Persuasion Jane Austen Chapter IV/ })
    .click();

  await expect(page).toHaveURL(
    /\/passages\/persuasion-1818-chapter-4-prudence-and-romance\/$/,
  );
  await expect(page.locator('#studio-heading')).toHaveText('Persuasion');
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
    .getByRole('link', {
      name: /Frankenstein; Or, The Modern Prometheus Mary Wollstonecraft Shelley/,
    })
    .click();
  await expect(page).toHaveURL(
    /\/passages\/frankenstein-1831-chapter-4-life-and-death\/$/,
  );
  await expect(
    page.getByRole('button', { exact: true, name: 'Remove Life' }),
  ).toBeVisible();
  await expect(page.getByLabel('Your poem text')).toHaveText('Life');
});

test('surprise me replaces the current page in one action', async ({
  page,
}) => {
  await page.evaluate(() => {
    Math.random = () => 0.999;
  });
  await page.getByRole('link', { name: 'Surprise me' }).click();

  await expect(page).toHaveURL(
    /\/passages\/pointed-firs-1896-dunnet-landing\/$/,
  );
  await expect(
    page.getByRole('heading', {
      name: 'Frankenstein; Or, The Modern Prometheus',
    }),
  ).toHaveCount(0);
  await expect(page.getByLabel('Your poem text')).toHaveText(
    'Your chosen words will gather here.',
  );
});

test('modified Surprise clicks retain ordinary link behaviour', async ({
  page,
}) => {
  const defaultPrevented = await page
    .getByRole('link', { name: 'Surprise me' })
    .evaluate((link) => {
      const event = new MouseEvent('click', {
        bubbles: true,
        button: 0,
        cancelable: true,
        metaKey: true,
      });
      link.dispatchEvent(event);
      return event.defaultPrevented;
    });

  expect(defaultPrevented).toBe(false);
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
    .getByRole('link', { name: 'Begin this 5-page path' })
    .first()
    .click();

  await expect(page).toHaveURL(/\/journeys\/thresholds-and-departures\/$/);
  await expect(page.getByText('Literary path · page 1 of 5')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: "Alice's Adventures in Wonderland" }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Previous page' }),
  ).toBeDisabled();

  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText('Literary path · page 2 of 5')).toBeVisible();
  await expect(page.locator('#journey-heading')).toBeFocused();

  await page.getByRole('link', { name: 'Leave this path' }).click();
  await expect(page).toHaveURL(
    /\/passages\/jane-eyre-1847-chapter-10-wide-world\/$/,
  );
  await expect(page.locator('.active-journey')).toHaveCount(0);
  await expect(page.locator('#studio-heading')).toHaveText(
    'Jane Eyre: An Autobiography',
  );
});

test('a literary path resolves into a five-poem sequence', async ({ page }) => {
  test.slow();
  await enablePngSharing(page);
  await page.getByText('Follow a literary path', { exact: true }).click();
  await page
    .getByRole('link', { name: 'Begin this 5-page path' })
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

  await page.getByRole('link', { name: 'Choose another path' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.studio')).toBeVisible();
});

test('release metadata and local brand assets are complete', async ({
  page,
}) => {
  await expect(page).toHaveTitle('Keep These — a blackout poetry studio');
  await expect(page.locator('.site-header .eyebrow')).toHaveText(
    'A blackout poetry studio',
  );
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
  await expect(
    page.getByRole('link', { name: 'How-to', exact: true }),
  ).toHaveAttribute('href', '/blackout-poetry/');
  await expect(page.getByRole('link', { name: 'About' })).toHaveAttribute(
    'href',
    '/about/',
  );
  await expect(page.getByRole('link', { name: 'Privacy' })).toHaveAttribute(
    'href',
    '/privacy/',
  );
  await expect(page.locator('.site-footer')).toContainText('© 2026 Keep These');

  for (const path of [
    '/favicon.svg',
    '/favicon-32.png',
    '/apple-touch-icon.png',
    '/brand/keep-these-og.png',
  ]) {
    expect((await page.request.get(path)).status()).toBe(200);
  }
});

test('search metadata describes the site and exact canonical route set', async ({
  page,
}) => {
  const websiteData = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      '',
  );
  expect(websiteData).toEqual({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    description:
      'Make blackout poetry from a carefully chosen shelf of classic writing.',
    name: 'Keep These',
    url: 'https://keepthese.com/',
  });

  const sitemapResponse = await page.request.get('/sitemap.xml');
  expect(sitemapResponse.status()).toBe(200);
  expect(sitemapResponse.headers()['content-type']).toContain('xml');
  const sitemap = await sitemapResponse.text();
  expect([...sitemap.matchAll(/<loc>/gu)]).toHaveLength(27);
  expect(sitemap).toContain('<loc>https://keepthese.com/about/</loc>');
  expect(sitemap).toContain('<loc>https://keepthese.com/privacy/</loc>');
  expect(sitemap).toContain(
    '<loc>https://keepthese.com/passages/frankenstein-1831-chapter-4-life-and-death/</loc>',
  );
  expect(sitemap).toContain(
    '<loc>https://keepthese.com/journeys/thresholds-and-departures/</loc>',
  );
  expect(sitemap).not.toContain('#poem=');
  expect(sitemap).not.toContain('/404');
});

test('a passage route provides editorial context and opens its studio page', async ({
  page,
}) => {
  await page.goto('/passages/persuasion-1818-chapter-4-prudence-and-romance/');

  await expect(page).toHaveTitle(
    'Make blackout poetry from Persuasion — Keep These',
  );
  await expect(page.locator('.discovery-context')).toContainText(
    'Anne Elliot looks back at the advice that separated her from an early attachment.',
  );
  await expect(page.getByRole('heading', { name: 'Persuasion' })).toHaveCount(
    2,
  );
  const breadcrumbData = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      '',
  );
  expect(breadcrumbData.itemListElement[1].name).toBe('Persuasion');
  await page.getByText('Choose a page', { exact: true }).click();
  await expect(
    page.getByRole('link', {
      name: /Persuasion.*Jane Austen.*Chapter IV/,
    }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(
    page.getByRole('link', { name: 'Divided and becoming' }),
  ).toHaveAttribute('href', '/journeys/divided-and-becoming/');
});

test('a journey route provides its reading context and starts at page one', async ({
  page,
}) => {
  await page.goto('/journeys/thresholds-and-departures/');

  await expect(page.locator('.discovery-context')).toContainText(
    'This five-page path begins beside Alice’s riverbank',
  );
  await expect(page.getByText('Literary path · page 1 of 5')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: "Alice's Adventures in Wonderland" }),
  ).toBeVisible();
  const breadcrumbData = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      '',
  );
  expect(breadcrumbData['@type']).toBe('BreadcrumbList');
  expect(breadcrumbData.itemListElement).toEqual([
    {
      '@type': 'ListItem',
      item: 'https://keepthese.com/',
      name: 'Keep These',
      position: 1,
    },
    {
      '@type': 'ListItem',
      item: 'https://keepthese.com/journeys/thresholds-and-departures/',
      name: 'Thresholds and departures',
      position: 2,
    },
  ]);
});

test('the blackout poetry guide explains the authorship boundary', async ({
  page,
}) => {
  await page.goto('/blackout-poetry/');

  await expect(page.locator('.site-header .eyebrow')).toHaveText(
    'A guide to blackout poetry',
  );

  await expect(
    page.getByRole('heading', { name: 'How to make blackout poetry' }),
  ).toBeVisible();
  await expect(page.locator('.practice-guide')).toContainText(
    'Keep These does not generate a poem or suggest which words belong together.',
  );
  await expect(page.locator('.practice-guide')).toContainText(
    'not affiliated with or endorsed by Psyche, Andrew Lavers or Austin Kleon',
  );
  await expect(page.locator('.practice-guide')).toContainText(
    'Every page names its original author and links back to the source edition.',
  );
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(
    0,
  );
});

test('about and privacy pages explain the project and its private design', async ({
  page,
}) => {
  await page.goto('/about/');
  await expect(page.locator('.site-header .eyebrow')).toHaveText(
    'The project and its principles',
  );
  await expect(page.locator('.site-header .introduction')).toHaveText(
    'An instrument for finding poems in existing writing.',
  );
  await expect(
    page.getByRole('heading', { name: 'About Keep These' }),
  ).toBeVisible();
  await expect(page.locator('.practice-guide')).toContainText(
    'Keep These is a blackout-poetry app that never chooses words or composes a poem for you.',
  );
  await expect(
    page.getByRole('link', { name: 'blackout-poetry app' }),
  ).toHaveAttribute('href', '/blackout-poetry/');

  await page.goto('/privacy/');
  await expect(page.locator('.site-header .eyebrow')).toHaveText(
    'How your work stays private',
  );
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
  await expect(page.locator('.practice-guide')).toContainText(
    'no accounts, analytics, advertising trackers, or poem uploads',
  );
});

test('editorial entry points remain readable without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto('/passages/persuasion-1818-chapter-4-prudence-and-romance/');
  await expect(page.locator('.discovery-context')).toContainText(
    'Anne Elliot looks back at the advice that separated her from an early attachment.',
  );
  await expect(
    page.locator(
      '.passage-chooser a[href="/passages/frankenstein-1831-chapter-4-life-and-death/"]',
    ),
  ).toHaveAttribute(
    'href',
    '/passages/frankenstein-1831-chapter-4-life-and-death/',
  );
  await expect(page.getByRole('link', { name: 'Surprise me' })).toHaveAttribute(
    'href',
    '/passages/jane-eyre-1847-chapter-10-wide-world/',
  );

  await context.close();
});

test('unknown routes offer a calm way back', async ({ page }) => {
  await page.goto('/not-a-page');
  await expect(page).toHaveTitle('Page not found — Keep These');
  await expect(
    page.getByRole('heading', { name: 'This page fell away.' }),
  ).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(
    0,
  );
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

test('a poem link reconstructs attributed work without changing recipient work', async ({
  page,
}) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).hostname !== '127.0.0.1') {
      externalRequests.push(request.url());
    }
  });

  const savedWordId = await page
    .getByRole('button', { exact: true, name: 'Keep death' })
    .first()
    .getAttribute('data-word-id');
  expect(savedWordId).not.toBeNull();

  await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
  await page.getByRole('button', { name: 'Graphite' }).click();
  await page.getByRole('button', { name: 'Let the rest fall away' }).click();
  await page.getByRole('button', { name: 'Copy poem link' }).click();
  const poemLink = await page.getByLabel('Shareable poem link').inputValue();

  expect(poemLink).toContain(
    '/passages/frankenstein-1831-chapter-4-life-and-death/#poem=v1.',
  );
  expect(poemLink.length).toBeLessThan(240);
  expect(poemLink).not.toContain('Life');

  await page.getByRole('button', { exact: true, name: 'Ink' }).click();
  await expect(page.getByLabel('Shareable poem link')).toHaveCount(0);
  await expect(page.locator('.poem-link-status')).toHaveText(
    'Poem links contain your choices and require no account or upload.',
  );
  await page.getByRole('button', { name: 'Graphite' }).click();
  await page.getByRole('button', { name: 'Copy poem link' }).click();
  await expect(page.getByLabel('Shareable poem link')).toHaveValue(poemLink);

  const recipientState = {
    blackout: false,
    material: 'ink',
    passageId: 'frankenstein-1831-chapter-4-life-and-death',
    savedAt: '2026-09-12T12:00:00.000Z',
    schemaVersion: 1,
    selectedIds: [savedWordId],
    textVersion: 1,
  };
  await page.evaluate((state) => {
    localStorage.setItem(
      `keep-these:unfinished:${state.passageId}`,
      JSON.stringify(state),
    );
  }, recipientState);

  await page.goto(poemLink);
  await expect(
    page.getByRole('heading', { name: /Someone found these words in/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /Someone found these words in/ }),
  ).toBeFocused();
  await expect(page.getByLabel('Your poem text')).toHaveText('Life');
  await expect(page.getByLabel('Source passage')).toHaveClass(/blackout/);
  await expect(page.getByRole('button', { name: 'Graphite' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByRole('link', { name: /Read the 1831 edition/ }).first(),
  ).toBeVisible();
  expect(
    await page.evaluate(
      (passageId) => localStorage.getItem(`keep-these:unfinished:${passageId}`),
      recipientState.passageId,
    ),
  ).toBe(JSON.stringify(recipientState));

  await page
    .getByRole('button', { exact: true, name: 'Keep death' })
    .first()
    .click();
  await page.getByRole('button', { name: 'Clear shared changes' }).click();
  expect(
    await page.evaluate(
      (passageId) => localStorage.getItem(`keep-these:unfinished:${passageId}`),
      recipientState.passageId,
    ),
  ).toBe(JSON.stringify(recipientState));

  await page
    .getByRole('button', { name: 'Make your own from this page' })
    .click();
  await expect(
    page.getByText('Your saved work for this page has been restored.'),
  ).toBeVisible();
  await expect(page.getByLabel('Your poem text')).toHaveText('death');
  expect(new URL(page.url()).hash).toBe('');
  expect(externalRequests).toEqual([]);
});

test('a poem fragment on a journey route resolves to its passage canonical', async ({
  page,
}) => {
  const documentRequests: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'document')
      documentRequests.push(request.url());
  });
  const fragment = encodePoemFragment({
    blackout: true,
    material: 'ink',
    passageId: 'frankenstein-1831-chapter-4-life-and-death',
    selectedIds: ['word-0'],
    textVersion: 1,
  });

  await page.goto(`/journeys/divided-and-becoming/${fragment}`);

  expect(documentRequests).toEqual([
    'http://127.0.0.1:4321/journeys/divided-and-becoming/',
  ]);

  await expect
    .poll(() => new URL(page.url()).pathname)
    .toBe('/passages/frankenstein-1831-chapter-4-life-and-death/');
  expect(new URL(page.url()).hash).toBe(fragment);
  await expect(
    page.getByRole('heading', { name: /Someone found these words in/ }),
  ).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://keepthese.com/passages/frankenstein-1831-chapter-4-life-and-death/',
  );
});

test('a damaged poem link fails safely without changing saved work', async ({
  page,
}) => {
  const before = await page.evaluate(() => {
    localStorage.setItem('keep-these:unfinished:sentinel', 'keep me');
    return localStorage.getItem('keep-these:unfinished:sentinel');
  });

  await page.goto('/#poem=v1.damaged.deadbeef');
  await expect(page.locator('.poem-link-notice')).toContainText(
    'This poem link is damaged or uses a version Keep These does not support.',
  );
  await expect(page.getByRole('heading', { name: 'Your poem' })).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem('keep-these:unfinished:sentinel'),
    ),
  ).toBe(before);
});

test('a poem link for an unavailable passage version fails safely', async ({
  page,
}) => {
  const fragment = encodePoemFragment({
    blackout: true,
    material: 'ink',
    passageId: 'missing-passage',
    selectedIds: ['word-0'],
    textVersion: 99,
  });
  await page.goto(`/${fragment}`);

  await expect(page.locator('.poem-link-notice')).toHaveText(
    'This poem link refers to a page version that is not available here.',
  );
  await expect(
    page.getByRole('heading', {
      name: 'Frankenstein; Or, The Modern Prometheus',
    }),
  ).toBeVisible();
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
