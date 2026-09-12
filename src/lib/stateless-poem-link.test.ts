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
});
