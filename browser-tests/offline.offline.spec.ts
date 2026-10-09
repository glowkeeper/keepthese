import { readFile, writeFile } from 'node:fs/promises';

import { expect, test, type Page } from '@playwright/test';

async function waitForReadyOffline(page: Page) {
  await expect(page.locator('[data-offline-status]')).toHaveText(
    'Keep These is ready to use offline.',
  );
}

test('first visit offers nothing intrusive, then reports it is ready offline', async ({
  page,
}) => {
  const dialogs: string[] = [];
  page.on('dialog', (dialog) => dialogs.push(dialog.type()));
  await page.goto('/');

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('[data-install-button]')).toBeHidden();
  await expect(page.locator('[data-update-button]')).toBeHidden();
  await waitForReadyOffline(page);
  expect(dialogs).toEqual([]);
});

test('after one visit the whole site and the studio work with no network', async ({
  context,
  page,
}) => {
  await page.goto('/');
  await waitForReadyOffline(page);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Begin with this page')).toBeVisible();
  await expect(page.locator('[data-offline-status]')).toContainText(
    'You are offline',
  );

  // Making still works offline, including choosing and undoing words.
  await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
  await expect(page.getByLabel('Your poem text')).toHaveText('Life');

  // Other pages that were never opened are available too, with or without
  // the trailing slash that Cloudflare would normally add.
  await page.goto('/explore/');
  await expect(
    page.getByRole('heading', { name: 'Choose a page' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Today’s page/ })).toBeVisible();
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/passages/alice-1865-chapter-1-daisy-chain/');
  await expect(page.getByText('Alice')).not.toHaveCount(0);

  // An address that does not exist still gets Keep These's own not-found page.
  const response = await page.goto('/not-a-page/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('body')).toContainText('Keep These');
});

test('an update waits quietly, keeps unfinished work, and applies only on request', async ({
  page,
}) => {
  await page.goto('/');
  await waitForReadyOffline(page);
  // A returning visit, which the worker now controls: this is when an update
  // has to wait rather than take over.
  await page.reload();
  await waitForReadyOffline(page);
  await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
  await expect(page.getByLabel('Your poem text')).toHaveText('Life');

  // Deploy a changed worker (a new cache version) by rewriting the built file
  // the preview server serves, then restore it so other tests are unaffected.
  const workerFile = 'dist/sw.js';
  const original = await readFile(workerFile, 'utf8');
  try {
    await writeFile(
      workerFile,
      original.replace(
        /\/\* CACHE_VERSION \*\/ "[^"]*"/u,
        '/* CACHE_VERSION */ "updated-for-test"',
      ),
    );
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
    });

    const status = page.locator('[data-offline-status]');
    await expect(status).toContainText('An update is ready');
    await expect(status).toContainText('saved work is kept');
    await expect(page.locator('[data-update-button]')).toBeVisible();

    // Nothing reloaded by itself, and the poem in progress is untouched.
    await page.waitForTimeout(500);
    await expect(page.getByLabel('Your poem text')).toHaveText('Life');

    let reloaded = false;
    page.on('framenavigated', () => {
      reloaded = true;
    });
    await page.getByRole('button', { name: 'Update now' }).click();
    await expect.poll(() => reloaded).toBe(true);

    // After the maker chose to update, their unfinished poem is restored.
    await expect(page.getByLabel('Your poem text')).toHaveText('Life');
    await expect(
      page.getByText('Your saved work for this page has been restored.'),
    ).toBeVisible();
    const caches = await page.evaluate(() => globalThis.caches.keys());
    expect(caches).toEqual(['keepthese-updated-for-test']);
  } finally {
    await writeFile(workerFile, original);
  }
});

test('an update that fails to download leaves the working version in place', async ({
  context,
  page,
}) => {
  await page.goto('/');
  await waitForReadyOffline(page);
  await page.reload();
  await waitForReadyOffline(page);

  // A deployment whose file list includes something that cannot be fetched,
  // as an interrupted download would.
  const workerFile = 'dist/sw.js';
  const original = await readFile(workerFile, 'utf8');
  try {
    await writeFile(
      workerFile,
      original
        .replace(
          /\/\* CACHE_VERSION \*\/ "[^"]*"/u,
          '/* CACHE_VERSION */ "broken-for-test"',
        )
        .replace(
          /\/\* PRECACHE_URLS \*\/ \[/u,
          '/* PRECACHE_URLS */ ["/does-not-exist.js", ',
        ),
    );
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update().catch(() => undefined);
    });
    await page.waitForTimeout(1000);

    // No update is offered, the old cache is intact, and offline use works.
    await expect(page.locator('[data-update-button]')).toBeHidden();
    expect(await page.evaluate(() => globalThis.caches.keys())).toHaveLength(1);
    expect(await page.evaluate(() => globalThis.caches.keys())).not.toContain(
      'keepthese-broken-for-test',
    );
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('Begin with this page')).toBeVisible();
  } finally {
    await writeFile(workerFile, original);
  }
});

test('installing is a quiet footer button that appears only when the browser offers it', async ({
  page,
}) => {
  await page.goto('/');
  await waitForReadyOffline(page);
  await expect(
    page.getByRole('button', { name: 'Install Keep These' }),
  ).toBeHidden();

  await page.evaluate(() => {
    const offer = Object.assign(
      new Event('beforeinstallprompt', { cancelable: true }),
      {
        prompt: async () => {
          (
            window as Window & { __installPrompted?: boolean }
          ).__installPrompted = true;
        },
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      },
    );
    window.dispatchEvent(offer);
  });

  const install = page.getByRole('button', { name: 'Install Keep These' });
  await expect(install).toBeVisible();
  await expect(page.locator('.site-footer')).toContainText(
    'Install Keep These',
  );
  await install.click();
  await expect(install).toBeHidden();
  expect(
    await page.evaluate(
      () =>
        (window as Window & { __installPrompted?: boolean }).__installPrompted,
    ),
  ).toBe(true);
});

test('the manifest and icons are installable', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const response = await request.get(href!);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    display: 'standalone',
    name: 'Keep These',
    scope: '/',
    start_url: '/',
  });
  for (const icon of manifest.icons as { src: string }[]) {
    expect((await request.get(icon.src)).ok()).toBe(true);
  }
  // The worker must always be fetched fresh so updates are found.
  const worker = await request.get('/sw.js');
  expect(worker.headers()['cache-control']).toContain('no-cache');
});
