import { describe, expect, it } from 'vitest';

import passageRecord from '../content/passages/frankenstein-1831-chapter-4.json';
import { passageSchema } from './passage-schema';
import { toPublicPassage } from './public-passage';

describe('public passage projection', () => {
  it('includes public context while excluding internal editorial and rights data', () => {
    const passage = passageSchema.parse(passageRecord);
    const publicPassage = toPublicPassage(passage);
    const serialized = JSON.stringify(publicPassage);

    expect(publicPassage.curation.context).toBe(passage.curation.context);
    expect(serialized).not.toContain(passage.curation.rationale);
    expect(serialized).not.toContain('"rationale"');
    expect(serialized).not.toContain('"rights"');
    expect(serialized).not.toContain('"contributors"');
    expect(serialized).not.toContain('"openingWords"');
  });
});
