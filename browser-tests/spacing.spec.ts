import { expect, test, type Browser, type Page } from '@playwright/test';

// The site's vertical rhythm is built from four steps (see
// docs/visual-direction.md): the visible gap from the header to the first line
// (`--first-content-gap`), the gap from an introduction to its first section
// (`--content-start-gap`), the gap between neighbouring items in one group
// (`--flow-gap`), and the larger gap between major sections and the footer
// (`--major-section-gap`). These tests assert that comparable elements use the
// same step, rather than pinning pixel values, so they hold at every viewport
// width.

// These tests load many pages in one test, which is quick locally but several
// times slower on CI, so they are given room instead of the 30 second default.
const slowTestTimeout = 90_000;

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

  // The title follows its label directly, not in a column of its own.
  const gap = await link.evaluate((element) => {
    const cite = element.querySelector('cite')!;
    const text = element.querySelector('.todays-page-text')!;
    const label = document.createRange();
    label.setStart(text.firstChild!, 0);
    label.setEnd(text.firstChild!, text.firstChild!.textContent!.length);
    return cite.getClientRects()[0]!.left - label.getBoundingClientRect().right;
  });
  expect(gap).toBeLessThan(16);
  expect(gap).toBeGreaterThanOrEqual(0);
});

test('Explore and My poems start their first section at the same distance', async ({
  page,
}) => {
  const gaps = new Set<number>();
  for (const [path, introduction, section] of [
    ['/explore/', '.explore-introduction', '.explore-page'],
    ['/my-poems/', '.my-poems-introduction', '.my-poems'],
  ] as const) {
    await ready(page, path, introduction);
    await expect(page.locator(section)).toBeVisible();
    const gap = await gapBetween(page, introduction, section);
    expect(gap).not.toBeNull();
    gaps.add(gap!);
  }
  expect([...gaps]).toHaveLength(1);
});

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

// Today's page is chosen in the browser from the UTC day, so a day is picked
// by faking the clock. Day n of the epoch shows the n-th passage on the shelf
// (there are 20), which lets every title be checked deterministically.
const shelfSize = 20;
const longestTitleDay = 4; // Narrative of the Life of Frederick Douglass.

function noonOfEpochDay(day: number) {
  return new Date(Date.UTC(1970, 0, 1 + day, 12));
}

async function studioTopWithoutScript(
  browser: Browser,
  viewport: { height: number; width: number },
) {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport,
  });
  const page = await context.newPage();
  await page.goto('/');
  const top = (await page.locator('.studio-introduction').boundingBox())!.y;
  await context.close();
  return top;
}

async function studioTopOnDay(
  browser: Browser,
  viewport: { height: number; width: number },
  day: number,
) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.clock.install({ time: noonOfEpochDay(day) });
  await page.goto('/');
  const link = page.getByRole('link', { name: /Today’s page/ });
  await expect(link).toBeVisible();
  const [top, linkHeight, slotHeight] = await page.evaluate(() => [
    document.querySelector('.studio-introduction')!.getBoundingClientRect().top,
    document.querySelector('.todays-page')!.getBoundingClientRect().height,
    document.querySelector('.todays-page-slot')!.getBoundingClientRect().height,
  ]);
  await context.close();
  return { linkHeight: linkHeight!, slotHeight: slotHeight!, top: top! };
}

test('the studio does not move when Today’s page appears, for the longest title at any width', async ({
  browser,
}) => {
  test.setTimeout(slowTestTimeout);
  for (const width of [320, 360, 393, 430, 600, 700, 800, 1280]) {
    const viewport = { height: 800, width };
    const baseline = await studioTopWithoutScript(browser, viewport);
    const hydrated = await studioTopOnDay(browser, viewport, longestTitleDay);

    expect(hydrated.top, `studio top at ${width}px`).toBe(baseline);
    expect(
      hydrated.linkHeight,
      `link fits its slot at ${width}px`,
    ).toBeLessThanOrEqual(hydrated.slotHeight);
  }
});

test('the studio does not move for any passage on the narrowest phone', async ({
  browser,
}) => {
  test.setTimeout(slowTestTimeout);
  const viewport = { height: 800, width: 320 };
  const baseline = await studioTopWithoutScript(browser, viewport);

  for (let day = 0; day < shelfSize; day += 1) {
    const hydrated = await studioTopOnDay(browser, viewport, day);
    expect(hydrated.top, `studio top on day ${day}`).toBe(baseline);
  }
});

test('a title clamped to two lines keeps its full text as the link name', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { height: 800, width: 320 },
  });
  const page = await context.newPage();
  await page.clock.install({ time: noonOfEpochDay(longestTitleDay) });
  await page.goto('/');
  const link = page.getByRole('link', { name: /Today’s page/ });
  await expect(link).toBeVisible();

  await expect(link).toHaveAccessibleName(/an American Slave/);
  const text = link.locator('.todays-page-text');
  await expect(text).toHaveCSS('overflow', 'hidden');
  const clipped = await text.evaluate(
    (element) => element.scrollHeight > element.clientHeight,
  );
  expect(clipped).toBe(true);
  await context.close();
});

