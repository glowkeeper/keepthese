import { createHash } from 'node:crypto';

/** Files in the build that are not part of the application the worker serves. */
const excluded = [
  /^_headers$/u,
  /^robots\.txt$/u,
  /^sitemap.*\.xml$/u,
  /^sw\.js$/u,
  /\.md$/u,
];

/**
 * Turns the build's relative file paths into the URLs the worker precaches:
 * `index.html` files become their directory URL, matching how Cloudflare Pages
 * serves them, and files that are not part of the application are left out.
 */
export function precacheUrls(files) {
  return files
    .map((file) => file.split('\\').join('/'))
    .filter((file) => !excluded.some((pattern) => pattern.test(file)))
    .map((file) => {
      if (file === 'index.html') return '/';
      if (file.endsWith('/index.html')) return `/${file.slice(0, -10)}`;
      return `/${file}`;
    })
    .sort();
}

/** A short, stable version for a set of files and their exact contents. */
export function cacheVersion(entries) {
  const hash = createHash('sha256');
  for (const [file, contents] of [...entries].sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  )) {
    hash.update(file);
    hash.update('\0');
    hash.update(contents);
    hash.update('\0');
  }
  return hash.digest('hex').slice(0, 12);
}

const versionMarker = /\/\* CACHE_VERSION \*\/ '[^']*'/u;
const urlsMarker = /\/\* PRECACHE_URLS \*\/ \[\]/u;

/** Fills the template's two marked values. Fails if either marker is missing. */
export function renderServiceWorker(template, version, urls) {
  if (!versionMarker.test(template) || !urlsMarker.test(template)) {
    throw new Error('The service worker template is missing a marker.');
  }
  return template
    .replace(
      versionMarker,
      () => `/* CACHE_VERSION */ ${JSON.stringify(version)}`,
    )
    .replace(urlsMarker, () => `/* PRECACHE_URLS */ ${JSON.stringify(urls)}`);
}
