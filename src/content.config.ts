import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import { passageSchema } from './lib/passage-schema';

const passages = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/passages' }),
  schema: passageSchema,
});

export const collections = { passages };
