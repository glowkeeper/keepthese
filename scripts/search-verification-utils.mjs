export const productionOrigin = 'https://keepthese.com';

export function decodeHtml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function attributes(source) {
  const result = new Map();
  for (const match of source.matchAll(
    /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gu,
  )) {
    result.set(
      match[1].toLowerCase(),
      decodeHtml(match[2] ?? match[3] ?? match[4] ?? ''),
    );
  }
  return result;
}

export function elements(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'giu'))].map(
    (match) => attributes(match[1]),
  );
}

export function metadata(html, selector, value) {
  return elements(html, 'meta').filter(
    (entry) => entry.get(selector)?.toLowerCase() === value.toLowerCase(),
  );
}

export function canonicalLinks(html) {
  return elements(html, 'link').filter((entry) =>
    entry.get('rel')?.toLowerCase().split(/\s+/u).includes('canonical'),
  );
}

export function jsonLdRecords(html) {
  return [...html.matchAll(/<script\b([^>]*)>(.*?)<\/script>/gisu)]
    .filter(
      (match) => attributes(match[1]).get('type') === 'application/ld+json',
    )
    .map((match) => JSON.parse(match[2]));
}

export function visibleHeading(html) {
  const match = html.match(/<h1\b[^>]*>(.*?)<\/h1>/isu);
  return match
    ? decodeHtml(
        match[1]
          .replace(/<[^>]+>/gu, '')
          .replace(/\s+/gu, ' ')
          .trim(),
      )
    : undefined;
}

export function sitemapUrls(xml) {
  const document = xml.match(
    /^\s*<\?xml\s+version="1\.0"\s+encoding="UTF-8"\?>\s*<urlset\s+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">(.*?)<\/urlset>\s*$/su,
  );
  if (!document) {
    throw new Error(
      'Sitemap must have an XML declaration and one sitemap urlset root.',
    );
  }

  const body = document[1];
  const entries = [...body.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<\/url>/gu)];
  const unmatched = body.replace(/<url>\s*<loc>[^<]+<\/loc>\s*<\/url>/gu, '');
  if (unmatched.trim() || entries.length === 0) {
    throw new Error(
      'Sitemap urlset must contain only non-empty url elements with one loc.',
    );
  }

  return entries.map((match) => {
    if (/&(?!amp;|quot;|#39;|lt;|gt;)/u.test(match[1])) {
      throw new Error('Sitemap locations must contain escaped XML entities.');
    }
    const value = decodeHtml(match[1]);
    const url = new URL(value);
    if (url.protocol !== 'https:') {
      throw new Error('Sitemap locations must be absolute HTTPS URLs.');
    }
    return url.href;
  });
}

export function assertPage(html, path) {
  const failures = [];
  const expectedCanonical = new URL(path, productionOrigin).href;
  const titleMatches = [...html.matchAll(/<title>(.*?)<\/title>/gisu)];
  const title =
    titleMatches.length === 1
      ? decodeHtml(titleMatches[0][1].trim())
      : undefined;
  if (!title) failures.push('expected exactly one non-empty title');
  const descriptions = metadata(html, 'name', 'description');
  const description = descriptions[0]?.get('content');
  if (descriptions.length !== 1 || !description)
    failures.push('expected exactly one non-empty description');
  const canonicals = canonicalLinks(html);
  if (
    canonicals.length !== 1 ||
    canonicals[0].get('href') !== expectedCanonical
  )
    failures.push(`canonical must be exactly ${expectedCanonical}`);

  for (const directive of ['robots', 'googlebot', 'bingbot']) {
    if (
      metadata(html, 'name', directive).some((entry) =>
        entry
          .get('content')
          ?.toLowerCase()
          .split(/[,\s]+/u)
          .includes('noindex'),
      )
    )
      failures.push(`${directive} contains noindex`);
  }

  const expectedMetadata = [
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', 'Keep These'],
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:url', expectedCanonical],
    ['property', 'og:image', `${productionOrigin}/brand/keep-these-og.png`],
    ['property', 'og:image:width', '1200'],
    ['property', 'og:image:height', '630'],
    ['property', 'og:image:alt', 'Keep These — find a poem hiding in a page'],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
    ['name', 'twitter:image', `${productionOrigin}/brand/keep-these-og.png`],
    ['name', 'twitter:image:alt', 'Keep These — find a poem hiding in a page'],
  ];
  for (const [selector, key, expected] of expectedMetadata) {
    const matches = metadata(html, selector, key);
    if (matches.length !== 1 || matches[0].get('content') !== expected)
      failures.push(`${key} must occur once and match page metadata`);
  }

  const records = jsonLdRecords(html);
  if (path === '/') {
    const record = records[0];
    if (
      records.length !== 1 ||
      record?.['@context'] !== 'https://schema.org' ||
      record?.['@type'] !== 'WebSite' ||
      record?.name !== 'Keep These' ||
      record?.description !== description ||
      record?.url !== expectedCanonical
    )
      failures.push('must contain exactly one accurate WebSite JSON-LD record');
  } else if (path.startsWith('/passages/') || path.startsWith('/journeys/')) {
    const record = records[0];
    const items = record?.itemListElement;
    if (
      records.length !== 1 ||
      record?.['@context'] !== 'https://schema.org' ||
      record?.['@type'] !== 'BreadcrumbList' ||
      items?.length !== 2 ||
      items[0]?.['@type'] !== 'ListItem' ||
      items[0]?.position !== 1 ||
      items[0]?.name !== 'Keep These' ||
      items[0]?.item !== `${productionOrigin}/` ||
      items[1]?.['@type'] !== 'ListItem' ||
      items[1]?.position !== 2 ||
      items[1]?.name !== visibleHeading(html) ||
      items[1]?.item !== expectedCanonical
    )
      failures.push(
        'must contain one breadcrumb matching its visible heading and URL',
      );
  } else if (records.length !== 0) failures.push('contains unexpected JSON-LD');

  return { canonical: expectedCanonical, description, failures, title };
}

export function robotsFailures(robots) {
  const lines = robots
    .split(/\r?\n/u)
    .map((line) => line.replace(/#.*$/u, '').trim());
  return [
    ...(!lines.some((line) => /^user-agent:\s*\*$/iu.test(line))
      ? ['robots.txt has no wildcard user-agent group']
      : []),
    ...(lines.some((line) => /^disallow:\s*\/$/iu.test(line))
      ? ['robots.txt disallows the entire site']
      : []),
    ...(!lines.some(
      (line) =>
        line.toLowerCase() === `sitemap: ${productionOrigin}/sitemap.xml`,
    )
      ? ['robots.txt does not declare the production sitemap']
      : []),
  ];
}
