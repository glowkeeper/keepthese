import { z } from 'astro/zod';

const marketSchema = z.enum(['GB', 'US']);

const rightsSchema = z
  .object({
    status: z.literal('public-domain'),
    checkedAt: z.iso.date(),
    intendedMarkets: z
      .array(marketSchema)
      .min(1)
      .refine((markets) => new Set(markets).size === markets.length, {
        message: 'Intended markets must be unique',
      }),
    assessments: z.array(
      z.object({
        jurisdiction: marketSchema,
        conclusion: z.string().min(1),
        evidenceUrl: z.url(),
      }),
    ),
    translation: z.literal('not-applicable'),
    annotations: z.literal('excluded'),
    illustrations: z.literal('excluded'),
    typographicalLayout: z.literal('not-reproduced'),
    caveat: z.string().min(1),
  })
  .superRefine(({ intendedMarkets, assessments }, context) => {
    const intended = new Set(intendedMarkets);
    const assessed = new Set(
      assessments.map(({ jurisdiction }) => jurisdiction),
    );

    if (assessed.size !== assessments.length) {
      context.addIssue({
        code: 'custom',
        message: 'Each market must have exactly one rights assessment',
        path: ['assessments'],
      });
    }

    const hasSameMarkets =
      intended.size === assessed.size &&
      [...intended].every((market) => assessed.has(market));

    if (!hasSameMarkets) {
      context.addIssue({
        code: 'custom',
        message:
          'Rights assessments must cover every intended market and no others',
        path: ['assessments'],
      });
    }
  });

export const passageSchema = z.object({
  schemaVersion: z.literal(1),
  passageId: z.string().min(1),
  textVersion: z.number().int().positive(),
  language: z.string().min(2),
  work: z.object({
    title: z.string().min(1),
    author: z.object({
      name: z.string().min(1),
      birthYear: z.number().int(),
      deathYear: z.number().int(),
    }),
    firstPublishedYear: z.number().int(),
  }),
  passageLocation: z.object({
    edition: z.string().min(1),
    chapter: z.string().min(1),
    openingWords: z.string().min(1),
  }),
  text: z.array(z.string().min(1)).min(1),
  source: z.object({
    provider: z.string().min(1),
    editionStatement: z.string().min(1),
    publication: z.string().min(1),
    ebookNumber: z.string().min(1),
    recordUrl: z.url(),
    transcriptionUrl: z.url(),
    transcriptionUpdated: z.iso.date(),
    checkedAt: z.iso.date(),
    contributors: z.array(
      z.object({
        name: z.string().min(1),
        role: z.string().min(1),
      }),
    ),
  }),
  rights: rightsSchema,
  attribution: z.object({
    sourceLabel: z.string().min(1),
    requiredCredit: z.string().min(1),
  }),
  curation: z.object({
    rationale: z.string().min(1),
    motifs: z.array(z.string().min(1)).min(1),
  }),
});

export type Passage = z.infer<typeof passageSchema>;
