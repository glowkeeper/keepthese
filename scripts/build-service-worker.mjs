import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import {
  cacheVersion,
  precacheUrls,
  renderServiceWorker,
} from './service-worker-build.mjs';

const outputDirectory = 'dist';

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? listFiles(path) : [path];
      }),
    )
  ).flat();
}

const files = (await listFiles(outputDirectory)).map((path) =>
  relative(outputDirectory, path),
);
const urls = precacheUrls(files);
for (const required of ['/', '/explore/', '/404.html']) {
  if (!urls.includes(required)) {
    throw new Error(
      `The build is missing ${required}, so it cannot be cached.`,
    );
  }
}

const entries = await Promise.all(
  files
    .filter((file) => precacheUrls([file]).length === 1)
    .map(async (file) => [file, await readFile(join(outputDirectory, file))]),
);
const template = await readFile('scripts/service-worker.template.js', 'utf8');
// The worker's own code is part of the version, so a change to it alone still
// gets a new cache name rather than reusing (and, on a failed install,
// deleting) the cache the running version depends on.
const version = cacheVersion([
  ...entries,
  ['service-worker.template.js', template],
]);
await writeFile(
  join(outputDirectory, 'sw.js'),
  renderServiceWorker(template, version, urls),
);
console.log(`Service worker ${version} precaches ${urls.length} files.`);
