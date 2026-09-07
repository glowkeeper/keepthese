export type StudioMaterial = 'ink' | 'graphite';

export interface PersistedStudioState {
  blackout: boolean;
  material: StudioMaterial;
  passageId: string;
  savedAt: string;
  schemaVersion: 1;
  selectedIds: string[];
  textVersion: number;
}

interface StorageLike {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export type LoadResult =
  | { kind: 'empty' }
  | { kind: 'failed' }
  | { kind: 'restored'; value: PersistedStudioState };

export type StorageResult = 'failed' | 'saved';

const storagePrefix = 'keep-these:unfinished:';

export function studioStorageKey(passageId: string): string {
  return `${storagePrefix}${passageId}`;
}

export function loadStudioState(
  storage: StorageLike | null,
  passageId: string,
  textVersion: number,
  validWordIds: ReadonlySet<string>,
): LoadResult {
  try {
    if (!storage) return { kind: 'failed' };
    const serialized = storage.getItem(studioStorageKey(passageId));
    if (!serialized) return { kind: 'empty' };

    const value: unknown = JSON.parse(serialized);
    if (!isPersistedStudioState(value)) return { kind: 'empty' };
    if (value.passageId !== passageId || value.textVersion !== textVersion) {
      return { kind: 'empty' };
    }
    if (!value.selectedIds.every((id) => validWordIds.has(id))) {
      return { kind: 'empty' };
    }

    return { kind: 'restored', value };
  } catch {
    return { kind: 'failed' };
  }
}

export function saveStudioState(
  storage: StorageLike | null,
  value: PersistedStudioState,
): StorageResult {
  try {
    if (!storage) return 'failed';
    storage.setItem(studioStorageKey(value.passageId), JSON.stringify(value));
    return 'saved';
  } catch {
    return 'failed';
  }
}

export function discardStudioState(
  storage: StorageLike | null,
  passageId: string,
): StorageResult {
  try {
    if (!storage) return 'failed';
    storage.removeItem(studioStorageKey(passageId));
    return 'saved';
  } catch {
    return 'failed';
  }
}

function isPersistedStudioState(value: unknown): value is PersistedStudioState {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;

  return (
    record.schemaVersion === 1 &&
    typeof record.passageId === 'string' &&
    Number.isInteger(record.textVersion) &&
    Array.isArray(record.selectedIds) &&
    record.selectedIds.every((id) => typeof id === 'string') &&
    typeof record.blackout === 'boolean' &&
    (record.material === 'ink' || record.material === 'graphite') &&
    typeof record.savedAt === 'string'
  );
}
