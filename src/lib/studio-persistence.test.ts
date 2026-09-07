import { describe, expect, it } from 'vitest';

import {
  discardStudioState,
  loadStudioState,
  saveStudioState,
  studioStorageKey,
  type PersistedStudioState,
} from './studio-persistence';

const state: PersistedStudioState = {
  blackout: true,
  material: 'graphite',
  passageId: 'passage-one',
  savedAt: '2026-09-07T12:00:00.000Z',
  schemaVersion: 1,
  selectedIds: ['word-1'],
  textVersion: 2,
};

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe('studio persistence', () => {
  it('round-trips supported creative state for the current passage version', () => {
    const storage = memoryStorage();
    expect(saveStudioState(storage, state)).toBe('saved');
    expect(
      loadStudioState(storage, 'passage-one', 2, new Set(['word-1'])),
    ).toEqual({ kind: 'restored', value: state });
  });

  it('ignores stale, malformed, or unknown-word records', () => {
    const storage = memoryStorage();
    storage.setItem(studioStorageKey('passage-one'), '{not json');
    expect(
      loadStudioState(storage, 'passage-one', 2, new Set(['word-1'])),
    ).toEqual({ kind: 'empty' });

    saveStudioState(storage, state);
    expect(
      loadStudioState(storage, 'passage-one', 3, new Set(['word-1'])),
    ).toEqual({ kind: 'empty' });
    expect(
      loadStudioState(storage, 'passage-one', 2, new Set(['word-2'])),
    ).toEqual({ kind: 'empty' });
  });

  it('reports unavailable storage and deliberately removes saved work', () => {
    const unavailable = {
      getItem: () => {
        throw new Error('unavailable');
      },
      removeItem: () => {
        throw new Error('unavailable');
      },
      setItem: () => {
        throw new Error('unavailable');
      },
    };
    expect(
      loadStudioState(unavailable, 'passage-one', 2, new Set(['word-1'])),
    ).toEqual({ kind: 'failed' });
    expect(saveStudioState(unavailable, state)).toBe('failed');
    expect(saveStudioState(null, state)).toBe('failed');

    const storage = memoryStorage();
    saveStudioState(storage, state);
    expect(discardStudioState(storage, 'passage-one')).toBe('saved');
    expect(storage.getItem(studioStorageKey('passage-one'))).toBeNull();
  });
});
