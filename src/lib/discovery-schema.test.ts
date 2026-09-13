import { describe, expect, it } from 'vitest';

import discoveryRecord from '../content/discovery.json';
import { discoverySchema } from './discovery-schema';

describe('discovery editorial content', () => {
  it('validates the complete approved passage and journey note set', () => {
    const discovery = discoverySchema.parse(discoveryRecord);

    expect(Object.keys(discovery.passages)).toHaveLength(20);
    expect(Object.keys(discovery.journeys)).toHaveLength(3);
  });

  it('keeps every note within the editorial word-count threshold', () => {
    const discovery = discoverySchema.parse(discoveryRecord);

    for (const note of [
      ...Object.values(discovery.passages),
      ...Object.values(discovery.journeys),
    ]) {
      const wordCount = note.trim().split(/\s+/u).length;
      expect(wordCount).toBeGreaterThanOrEqual(90);
      expect(wordCount).toBeLessThanOrEqual(190);
    }
  });
});
