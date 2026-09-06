import { describe, expect, it } from 'vitest';

import {
  initialStudioState,
  segmentPassage,
  studioReducer,
} from './studio-state';

describe('passage segmentation', () => {
  it('preserves source text while assigning stable word identifiers', () => {
    const source = "Life, death—and nature's light.";
    const segments = segmentPassage(source);

    expect(segments.map(({ text }) => text).join('')).toBe(source);
    expect(
      segments.flatMap((segment) =>
        segment.kind === 'word' ? [segment.id] : [],
      ),
    ).toEqual(['word-0', 'word-1', 'word-2', 'word-3', 'word-4']);
  });
});

describe('studio state', () => {
  const wordIds = ['word-0', 'word-1', 'word-2'];

  it('keeps selected words in source order rather than click order', () => {
    const later = studioReducer(initialStudioState, {
      allWordIds: wordIds,
      tokenId: 'word-2',
      tokenText: 'last',
      type: 'toggle-word',
    });
    const earlier = studioReducer(later, {
      allWordIds: wordIds,
      tokenId: 'word-0',
      tokenText: 'first',
      type: 'toggle-word',
    });

    expect(earlier.selectedIds).toEqual(['word-0', 'word-2']);
  });

  it('supports deselection, undo, blackout, and restart', () => {
    const selected = studioReducer(initialStudioState, {
      allWordIds: wordIds,
      tokenId: 'word-1',
      tokenText: 'middle',
      type: 'toggle-word',
    });
    const deselected = studioReducer(selected, {
      allWordIds: wordIds,
      tokenId: 'word-1',
      tokenText: 'middle',
      type: 'toggle-word',
    });
    const undone = studioReducer(deselected, { type: 'undo' });
    const blackedOut = studioReducer(undone, { type: 'toggle-blackout' });

    expect(deselected.selectedIds).toEqual([]);
    expect(undone.selectedIds).toEqual(['word-1']);
    expect(blackedOut.blackout).toBe(true);
    expect(studioReducer(blackedOut, { type: 'restart' })).toMatchObject({
      blackout: false,
      history: [],
      selectedIds: [],
    });
  });
});
