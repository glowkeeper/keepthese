import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import {
  assertPage,
  metadata,
  robotsFailures,
  sitemapUrls,
} from './search-verification-utils.mjs';

const outputDirectory = 'dist';

async function findHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return findHtml(path);
        return entry.name.endsWith('.html') ? [path] : [];
      }),
    )
  ).flat();
}

function pagePath(file) {
  const outputPath = relative(outputDirectory, file).split(sep).join('/');
  if (outputPath === 'index.html') return '/';
  if (outputPath.endsWith('/index.html')) return `/${outputPath.slice(0, -10)}`;
  return `/${outputPath}`;
}

function headerNoindexFailures(headers, paths) {
  const blocks = [];
  let block;
  for (const line of headers.split(/\r?\n/u)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/u.test(line)) {
      block = { headers: [], pattern: line.trim() };
      blocks.push(block);
    } else if (block) block.headers.push(line.trim());
  }
  return paths.flatMap((path) =>
    blocks.flatMap((candidate) => {
      const escaped = candidate.pattern
        .split('*')
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'))
        .join('.*');
      const noindex = candidate.headers.some(
        (header) =>
          /^x-robots-tag\s*:/iu.test(header) &&
          /(?:^|[,\s])noindex(?:$|[,\s])/iu.test(header),
      );
      return new RegExp(`^${escaped}$`, 'u').test(path) && noindex
        ? [`${path} receives X-Robots-Tag: noindex`]
        : [];
    }),
  );
}

const htmlFiles = await findHtml(outputDirectory);
const indexable = htmlFiles.filter(
  (file) => relative(outputDirectory, file) !== '404.html',
);
const records = [];
const failures = [];
for (const file of indexable) {
  const result = assertPage(await readFile(file, 'utf8'), pagePath(file));
  failures.push(...result.failures.map((message) => `${file}: ${message}.`));
  records.push(result);
}
for (const field of ['canonical', 'description', 'title']) {
  const values = records.map((record) => record[field]);
  if (values.some((value) => !value) || new Set(values).size !== values.length)
    failures.push(
      `Indexable routes contain missing or duplicate ${field} values.`,
    );
}
const listed = sitemapUrls(
  await readFile(join(outputDirectory, 'sitemap.xml'), 'utf8'),
);
const canonicalUrls = records.map((record) => record.canonical);
if (
  JSON.stringify([...listed].sort()) !==
  JSON.stringify([...canonicalUrls].sort())
)
  failures.push('Sitemap URLs do not exactly match every built HTML route.');
if (listed.some((url) => /[#?]/u.test(url)))
  failures.push('Sitemap contains query or fragment URLs.');

const notFound = await readFile(join(outputDirectory, '404.html'), 'utf8');
if (
  !metadata(notFound, 'name', 'robots').some((entry) =>
    entry
      .get('content')
      ?.toLowerCase()
      .split(/[,\s]+/u)
      .includes('noindex'),
  )
)
  failures.push('The built 404 page is missing noindex.');
failures.push(
  ...robotsFailures(
    await readFile(join(outputDirectory, 'robots.txt'), 'utf8'),
  ),
);
failures.push(
  ...headerNoindexFailures(
    await readFile(join(outputDirectory, '_headers'), 'utf8'),
    records.map((record) => new URL(record.canonical).pathname),
  ),
);

if (failures.length)
  throw new Error(
    `Search output verification failed:\n- ${failures.join('\n- ')}`,
  );
console.log(`Verified search output for ${records.length} canonical routes.`);
