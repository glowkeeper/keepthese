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

test('source details link back to the original work', async ({ page }) => {
  await page.getByText('About this page', { exact: true }).click();
  await expect(
    page.getByRole('link', {
      name: 'Read the 1831 edition at Project Gutenberg',
    }),
  ).toHaveAttribute('href', 'https://www.gutenberg.org/ebooks/42324');
  await expect(page.locator('.source-information cite')).toHaveText(
    'Frankenstein; Or, The Modern Prometheus',
  );
});

test('creative state lasts only until a full reload', async ({ page }) => {
  await page.getByRole('button', { exact: true, name: 'Keep Life' }).click();
  await expect(
    page.getByRole('button', { exact: true, name: 'Remove Life' }),
  ).toBeVisible();

  await page.reload();

  await expect(
    page.getByRole('button', { exact: true, name: 'Keep Life' }),
  ).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByLabel('Your poem text')).toHaveText(
    'Your chosen words will gather here.',
  );
});
