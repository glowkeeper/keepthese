import { z } from 'astro/zod';

export const literaryJourneySchema = z.object({
  schemaVersion: z.literal(1),
  journeyId: z.string().min(1),
  title: z.string().min(1).max(80),
  invitation: z.string().min(1).max(240),
  rationale: z.string().min(1),
  passageIds: z
    .array(z.string().min(1))
    .min(3)
    .max(6)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Journey passages must be unique',
    }),
});

export type LiteraryJourney = z.infer<typeof literaryJourneySchema>;

export type PublicLiteraryJourney = Pick<
  LiteraryJourney,
  'invitation' | 'journeyId' | 'passageIds' | 'title'
>;

export function toPublicLiteraryJourney(
  journey: LiteraryJourney,
): PublicLiteraryJourney {
  return {
    invitation: journey.invitation,
    journeyId: journey.journeyId,
    passageIds: journey.passageIds,
    title: journey.title,
  };
}
