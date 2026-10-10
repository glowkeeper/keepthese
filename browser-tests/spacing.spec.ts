import { expect, test, type Page } from '@playwright/test';

// The site's vertical rhythm is built from three steps: the gap from the
// header to a page's first content, the gap between neighbouring items in one
// group, and the larger gap between major sections. These tests assert that
// comparable elements use the same step, rather than pinning pixel values, so
// they hold at every viewport width.

async function gapBetween(page: Page, upper: string, lower: string) {
  return page.evaluate(
    ([upperSelector, lowerSelector]) => {
      const a = document.querySelector(upperSelector!);
      const b = document.querySelector(lowerSelector!);
      if (!a || !b) return null;
      return b.getBoundingClientRect().top - a.getBoundingClientRect().bottom;
    },
    [upper, lower],
  );
}

async function ready(page: Page, path: string, selector: string) {
  await page.goto(path);
  await expect(page.locator(selector).first()).toBeVisible();
}

test('the homepage line sits above the studio as passage controls do', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Today’s page/ })).toBeVisible();
  const homepage = await gapBetween(
    page,
    '.todays-page-line',
    '.studio-introduction',
  );

  await ready(
    page,
    '/passages/alice-1865-chapter-1-daisy-chain/',
    '.passage-discovery--local',
  );
  const passage = await gapBetween(
    page,
    '.passage-discovery--local',
    '.studio-introduction',
  );

  expect(homepage).not.toBeNull();
  expect(homepage).toBe(passage);
});

test('Today’s page reads as one line of text, wrapping like any link', async ({
  page,
}) => {
  await page.setViewportSize({ height: 800, width: 360 });
  await page.goto('/');
  const link = page.getByRole('link', { name: /Today’s page/ });
  await expect(link).toBeVisible();
  await expect(link).toHaveCSS('display', 'block');

  // The title follows its label directly, not in a column of its own.
  const gap = await link.evaluate((element) => {
    const cite = element.querySelector('cite')!;
    const label = document.createRange();
    label.setStart(element.firstChild!, 0);
    label.setEnd(element.firstChild!, element.firstChild!.textContent!.length);
    return cite.getClientRects()[0]!.left - label.getBoundingClientRect().right;
  });
  expect(gap).toBeLessThan(16);
  expect(gap).toBeGreaterThanOrEqual(0);
});

for (const [name, path, selector, section] of [
  ['Explore', '/explore/', '.explore-introduction', '.explore-page'],
  ['My poems', '/my-poems/', '.my-poems-introduction', '.my-poems'],
] as const) {
  test(`${name} starts its first section as pages start their content`, async ({
    page,
  }) => {
    await ready(page, path, selector);
    await expect(page.locator(section)).toBeVisible();

    const headerToIntroduction = await gapBetween(
      page,
      '.site-header',
      selector,
    );
    const introductionToSection = await gapBetween(page, selector, section);

    expect(headerToIntroduction).not.toBeNull();
    expect(introductionToSection).toBe(headerToIntroduction);
  });
}

test('the My poems status line takes no space until it has something to say', async ({
  page,
}) => {
  await page.goto('/my-poems/');
  await expect(page.locator('.my-poems-status')).toBeAttached();
  const height = await page
    .locator('.my-poems-status')
    .evaluate((element) => element.getBoundingClientRect().height);
  expect(height).toBe(0);
});

test('major sections and the footer share one gap on every route', async ({
  page,
}) => {
  const gaps = new Set<number>();
  for (const [path, last] of [
    ['/about/', 'article'],
    ['/privacy/', 'article'],
    ['/blackout-poetry/', 'article'],
    ['/explore/', '.explore-page > section:last-child'],
    ['/passages/alice-1865-chapter-1-daisy-chain/', '.studio'],
  ] as const) {
    await ready(page, path, last);
    const gap = await gapBetween(page, last, '.site-footer');
    expect(gap).not.toBeNull();
    gaps.add(gap!);
  }
  expect([...gaps]).toHaveLength(1);
});

test('nothing overflows horizontally on the pages whose spacing changed', async ({
  page,
}) => {
  await page.setViewportSize({ height: 800, width: 320 });
  for (const path of ['/', '/explore/', '/my-poems/']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
