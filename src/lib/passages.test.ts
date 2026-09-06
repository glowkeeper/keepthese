import { describe, expect, it } from 'vitest';

import passageRecord from '../content/passages/frankenstein-1831-chapter-4.json';
import { passageSchema } from './passage-schema';
import { formatPassageAttribution } from './passages';

describe('first source passage', () => {
  it('conforms to the passage schema and has one assessment per intended market', () => {
    const passage = passageSchema.parse(passageRecord);

    expect(
      passage.rights.assessments.map(({ jurisdiction }) => jurisdiction),
    ).toEqual(passage.rights.intendedMarkets);
    expect(passage.text.join(' ')).not.toContain('PROJECT GUTENBERG');
  });

  it('generates a route-bearing source attribution from structured data', () => {
    const passage = passageSchema.parse(passageRecord);

    expect(formatPassageAttribution(passage)).toBe(
      'Frankenstein; Or, The Modern Prometheus by Mary Wollstonecraft Shelley (1818), 1831 revised edition, Chapter IV. Source: Project Gutenberg eBook #42324.',
    );
    expect(passage.source.recordUrl).toBe(
      'https://www.gutenberg.org/ebooks/42324',
    );
  });
});
