import { describe, expect, it } from 'vitest';

import passageRecord from '../content/passages/frankenstein-1831-chapter-4.json';
import { passageSchema, type Passage } from './passage-schema';
import { chooseSurprisePassage } from './passage-discovery';

const first = passageSchema.parse(passageRecord);
const second: Passage = {
  ...first,
  passageId: 'second-passage',
  work: { ...first.work, title: 'Second work' },
};
const third: Passage = {
  ...first,
  passageId: 'third-passage',
  work: { ...first.work, title: 'Third work' },
};

describe('passage discovery', () => {
  it('chooses from the complete shelf while avoiding the current passage', () => {
    const shelf = [first, second, third];

    expect(chooseSurprisePassage(shelf, first.passageId, 0)).toBe(second);
    expect(chooseSurprisePassage(shelf, first.passageId, 0.999)).toBe(third);
  });

  it('returns the only passage when no alternative exists', () => {
    expect(chooseSurprisePassage([first], first.passageId, 0.5)).toBe(first);
  });

  it('rejects an empty shelf', () => {
    expect(() => chooseSurprisePassage([], first.passageId)).toThrow(
      'Surprise me requires at least one passage.',
    );
  });
});
