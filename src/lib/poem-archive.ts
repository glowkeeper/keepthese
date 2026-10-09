/**
 * The optional on-device poem archive.
 *
 * A maker can choose to save a poem. Each saved poem is an immutable snapshot
 * in the browser's local storage, one record per poem, so deleting one never
 * touches another. Nothing is saved unless the maker asks, nothing is sent
 * anywhere, and there is no account. Unfinished work is kept separately (see
 * studio-persistence.ts) and is never changed by the archive.
 *
 * Every record carries the creative state needed to reopen the poem, the
 * words themselves, and a snapshot of the source credit, so a poem keeps its
 * words and attribution even if the page it came from is later revised.
 * docs/personal-archive.md records the contract and its limits.
 */

import type { StudioMaterial } from './studio-persistence';

export interface ArchivedPoemSource {
  author: string;
  chapter: string;
  recordUrl: string;
  requiredCredit: string;
  sourceLabel: string;
  title: string;
}

export interface ArchivedPoem {
  blackout: boolean;
  id: string;
  material: StudioMaterial;
  passageId: string;
  poem: string;
  savedAt: string;
  schemaVersion: 1;
  selectedIds: string[];
  source: ArchivedPoemSource;
  textVersion: number;
}

export type NewArchivedPoem = Omit<
  ArchivedPoem,
  'id' | 'savedAt' | 'schemaVersion'
>;

interface StorageLike {
  readonly length: number;
  getItem(key: string): string | null;
  key(index: number): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export interface ArchiveListing {
  /** Records that could not be read, kept in storage and never deleted. */
  unreadable: number;
  /** Approximate storage the archive uses, in bytes. */
  bytes: number;
  poems: ArchivedPoem[];
}

export type ArchiveListResult =
  { kind: 'unavailable' } | ({ kind: 'listed' } & ArchiveListing);

export type ArchiveSaveResult =
  | { kind: 'saved'; poem: ArchivedPoem }
  | { kind: 'full' }
  | { kind: 'unavailable' };

export type ArchiveDeleteResult = 'deleted' | 'failed';

export const archivePrefix = 'keep-these:archive:';
const wordIdPattern = /^word-(0|[1-9]\d*)$/;

const archiveHashPattern = /^#archive=([A-Za-z0-9-]{1,64})$/;

/** The saved poem named by a `#archive=<id>` address, if the address is one. */
export function archiveIdFromHash(hash: string): string | null {
  return archiveHashPattern.exec(hash)?.[1] ?? null;
}

export function archiveHash(id: string): string {
  return `#archive=${id}`;
}

export function archiveKey(id: string): string {
  return `${archivePrefix}${id}`;
}

export function createArchiveId(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi.randomUUID === 'function') return cryptoApi.randomUUID();
  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

export function saveToArchive(
  storage: StorageLike | null,
  poem: NewArchivedPoem,
  options: { createId?: () => string; now?: () => Date } = {},
): ArchiveSaveResult {
  if (!storage) return { kind: 'unavailable' };

  const record: ArchivedPoem = {
    ...poem,
    id: (options.createId ?? createArchiveId)(),
    savedAt: (options.now ?? (() => new Date()))().toISOString(),
    schemaVersion: 1,
  };
  try {
    storage.setItem(archiveKey(record.id), JSON.stringify(record));
    return { kind: 'saved', poem: record };
  } catch (error) {
    return { kind: isQuotaError(error) ? 'full' : 'unavailable' };
  }
}

export function loadFromArchive(
  storage: StorageLike | null,
  id: string,
): ArchivedPoem | null {
  if (!storage) return null;
  try {
    return parseArchivedPoem(storage.getItem(archiveKey(id)), id);
  } catch {
    return null;
  }
}

export function deleteFromArchive(
  storage: StorageLike | null,
  id: string,
): ArchiveDeleteResult {
  try {
    if (!storage) return 'failed';
    storage.removeItem(archiveKey(id));
    return storage.getItem(archiveKey(id)) === null ? 'deleted' : 'failed';
  } catch {
    return 'failed';
  }
}

/** Lists saved poems, newest first. Unreadable records are counted, not removed. */
export function listArchive(storage: StorageLike | null): ArchiveListResult {
  if (!storage) return { kind: 'unavailable' };

  const poems: ArchivedPoem[] = [];
  let unreadable = 0;
  let bytes = 0;
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key || !key.startsWith(archivePrefix)) continue;
      const serialized = storage.getItem(key);
      // Browsers commonly count two bytes per character of key and value.
      bytes += (key.length + (serialized?.length ?? 0)) * 2;
      const poem = parseArchivedPoem(
        serialized,
        key.slice(archivePrefix.length),
      );
      if (poem) poems.push(poem);
      else unreadable += 1;
    }
  } catch {
    return { kind: 'unavailable' };
  }

  poems.sort(
    (a, b) => b.savedAt.localeCompare(a.savedAt) || a.id.localeCompare(b.id),
  );
  return { bytes, kind: 'listed', poems, unreadable };
}

export function parseArchivedPoem(
  serialized: string | null,
  expectedId?: string,
): ArchivedPoem | null {
  if (!serialized) return null;
  try {
    const value: unknown = JSON.parse(serialized);
    if (!isArchivedPoem(value)) return null;
    if (expectedId !== undefined && value.id !== expectedId) return null;
    return value;
  } catch {
    return null;
  }
}

/** Plain-text export: the poem, then its source and credit. */
export function poemAsText(entry: ArchivedPoem): string {
  const { source } = entry;
  return [
    entry.poem,
    '',
    `Made from ${source.title} by ${source.author} (${source.chapter}).`,
    source.requiredCredit,
    `Source: ${source.sourceLabel}, ${source.recordUrl}`,
    '',
  ].join('\n');
}

export function poemTextFilename(entry: ArchivedPoem): string {
  const slug = entry.source.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `keep-these-${slug || 'poem'}.txt`;
}

/** Poem links need word indexes that are unique and in source order. */
function isStrictlyIncreasing(ids: string[]): boolean {
  const indexes = ids.map((id) => Number(id.slice('word-'.length)));
  return indexes.every(
    (index, position) =>
      Number.isSafeInteger(index) &&
      (position === 0 || index > indexes[position - 1]!),
  );
}

function isQuotaError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { code, name } = error as { code?: unknown; name?: unknown };
  return (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    code === 22 ||
    code === 1014
  );
}

function isArchivedPoem(value: unknown): value is ArchivedPoem {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  const source = record.source as Record<string, unknown> | null;

  return (
    record.schemaVersion === 1 &&
    typeof record.id === 'string' &&
    record.id.length > 0 &&
    typeof record.passageId === 'string' &&
    Number.isInteger(record.textVersion) &&
    typeof record.poem === 'string' &&
    typeof record.savedAt === 'string' &&
    !Number.isNaN(Date.parse(record.savedAt)) &&
    typeof record.blackout === 'boolean' &&
    (record.material === 'ink' || record.material === 'graphite') &&
    Array.isArray(record.selectedIds) &&
    record.selectedIds.length > 0 &&
    record.selectedIds.every(
      (id) => typeof id === 'string' && wordIdPattern.test(id),
    ) &&
    isStrictlyIncreasing(record.selectedIds as string[]) &&
    typeof source === 'object' &&
    source !== null &&
    [
      'author',
      'chapter',
      'recordUrl',
      'requiredCredit',
      'sourceLabel',
      'title',
    ].every((field) => typeof source[field] === 'string') &&
    /^https:\/\//.test(source.recordUrl as string)
  );
}
