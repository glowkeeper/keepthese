import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import {
  assertPage,
  canonicalLinks,
  metadata,
  productionOrigin,
  robotsFailures,
  sitemapUrls,
} from './search-verification-utils.mjs';

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const builtUrls = sitemapUrls(await readFile('dist/sitemap.xml', 'utf8'));
const sitemapResponse = await fetch(`${productionOrigin}/sitemap.xml`);
const productionSitemap = await sitemapResponse.text();
let productionUrls = [];
try {
  productionUrls = sitemapUrls(productionSitemap);
} catch (error) {
  failures.push(`Production sitemap is invalid: ${error.message}`);
}
check(
  sitemapResponse.status === 200,
  `sitemap.xml returned ${sitemapResponse.status}.`,
);
check(
  sitemapResponse.headers.get('content-type')?.includes('xml'),
  'sitemap.xml is not XML.',
);
check(
  JSON.stringify([...productionUrls].sort()) ===
    JSON.stringify([...builtUrls].sort()),
  'Production sitemap does not match the freshly verified build.',
);

const routeRecords = [];
for (const url of builtUrls) {
  const parsed = new URL(url);
  check(
    parsed.origin === productionOrigin,
    `${url} is not on the canonical origin.`,
  );
  const response = await fetch(url);
  const html = await response.text();
  check(
    response.status === 200,
    `${parsed.pathname} returned ${response.status}.`,
  );
  check(
    !response.headers
      .get('x-robots-tag')
      ?.toLowerCase()
      .split(/[,\s]+/u)
      .includes('noindex'),
    `${parsed.pathname} receives X-Robots-Tag: noindex.`,
  );
  const result = assertPage(html, parsed.pathname);
  failures.push(
    ...result.failures.map((message) => `${parsed.pathname}: ${message}.`),
  );
  routeRecords.push(result);
}
for (const field of ['canonical', 'description', 'title']) {
  const values = routeRecords.map((record) => record[field]);
  check(
    values.every(Boolean) && new Set(values).size === values.length,
    `Production routes contain missing or duplicate ${field} values.`,
  );
}

const robotsResponse = await fetch(`${productionOrigin}/robots.txt`);
const robots = await robotsResponse.text();
check(
  robotsResponse.status === 200,
  `robots.txt returned ${robotsResponse.status}.`,
);
failures.push(...robotsFailures(robots));
for (const path of [
  '/not-a-search-page',
  '/passages/not-a-passage/',
  '/journeys/not-a-journey/',
]) {
  const response = await fetch(`${productionOrigin}${path}`);
  const html = await response.text();
  check(response.status === 404, `${path} is a soft 404 (${response.status}).`);
  check(
    metadata(html, 'name', 'robots').some((entry) =>
      entry
        .get('content')
        ?.toLowerCase()
        .split(/[,\s]+/u)
        .includes('noindex'),
    ),
    `${path} is missing noindex.`,
  );
}
const queryResponse = await fetch(`${productionOrigin}/?q=search-check`);
const queryHtml = await queryResponse.text();
check(
  queryResponse.status === 200,
  `Homepage query returned ${queryResponse.status}.`,
);
check(
  canonicalLinks(queryHtml)[0]?.get('href') === `${productionOrigin}/`,
  'Homepage query does not canonicalise to the clean URL.',
);
const imageResponse = await fetch(
  `${productionOrigin}/brand/keep-these-og.png`,
);
check(
  imageResponse.status === 200,
  `Social image returned ${imageResponse.status}.`,
);
check(
  imageResponse.headers.get('content-type') === 'image/png',
  'Social image is not PNG.',
);
for (const variant of ['http://keepthese.com/', 'https://www.keepthese.com/']) {
  const response = await fetch(variant, { redirect: 'follow' });
  check(
    response.url === `${productionOrigin}/`,
    `${variant} does not resolve to the canonical homepage.`,
  );
}

const result = {
  checkedAt: new Date().toISOString(),
  commit: execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim(),
  failures,
  origin: productionOrigin,
  sitemapRoutes: productionUrls.length,
  status: failures.length ? 'failed' : 'passed',
  workingTree: execFileSync('git', ['status', '--porcelain'], {
    encoding: 'utf8',
  }).trim()
    ? 'dirty'
    : 'clean',
};
console.log(JSON.stringify(result, null, 2));
if (failures.length)
  throw new Error(
    `Production verification failed:\n- ${failures.join('\n- ')}`,
  );
