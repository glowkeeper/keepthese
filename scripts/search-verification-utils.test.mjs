import { describe, expect, it } from 'vitest';

import {
  assertPage,
  robotsFailures,
  sitemapUrls,
} from './search-verification-utils.mjs';

const origin = 'https://keepthese.com';

function homepage(overrides = '') {
  const title = 'Keep These — a quiet blackout poetry studio';
  const description =
    'Make blackout poetry from a carefully chosen shelf of classic writing.';
  return `<!doctype html><html><head>
    <title>${title}</title>
    <meta content="${description}" name="description">
    <link href="${origin}/" rel="canonical">
    <meta content="website" property="og:type">
    <meta content="Keep These" property="og:site_name">
    <meta content="${title}" property="og:title">
    <meta content="${description}" property="og:description">
    <meta content="${origin}/" property="og:url">
    <meta content="${origin}/brand/keep-these-og.png" property="og:image">
    <meta content="1200" property="og:image:width">
    <meta content="630" property="og:image:height">
    <meta content="Keep These — find a poem hiding in a page" property="og:image:alt">
    <meta content="summary_large_image" name="twitter:card">
    <meta content="${title}" name="twitter:title">
    <meta content="${description}" name="twitter:description">
    <meta content="${origin}/brand/keep-these-og.png" name="twitter:image">
    <meta content="Keep These — find a poem hiding in a page" name="twitter:image:alt">
    ${overrides}
    <script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      description,
      name: 'Keep These',
      url: `${origin}/`,
    })}</script>
  </head><body><h1>Keep These</h1></body></html>`;
}

function sitemap(body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

describe('search-output verification helpers', () => {
  it('accepts complete metadata regardless of attribute order', () => {
    expect(assertPage(homepage(), '/').failures).toEqual([]);
  });

  it('rejects duplicate canonical metadata', () => {
    expect(
      assertPage(
        homepage(`<link href="${origin}/duplicate/" rel="canonical">`),
        '/',
      ).failures,
    ).toContain(`canonical must be exactly ${origin}/`);
  });

  it('rejects missing required metadata', () => {
    const html = homepage().replace(
      /\s*<meta content="Make blackout poetry[^>]+name="description">/u,
      '',
    );
    expect(assertPage(html, '/').failures).toContain(
      'expected exactly one non-empty description',
    );
  });

  it('rejects malformed JSON-LD', () => {
    expect(() =>
      assertPage(
        homepage('<script type="application/ld+json">{broken}</script>'),
        '/',
      ),
    ).toThrow(SyntaxError);
  });

  it('parses a structurally valid sitemap', () => {
    expect(sitemapUrls(sitemap(`<url><loc>${origin}/</loc></url>`))).toEqual([
      `${origin}/`,
    ]);
  });

  it.each([
    [
      'missing urlset root',
      '<?xml version="1.0" encoding="UTF-8"?><loc>https://keepthese.com/</loc>',
    ],
    ['loc outside a url element', sitemap(`<loc>${origin}/</loc>`)],
    ['an empty url element', sitemap('<url></url>')],
    [
      'an unescaped entity',
      sitemap(`<url><loc>${origin}/?a=1&b=2</loc></url>`),
    ],
  ])('rejects a sitemap with %s', (_label, xml) => {
    expect(() => sitemapUrls(xml)).toThrow();
  });

  it('rejects crawler-wide disallow rules', () => {
    expect(
      robotsFailures(
        `User-agent: *\nDisallow: /\nSitemap: ${origin}/sitemap.xml`,
      ),
    ).toContain('robots.txt disallows the entire site');
  });
});
