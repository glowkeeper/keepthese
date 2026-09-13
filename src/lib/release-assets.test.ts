import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

async function pngDimensions(path: string) {
  const png = await readFile(path);
  expect(png.subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  return { height: png.readUInt32BE(20), width: png.readUInt32BE(16) };
}

describe('public release assets', () => {
  it('keeps reserved rights notices beside public visual assets', async () => {
    const [publicRights, brandRights, materialRights] = await Promise.all([
      readFile('public/RIGHTS.md', 'utf8'),
      readFile('public/brand/RIGHTS.md', 'utf8'),
      readFile('public/materials/RIGHTS.md', 'utf8'),
    ]);

    for (const asset of [
      'apple-touch-icon.png',
      'favicon-32.png',
      'favicon.svg',
    ]) {
      expect(publicRights).toContain(`\`${asset}\``);
    }
    for (const asset of [
      'keep-these-og.png',
      'keep-these-og.svg',
      'keep-these-square.png',
      'wordmark.svg',
    ]) {
      expect(brandRights).toContain(`\`${asset}\``);
    }
    for (const asset of [
      'charcoal-dense.webp',
      'dry-brush-feathered.webp',
      'graphite-soft.webp',
      'warm-paper.webp',
    ]) {
      expect(materialRights).toContain(`\`${asset}\``);
    }
  });

  it('ships the expected favicon and home-screen sizes', async () => {
    await expect(pngDimensions('public/favicon-32.png')).resolves.toEqual({
      height: 32,
      width: 32,
    });
    await expect(pngDimensions('public/apple-touch-icon.png')).resolves.toEqual(
      { height: 180, width: 180 },
    );
  });

  it('ships a full-size social image', async () => {
    await expect(
      pngDimensions('public/brand/keep-these-og.png'),
    ).resolves.toEqual({ height: 630, width: 1200 });
    await expect(
      pngDimensions('public/brand/keep-these-square.png'),
    ).resolves.toEqual({ height: 512, width: 512 });
  });

  it('keeps the vector identity named and accessible', async () => {
    const [favicon, wordmark] = await Promise.all([
      readFile('public/favicon.svg', 'utf8'),
      readFile('public/brand/wordmark.svg', 'utf8'),
    ]);
    expect(favicon).toContain('viewBox="0 0 64 64"');
    expect(wordmark).toContain('<title id="title">Keep These</title>');
  });
});
