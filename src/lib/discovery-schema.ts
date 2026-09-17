import { z } from 'astro/zod';

const wordCount = (value: string) => value.trim().split(/\s+/).length;

export const discoveryNoteSchema = z
  .string()
  .refine((value) => wordCount(value) >= 90 && wordCount(value) <= 190, {
    message: 'Discovery notes must contain 90–190 words',
  });

export const discoverySchema = z.object({
  journeys: z.record(z.string(), discoveryNoteSchema),
});

export const guideSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(180),
});