// What is seen is the distance from the header to the cap line of the first
// line of text, not the distance between boxes: a large title has far more
// empty line height above its letters than a short line, so equal box gaps look
// unequal. The cap line is measured from the font itself, so it does not depend
// on which letter a title happens to start with.
const firstLines = [
  ['home', '/', '.todays-page-text'],
  ['explore', '/explore/', '.page-introduction > h1'],
  ['about', '/about/', '.page-introduction > h1'],
  ['how-to', '/blackout-poetry/', '.page-introduction > h1'],
  ['privacy', '/privacy/', '.page-introduction > h1'],
  ['my poems', '/my-poems/', '.page-introduction > h1'],
  [
    'passage',
    '/passages/alice-1865-chapter-1-daisy-chain/',
    '.passage-breadcrumb a',
  ],
  [
    'journey',
    '/journeys/thresholds-and-departures/',
    '.discovery-context > nav a',
  ],
] as const;

// The browser trims a text box to the font's declared capital height, while the
// measurement below uses the outline of the letter H, and the two can differ by
// about a pixel at these sizes in some fonts. The problems this guards against
// are several pixels (fonts) to twenty (a wrong step), so two pixels is tight.
const maximumCapLineDifference = 2;

async function capLineGap(page: Page, selector: string) {
  return page.evaluate((firstText) => {
    const element = document.querySelector(firstText)!;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    do {
      node = walker.nextNode();
    } while (node && !node.textContent?.trim());
    const range = document.createRange();
    range.selectNodeContents(node!);
    const rect = range.getClientRects()[0]!;
    const style = getComputedStyle(node!.parentElement!);
    const context = document.createElement('canvas').getContext('2d')!;
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const metrics = context.measureText('H');
    const capLine =
      rect.top +
      metrics.fontBoundingBoxAscent -
      metrics.actualBoundingBoxAscent;
    return (
      capLine -
      document.querySelector('.site-header')!.getBoundingClientRect().bottom
    );
  }, selector);
}

test('the visible gap from the header to the first line is the same on every route', async ({
  page,
}) => {
  test.setTimeout(slowTestTimeout);
  for (const width of [320, 390, 768, 1280, 1600]) {
    await page.setViewportSize({ height: 900, width });
    const gaps: Record<string, number> = {};
    for (const [name, path, selector] of firstLines) {
      await ready(page, path, selector);
      gaps[name] = await capLineGap(page, selector);
    }
    const reference = gaps.home!;
    for (const [name, gap] of Object.entries(gaps)) {
      expect(
        Math.abs(gap - reference),
        `${name} is ${gap.toFixed(1)}px from the header against ${reference.toFixed(1)}px on the homepage at ${width}px`,
      ).toBeLessThanOrEqual(maximumCapLineDifference);
    }
  }
});

// The same measurement with the site's fonts swapped out. This is what makes
// the match hold on platforms whose fallback fonts differ from the maintainer's.
const fontSets = [
  ['monospace', 'monospace'],
  ['Georgia', 'Verdana'],
  ['Times New Roman', 'Arial'],
] as const;

test('the visible gap does not depend on which fonts the browser uses', async ({
  page,
}, testInfo) => {
  test.setTimeout(slowTestTimeout);
  test.skip(
    testInfo.project.name !== 'desktop-chromium',
    'sets its own viewports',
  );
  for (const [serif, sans] of fontSets) {
    for (const width of [390, 1280]) {
      await page.setViewportSize({ height: 900, width });
      const gaps: Record<string, number> = {};
      for (const [name, path, selector] of firstLines) {
        await ready(page, path, selector);
        await page.addStyleTag({
          content: `:root, h1 { font-family: ${serif}, serif !important }
            .surprise-action, .passage-breadcrumb, .discovery-context nav, .eyebrow, .site-header { font-family: ${sans}, sans-serif !important }`,
        });
        gaps[name] = await capLineGap(page, selector);
      }
      const reference = gaps.home!;
      for (const [name, gap] of Object.entries(gaps)) {
        expect(
          Math.abs(gap - reference),
          `${name} is ${gap.toFixed(1)}px against ${reference.toFixed(1)}px on the homepage in ${serif} and ${sans} at ${width}px`,
        ).toBeLessThanOrEqual(maximumCapLineDifference);
      }
    }
  }
});

test('the homepage gap does not change with the length of the day’s title', async ({
  browser,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-chromium',
    'sets its own viewports',
  );
  test.setTimeout(slowTestTimeout);
  for (const width of [390, 600]) {
    // One page per width, moved from day to day by changing the clock and
    // letting the page recompute, which is what a tab left open does.
    const context = await browser.newContext({
      viewport: { height: 800, width },
    });
    const page = await context.newPage();
    await page.clock.install({ time: noonOfEpochDay(0) });
    await page.goto('/');
    const title = page.locator('.todays-page cite');
    await expect(title).toBeVisible();

    const gaps = new Set<number>();
    const seen = new Set<string>();
    let previous = await title.textContent();
    gaps.add(
      Math.round((await capLineGap(page, '.todays-page-text')) * 10) / 10,
    );
    seen.add(previous!);
    for (let day = 1; day < shelfSize; day += 1) {
      await page.clock.setFixedTime(noonOfEpochDay(day));
      await page.evaluate(() =>
        document.dispatchEvent(new Event('visibilitychange')),
      );
      await expect(title).not.toHaveText(previous!);
      previous = await title.textContent();
      seen.add(previous!);
      gaps.add(
        Math.round((await capLineGap(page, '.todays-page-text')) * 10) / 10,
      );
    }
    await context.close();

    expect(seen.size, `every passage was shown at ${width}px`).toBe(shelfSize);
    expect([...gaps], `homepage gaps by day at ${width}px`).toHaveLength(1);
  }
});
