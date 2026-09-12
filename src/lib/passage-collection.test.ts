import { describe, expect, it } from 'vitest';

import alice from '../content/passages/alice-1865-chapter-1-daisy-chain.json';
import dorianGray from '../content/passages/dorian-gray-1891-preface-art-and-beauty.json';
import douglass from '../content/passages/douglass-1845-chapter-6-pathway-to-freedom.json';
import frankenstein from '../content/passages/frankenstein-1831-chapter-4.json';
import greatExpectations from '../content/passages/great-expectations-1861-chapter-9-memorable-day.json';
import janeEyre from '../content/passages/jane-eyre-1847-chapter-10-wide-world.json';
import middlemarch from '../content/passages/middlemarch-1871-book-2-other-side-of-silence.json';
import mobyDick from '../content/passages/moby-dick-1851-chapter-1-watery-world.json';
import persuasion from '../content/passages/persuasion-1818-chapter-4-prudence-and-romance.json';
import yellowWallpaper from '../content/passages/yellow-wallpaper-1892-light-and-pattern.json';
import ageOfInnocence from '../content/passages/age-of-innocence-1920-loneliness-and-pretence.json';
import awakening from '../content/passages/awakening-1899-voice-of-the-sea.json';
import dubliners from '../content/passages/dubliners-1914-eveline-evening.json';
import heartOfDarkness from '../content/passages/heart-of-darkness-1899-thames-waterway.json';
import jekyllHyde from '../content/passages/jekyll-hyde-1886-truly-two.json';
import mrsDalloway from '../content/passages/mrs-dalloway-1925-flowers-and-morning.json';
import myAntonia from '../content/passages/my-antonia-1918-prairie-transfiguration.json';
import northAndSouth from '../content/passages/north-and-south-1855-milton-smoke.json';
import timeMachine from '../content/passages/time-machine-1895-flowing-years.json';
import zitkalaSa from '../content/passages/zitkala-sa-1921-impressions-wild-freedom.json';
import { passageSchema } from './passage-schema';

const records = [
  alice,
  dorianGray,
  douglass,
  frankenstein,
  greatExpectations,
  janeEyre,
  middlemarch,
  mobyDick,
  persuasion,
  yellowWallpaper,
  ageOfInnocence,
  awakening,
  dubliners,
  heartOfDarkness,
  jekyllHyde,
  mrsDalloway,
  myAntonia,
  northAndSouth,
  timeMachine,
  zitkalaSa,
];

const containsGutenbergWrapperText = (text: string[]) =>
  /project gutenberg/i.test(text.join(' '));

describe('passage collection', () => {
  it('contains twenty independently valid and uniquely identified passages', () => {
    const passages = records.map((record) => passageSchema.parse(record));

    expect(passages).toHaveLength(20);
    expect(new Set(passages.map(({ passageId }) => passageId)).size).toBe(
      passages.length,
    );
  });

  it('contains clean extracts rather than Project Gutenberg wrapper text', () => {
    const passages = records.map((record) => passageSchema.parse(record));

    expect(
      passages.every(({ text }) => !containsGutenbergWrapperText(text)),
    ).toBe(true);
  });

  it('detects Project Gutenberg wrapper markers regardless of case', () => {
    expect(containsGutenbergWrapperText(['PROJECT GUTENBERG'])).toBe(true);
    expect(containsGutenbergWrapperText(['Project Gutenberg'])).toBe(true);
    expect(containsGutenbergWrapperText(['project gutenberg'])).toBe(true);
  });
});
