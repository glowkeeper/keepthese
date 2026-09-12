import { describe, expect, it } from 'vitest';

import divided from '../content/journeys/divided-and-becoming.json';
import light from '../content/journeys/light-and-hidden-worlds.json';
import thresholds from '../content/journeys/thresholds-and-departures.json';
import {
  literaryJourneySchema,
  toPublicLiteraryJourney,
} from './literary-journey';

const records = [thresholds, light, divided];

describe('literary journeys', () => {
  it('defines a finite set of valid, uniquely identified journeys', () => {
    const journeys = records.map((record) =>
      literaryJourneySchema.parse(record),
    );

    expect(journeys).toHaveLength(3);
    expect(new Set(journeys.map(({ journeyId }) => journeyId)).size).toBe(3);
    expect(journeys.every(({ passageIds }) => passageIds.length === 5)).toBe(
      true,
    );
  });

  it('keeps editorial rationale out of the public journey payload', () => {
    const journey = literaryJourneySchema.parse(thresholds);
    const serialized = JSON.stringify(toPublicLiteraryJourney(journey));

    expect(serialized).not.toContain(journey.rationale);
    expect(serialized).not.toContain('"rationale"');
  });
});
