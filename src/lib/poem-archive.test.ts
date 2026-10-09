import { describe, expect, it } from 'vitest';

import {
  archiveKey,
  deleteFromArchive,
  listArchive,
  loadFromArchive,
  parseArchivedPoem,
  poemAsText,
  poemTextFilename,
  saveToArchive,
  type NewArchivedPoem,
} from './poem-archive';

class MemoryStorage {
  readonly items = new Map<string, string>();
  failWrites: unknown = null;
  failRemoval = false;
  get length() {
    return this.items.size;
  }
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }
  removeItem(key: string) {
    if (!this.failRemoval) this.items.delete(key);
  }
  setItem(key: string, value: string) {
    if (this.failWrites) throw this.failWrites;
    this.items.set(key, value);
  }
}

const poem: NewArchivedPoem = {
  blackout: true,
  material: 'graphite',
  passageId: 'frankenstein-1831-chapter-4-life-and-death',
  poem: 'Life death',
  selectedIds: ['word-5', 'word-9'],
  source: {
    author: 'Mary Wollstonecraft Shelley',
    chapter: 'Chapter IV',
    recordUrl: 'https://www.gutenberg.org/ebooks/84',
    requiredCredit: 'Text from Project Gutenberg.',
    sourceLabel: 'Project Gutenberg',
    title: 'Frankenstein; Or, The Modern Prometheus',
  },
  textVersion: 1,
};

function saveWith(storage: MemoryStorage, id: string, when: string) {
  return saveToArchive(storage, poem, {
    createId: () => id,
    now: () => new Date(when),
  });
}

describe('poem archive', () => {
  it('saves a snapshot with its creative state, words, and credit', () => {
    const storage = new MemoryStorage();
    const result = saveWith(storage, 'a', '2026-10-09T10:00:00Z');

    expect(result.kind).toBe('saved');
    const stored = loadFromArchive(storage, 'a');
    expect(stored).toEqual({
      ...poem,
      id: 'a',
      savedAt: '2026-10-09T10:00:00.000Z',
      schemaVersion: 1,
    });
    expect(stored?.source.requiredCredit).toBe('Text from Project Gutenberg.');
  });

  it('keeps every save separate, lists newest first, and deletes one at a time', () => {
    const storage = new MemoryStorage();
    saveWith(storage, 'old', '2026-10-01T09:00:00Z');
    saveWith(storage, 'new', '2026-10-09T09:00:00Z');
    storage.setItem('keep-these:unfinished:x', '{}');

    const listed = listArchive(storage);
    expect(
      listed.kind === 'listed' && listed.poems.map(({ id }) => id),
    ).toEqual(['new', 'old']);

    expect(deleteFromArchive(storage, 'new')).toBe('deleted');
    expect(loadFromArchive(storage, 'new')).toBeNull();
    expect(loadFromArchive(storage, 'old')).not.toBeNull();
    expect(storage.getItem('keep-these:unfinished:x')).toBe('{}');
  });

  it('reports an honest failure when deletion does not take effect', () => {
    const storage = new MemoryStorage();
    saveWith(storage, 'a', '2026-10-09T10:00:00Z');
    storage.failRemoval = true;

    expect(deleteFromArchive(storage, 'a')).toBe('failed');
    expect(deleteFromArchive(null, 'a')).toBe('failed');
  });

  it('distinguishes a full browser store from an unavailable one', () => {
    const storage = new MemoryStorage();
    storage.failWrites = Object.assign(new Error('full'), {
      name: 'QuotaExceededError',
    });
    expect(saveWith(storage, 'a', '2026-10-09T10:00:00Z')).toEqual({
      kind: 'full',
    });

    storage.failWrites = new Error('blocked');
    expect(saveWith(storage, 'a', '2026-10-09T10:00:00Z')).toEqual({
      kind: 'unavailable',
    });
    expect(saveToArchive(null, poem)).toEqual({ kind: 'unavailable' });
    expect(listArchive(null)).toEqual({ kind: 'unavailable' });
    expect(loadFromArchive(null, 'a')).toBeNull();
  });

  it('counts unreadable records without removing them, and never saves other keys', () => {
    const storage = new MemoryStorage();
    saveWith(storage, 'good', '2026-10-09T10:00:00Z');
    storage.setItem(archiveKey('broken'), '{not json');
    storage.setItem(
      archiveKey('future'),
      JSON.stringify({ ...poem, id: 'future', schemaVersion: 2 }),
    );
    storage.setItem('something-else', 'ignored');

    const listed = listArchive(storage);
    expect(listed.kind).toBe('listed');
    if (listed.kind !== 'listed') return;
    expect(listed.poems).toHaveLength(1);
    expect(listed.unreadable).toBe(2);
    expect(listed.bytes).toBeGreaterThan(0);
    expect(storage.getItem(archiveKey('broken'))).toBe('{not json');
  });

  it('rejects malformed or tampered records', () => {
    const base = {
      ...poem,
      id: 'a',
      savedAt: '2026-10-09T10:00:00.000Z',
      schemaVersion: 1,
    };
    const bad = [
      { ...base, schemaVersion: 2 },
      { ...base, id: 'different' },
      { ...base, selectedIds: [] },
      { ...base, selectedIds: ['not-a-word'] },
      { ...base, selectedIds: ['word-9', 'word-5'] },
      { ...base, selectedIds: ['word-5', 'word-5'] },
      { ...base, selectedIds: ['word-5', 'word-05'] },
      { ...base, material: 'gold' },
      { ...base, savedAt: 'yesterday' },
      { ...base, source: { ...poem.source, recordUrl: 'javascript:alert(1)' } },
      { ...base, source: { ...poem.source, title: 3 } },
      { ...base, source: null },
    ];
    for (const value of bad) {
      expect(parseArchivedPoem(JSON.stringify(value), 'a')).toBeNull();
    }
    expect(parseArchivedPoem(JSON.stringify(base), 'a')).not.toBeNull();
    expect(parseArchivedPoem(null, 'a')).toBeNull();
  });

  it('exports plain text carrying the poem, source, and credit', () => {
    const entry = parseArchivedPoem(
      JSON.stringify({
        ...poem,
        id: 'a',
        savedAt: '2026-10-09T10:00:00.000Z',
        schemaVersion: 1,
      }),
    )!;

    expect(poemAsText(entry)).toBe(
      [
        'Life death',
        '',
        'Made from Frankenstein; Or, The Modern Prometheus by Mary Wollstonecraft Shelley (Chapter IV).',
        'Text from Project Gutenberg.',
        'Source: Project Gutenberg, https://www.gutenberg.org/ebooks/84',
        '',
      ].join('\n'),
    );
    expect(poemTextFilename(entry)).toBe(
      'keep-these-frankenstein-or-the-modern-prometheus.txt',
    );
  });
});
