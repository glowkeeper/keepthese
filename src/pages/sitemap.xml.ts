import type { APIRoute } from 'astro';

import { journeyPath, passagePath } from '../lib/route-paths';
import { loadSiteContent } from '../lib/site-content';

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('Astro.site is required to build the sitemap.');

  const { journeys, passages } = await loadSiteContent();
  const paths = [
    '/',
    '/blackout-poetry/',
    '/about/',
    '/privacy/',
    ...passages.map(({ passageId }) => passagePath(passageId)),
    ...journeys.map(({ journeyId }) => journeyPath(journeyId)),
  ];
  const entries = paths
    .map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`)
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
