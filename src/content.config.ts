import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import { passageSchema } from './lib/passage-schema';
import { literaryJourneySchema } from './lib/literary-journey';
import { guideSchema } from './lib/discovery-schema';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: guideSchema,
});

const journeys = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/journeys' }),
  schema: literaryJourneySchema,
});

const passages = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/passages' }),
  schema: passageSchema,
});

export const collections = { guides, journeys, passages };
