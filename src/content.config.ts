import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import { passageSchema } from './lib/passage-schema';
import { literaryJourneySchema } from './lib/literary-journey';

const journeys = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/journeys' }),
  schema: literaryJourneySchema,
});

const passages = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/passages' }),
  schema: passageSchema,
});

export const collections = { journeys, passages };
