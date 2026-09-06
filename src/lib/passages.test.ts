import { describe, expect, it } from 'vitest';

import passageRecord from '../content/passages/frankenstein-1831-chapter-4.json';
import { passageSchema } from './passage-schema';
import { formatPassageAttribution } from './passages';

describe('first source passage', () => {
  it('conforms to the passage schema', () => {
    const passage = passageSchema.parse(passageRecord);

    expect(passage.text.join(' ')).not.toContain('PROJECT GUTENBERG');
  });

  it('accepts one rights assessment per intended market in any order', () => {
    const candidate = structuredClone(passageRecord);
    candidate.rights.assessments.reverse();

    expect(passageSchema.safeParse(candidate).success).toBe(true);
  });

  it('rejects a missing rights assessment', () => {
    const candidate = structuredClone(passageRecord);
    candidate.rights.assessments.pop();

    expect(passageSchema.safeParse(candidate).success).toBe(false);
  });

  it('rejects duplicate rights assessments for one market', () => {
    const candidate = structuredClone(passageRecord);
    candidate.rights.assessments[1] = candidate.rights.assessments[0]!;

    expect(passageSchema.safeParse(candidate).success).toBe(false);
  });

  it('rejects an assessment outside the intended markets', () => {
    const candidate = structuredClone(passageRecord);
    candidate.rights.intendedMarkets = ['GB'];

    expect(passageSchema.safeParse(candidate).success).toBe(false);
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
