import { describe, expect, it } from 'vitest';

import {
  cacheVersion,
  precacheUrls,
  renderServiceWorker,
} from './service-worker-build.mjs';

describe('service worker build', () => {
  it('maps built files to the URLs the site serves', () => {
    expect(
      precacheUrls([
        'index.html',
        'explore/index.html',
        'passages/a-b/index.html',
        '404.html',
        '_astro/app.abc123.js',
        'favicon.svg',
      ]),
    ).toEqual([
      '/',
      '/404.html',
      '/_astro/app.abc123.js',
      '/explore/',
      '/favicon.svg',
      '/passages/a-b/',
    ]);
  });

  it('leaves out files that are not part of the application', () => {
    expect(
      precacheUrls([
        '_headers',
        'robots.txt',
        'sitemap.xml',
        'sw.js',
        'RIGHTS.md',
        'brand/RIGHTS.md',
        'index.html',
      ]),
    ).toEqual(['/']);
  });

  it('versions by content, independent of order', () => {
    const a = [
      ['a.html', 'one'],
      ['b.js', 'two'],
    ];
    expect(cacheVersion(a)).toBe(cacheVersion([...a].reverse()));
    expect(cacheVersion(a)).toMatch(/^[0-9a-f]{12}$/u);
    expect(cacheVersion(a)).not.toBe(
      cacheVersion([['a.html', 'changed'], a[1]]),
    );
    expect(cacheVersion(a)).not.toBe(
      cacheVersion([['renamed.html', 'one'], a[1]]),
    );
  });

  it('fills the template and refuses one with a missing marker', () => {
    const template =
      "const V = /* CACHE_VERSION */ 'development';\nconst U = /* PRECACHE_URLS */ [];\n";
    const rendered = renderServiceWorker(template, 'abc', ['/', '/x/']);
    expect(rendered).toContain('const V = /* CACHE_VERSION */ "abc";');
    expect(rendered).toContain('const U = /* PRECACHE_URLS */ ["/","/x/"];');
    expect(() => renderServiceWorker('const V = 1;', 'abc', [])).toThrow(
      /marker/u,
    );
  });
});
