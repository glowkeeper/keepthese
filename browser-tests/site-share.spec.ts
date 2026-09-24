import { expect, test, type Page } from '@playwright/test';

/**
 * The site share controls as a reader meets them: rendered into the layout's
 * header and footer, wired by the layout script, and reporting through one
 * live region. The unit tests cover the share-or-copy decision; these cover
 * that the controls are present, carry the canonical home link, are both
 * disabled while a share is in flight, and announce the outcome.
 *
 * The share sheet and clipboard are replaced before the page loads, so each
 * path can be driven deterministically and the copy can be held open long
 * enough to observe the in-flight state.
 */

const shareLabel = 'Share Keep These';

const layoutRoutes = [
  '/',
  '/explore/',
  '/blackout-poetry/',
  '/about/',
  '/privacy/',
  '/passages/frankenstein-1831-chapter-4-life-and-death/',
  '/journeys/thresholds-and-departures/',
];

type ShareStub = 'none' | 'share' | 'cancel';

interface ShareRecord {
  shared: ShareData[];
  copied: string[];
}

function headerShare(page: Page) {
  return page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('button', { name: shareLabel });
}

function footerShare(page: Page) {
  return page
    .getByRole('navigation', { name: 'Footer' })
    .getByRole('button', { name: shareLabel });
}

/** The home page's canonical URL, which both controls should share. */
async function canonicalHome(page: Page): Promise<string> {
  await page.goto('/');
  const href = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(href, 'the home page must declare its canonical URL').not.toBeNull();
  return href!;
}

async function stubShareServices(page: Page, mode: ShareStub): Promise<void> {
  await page.addInitScript((shareMode: ShareStub) => {
    const record = { shared: [] as ShareData[], copied: [] as string[] };
    let releaseCopy: () => void = () => undefined;

    Object.assign(window, {
      __siteShareRecord: record,
      __releaseCopy: () => releaseCopy(),
    });

    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value:
        shareMode === 'none'
          ? undefined
          : async (data: ShareData) => {
              record.shared.push(data);
              if (shareMode === 'cancel') {
                throw new DOMException('Dismissed', 'AbortError');
              }
            },
    });

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) =>
          new Promise<void>((resolve) => {
            record.copied.push(text);
            releaseCopy = resolve;
          }),
      },
    });
  }, mode);
}

function shareRecord(page: Page): Promise<ShareRecord> {
  return page.evaluate(
    () =>
      (window as unknown as { __siteShareRecord: ShareRecord })
        .__siteShareRecord,
  );
}

test('every page carrying the site chrome offers both share controls', async ({
  page,
}) => {
  const siteUrl = await canonicalHome(page);

  for (const route of layoutRoutes) {
    await page.goto(route);
    await expect(
      headerShare(page),
      `${route} must offer a header share control`,
    ).toBeVisible();
    await expect(
      footerShare(page),
      `${route} must offer a footer share control`,
    ).toBeVisible();
    await expect(headerShare(page)).toHaveAttribute('data-share-url', siteUrl);
    await expect(footerShare(page)).toHaveAttribute('data-share-url', siteUrl);
  }
});

test('the not-found page exposes no share control', async ({ page }) => {
  await page.goto('/this-page-does-not-exist/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'This page fell away.',
  );
  await expect(page.locator('[data-share-site]')).toHaveCount(0);
});

test('without a share sheet the link is copied, and both controls wait for it', async ({
  page,
}) => {
  const siteUrl = await canonicalHome(page);
  await stubShareServices(page, 'none');
  await page.goto('/about/');

  const controls = page.locator('[data-share-site]');
  await headerShare(page).click();

  // The copy is held open, so both controls must be disabled until it lands.
  await expect(controls.nth(0)).toBeDisabled();
  await expect(controls.nth(1)).toBeDisabled();
  await page.evaluate(() =>
    (window as unknown as { __releaseCopy: () => void }).__releaseCopy(),
  );

  await expect(page.locator('[data-share-feedback]')).toHaveText(
    'Keep These link copied.',
  );
  await expect(controls.nth(0)).toBeEnabled();
  await expect(controls.nth(1)).toBeEnabled();

  const { copied, shared } = await shareRecord(page);
  expect(shared).toEqual([]);
  expect(copied).toHaveLength(1);
  expect(copied[0]).toMatch(/^Keep These\n.+\n/u);
  expect(copied[0]?.endsWith(`\n${siteUrl}`)).toBe(true);
});

test('a completed share through the share sheet is announced and copies nothing', async ({
  page,
}) => {
  const siteUrl = await canonicalHome(page);
  await stubShareServices(page, 'share');
  await page.goto('/explore/');

  await headerShare(page).click();

  await expect(page.locator('[data-share-feedback]')).toHaveText(
    'Keep These shared.',
  );
  await expect(headerShare(page)).toBeEnabled();

  const { copied, shared } = await shareRecord(page);
  expect(shared).toHaveLength(1);
  expect(shared[0]).toMatchObject({ title: 'Keep These', url: siteUrl });
  expect(shared[0]?.text).toBeTruthy();
  expect(copied).toEqual([]);
});

test('dismissing the share sheet copies nothing and announces nothing', async ({
  page,
}) => {
  const siteUrl = await canonicalHome(page);
  await stubShareServices(page, 'cancel');
  await page.goto('/explore/');

  await footerShare(page).click();
  await expect(footerShare(page)).toBeEnabled();

  const { copied, shared } = await shareRecord(page);
  expect(shared).toHaveLength(1);
  expect(shared[0]).toMatchObject({ title: 'Keep These', url: siteUrl });
  expect(copied).toEqual([]);
  await expect(page.locator('[data-share-feedback]')).toHaveText('');
});

test('the header share icon is large enough to tap', async ({ page }) => {
  // WCAG 2.2 success criterion 2.5.8 sets a 24 by 24 CSS pixel minimum.
  await page.goto('/about/');
  const box = await headerShare(page).boundingBox();
  expect(box, 'the share icon must render').not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(24);
  expect(box!.height).toBeGreaterThanOrEqual(24);
});
