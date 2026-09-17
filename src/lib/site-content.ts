import { getCollection } from 'astro:content';

import discoveryRecord from '../content/discovery.json';
import { discoverySchema } from './discovery-schema';
import { toPublicLiteraryJourney } from './literary-journey';
import { toPublicPassage } from './public-passage';

export const passageOrder = [
  'frankenstein-1831-chapter-4-life-and-death',
  'persuasion-1818-chapter-4-prudence-and-romance',
  'jane-eyre-1847-chapter-10-wide-world',
  'middlemarch-1871-book-2-other-side-of-silence',
  'douglass-1845-chapter-6-pathway-to-freedom',
  'moby-dick-1851-chapter-1-watery-world',
  'dorian-gray-1891-preface-art-and-beauty',
  'alice-1865-chapter-1-daisy-chain',
  'great-expectations-1861-chapter-9-memorable-day',
  'yellow-wallpaper-1892-light-and-pattern',
  'mrs-dalloway-1925-flowers-and-morning',
  'zitkala-sa-1921-impressions-wild-freedom',
  'my-antonia-1918-prairie-transfiguration',
  'dubliners-1914-eveline-evening',
  'north-and-south-1855-milton-smoke',
  'time-machine-1895-flowing-years',
  'jekyll-hyde-1886-truly-two',
  'age-of-innocence-1920-loneliness-and-pretence',
  'awakening-1899-voice-of-the-sea',
  'pointed-firs-1896-dunnet-landing',
] as const;

export const journeyOrder = [
  'thresholds-and-departures',
  'light-and-hidden-worlds',
  'divided-and-becoming',
] as const;

export async function loadSiteContent() {
  const discovery = discoverySchema.parse(discoveryRecord);
  if (Object.keys(discovery.journeys).length !== journeyOrder.length) {
    throw new Error(
      'The journey discovery notes and collection are out of sync.',
    );
  }
  const passageCollection = await getCollection('passages');
  const passageById = new Map(
    passageCollection.map(({ data }) => [data.passageId, data]),
  );
  const passages = passageOrder.map((passageId) => {
    const passage = passageById.get(passageId);
    if (!passage) {
      throw new Error(`The passage shelf is missing ${passageId}.`);
    }
    return toPublicPassage(passage);
  });
  if (passageCollection.length !== passageOrder.length) {
    throw new Error(
      'The passage shelf and verified collection are out of sync.',
    );
  }

  const journeyCollection = await getCollection('journeys');
  const journeyById = new Map(
    journeyCollection.map(({ data }) => [data.journeyId, data]),
  );
  const journeys = journeyOrder.map((journeyId) => {
    const journey = journeyById.get(journeyId);
    if (!journey || !discovery.journeys[journeyId]) {
      throw new Error(
        `The literary journeys are missing discovery content for ${journeyId}.`,
      );
    }
    for (const passageId of journey.passageIds) {
      if (!passageById.has(passageId)) {
        throw new Error(
          `The literary journey ${journeyId} references missing passage ${passageId}.`,
        );
      }
    }
    return toPublicLiteraryJourney(journey);
  });
  if (journeyCollection.length !== journeyOrder.length) {
    throw new Error(
      'The literary journey order and collection are out of sync.',
    );
  }

  return { discovery, journeys, passages };
}
