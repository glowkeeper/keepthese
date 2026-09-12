import { describe, expect, it } from 'vitest';

import {
  decodePoemFragment,
  encodePoemFragment,
  poemShareUrl,
} from './stateless-poem-link';

const work = {
  blackout: true,
  material: 'graphite' as const,
  passageId: 'frankenstein-1831-chapter-4-life-and-death',
  selectedIds: ['word-0', 'word-12', 'word-104'],
  textVersion: 1,
};

describe('stateless poem links', () => {
  it('has a stable compact versioned vector', () => {
    expect(encodePoemFragment(work)).toBe(
      '#poem=v1.WyJmcmFua2Vuc3RlaW4tMTgzMS1jaGFwdGVyLTQtbGlmZS1hbmQtZGVhdGgiLDEsMSwxLFswLDEyLDEwNF1d.2d0d9830',
    );
    expect(decodePoemFragment(encodePoemFragment(work))).toEqual({
      kind: 'poem',
      value: work,
    });
  });

  it('creates a fragment-only URL without retaining query data', () => {
    expect(
      poemShareUrl(
        {
          hash: '#old',
          origin: 'https://keepthese.com',
          pathname: '/',
        },
        work,
      ),
    ).toBe(`https://keepthese.com/${encodePoemFragment(work)}`);
  });

  it.each([
    '#poem=v2.payload.deadbeef',
    '#poem=v1.payload.deadbeef',
    `${encodePoemFragment(work)}x`,
    '#poem=v1..811c9dc5',
  ])('rejects malformed, changed, or unsupported data: %s', (fragment) => {
    expect(decodePoemFragment(fragment)).toEqual({ kind: 'invalid' });
  });

  it('ignores unrelated fragments', () => {
    expect(decodePoemFragment('#studio')).toEqual({ kind: 'none' });
  });

  it('rejects unordered or repeated identifiers when encoding', () => {
    expect(() =>
      encodePoemFragment({
        ...work,
        selectedIds: ['word-12', 'word-12'],
      }),
    ).toThrow('Selected word identifiers must be unique and ordered.');
  });

  it('round-trips non-ASCII passage identifiers as UTF-8', () => {
    const unicodeWork = { ...work, passageId: 'l-étranger-日本語' };
    expect(decodePoemFragment(encodePoemFragment(unicodeWork))).toEqual({
      kind: 'poem',
      value: unicodeWork,
    });
  });

  it('does not encode word indexes that its decoder would reject', () => {
    expect(() =>
      encodePoemFragment({ ...work, selectedIds: ['word-100001'] }),
    ).toThrow('Unsupported word identifier: word-100001');
  });
});
