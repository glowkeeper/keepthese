import type { StudioMaterial } from './studio-persistence';

export interface StatelessPoemWork {
  blackout: boolean;
  material: StudioMaterial;
  passageId: string;
  selectedIds: string[];
  textVersion: number;
}

export type DecodedPoemLink =
  | { kind: 'invalid' }
  | { kind: 'none' }
  | { kind: 'poem'; value: StatelessPoemWork };

const fragmentPrefix = '#poem=v1.';
const wordIdPattern = /^word-(0|[1-9]\d*)$/;
const maximumPassageIdLength = 120;
const maximumWordIndex = 100_000;

export function encodePoemFragment(work: StatelessPoemWork): string {
  if (
    work.passageId.length === 0 ||
    work.passageId.length > maximumPassageIdLength ||
    !Number.isSafeInteger(work.textVersion) ||
    work.textVersion <= 0
  ) {
    throw new Error('Unsupported passage identity or text version.');
  }
  const wordIndexes = work.selectedIds.map((id) => {
    const match = wordIdPattern.exec(id);
    if (!match) throw new Error(`Unsupported word identifier: ${id}`);
    const index = Number(match[1]);
    if (!Number.isSafeInteger(index) || index > maximumWordIndex) {
      throw new Error(`Unsupported word identifier: ${id}`);
    }
    return index;
  });
  if (!isStrictlyIncreasing(wordIndexes)) {
    throw new Error('Selected word identifiers must be unique and ordered.');
  }

  const payload = JSON.stringify([
    work.passageId,
    work.textVersion,
    work.material === 'ink' ? 0 : 1,
    work.blackout ? 1 : 0,
    wordIndexes,
  ]);
  const encoded = toBase64Url(payload);
  return `${fragmentPrefix}${encoded}.${checksum(encoded)}`;
}

export function decodePoemFragment(fragment: string): DecodedPoemLink {
  if (!fragment.startsWith('#poem=')) return { kind: 'none' };
  if (!fragment.startsWith(fragmentPrefix)) return { kind: 'invalid' };

  const parts = fragment.slice(fragmentPrefix.length).split('.');
  if (parts.length !== 2) return { kind: 'invalid' };
  const [encoded, suppliedChecksum] = parts;
  if (!encoded || suppliedChecksum !== checksum(encoded)) {
    return { kind: 'invalid' };
  }

  try {
    const value: unknown = JSON.parse(fromBase64Url(encoded));
    if (!isCompactPoem(value)) return { kind: 'invalid' };
    const [passageId, textVersion, material, blackout, wordIndexes] = value;
    return {
      kind: 'poem',
      value: {
        blackout: blackout === 1,
        material: material === 0 ? 'ink' : 'graphite',
        passageId,
        selectedIds: wordIndexes.map((index) => `word-${index}`),
        textVersion,
      },
    };
  } catch {
    return { kind: 'invalid' };
  }
}

export function poemShareUrl(
  location: Pick<Location, 'origin'>,
  work: StatelessPoemWork,
): string {
  return `${location.origin}/passages/${encodeURIComponent(work.passageId)}/${encodePoemFragment(work)}`;
}

function isCompactPoem(
  value: unknown,
): value is [string, number, 0 | 1, 0 | 1, number[]] {
  if (!Array.isArray(value) || value.length !== 5) return false;
  const [passageId, textVersion, material, blackout, wordIndexes] = value;
  return (
    typeof passageId === 'string' &&
    passageId.length > 0 &&
    passageId.length <= maximumPassageIdLength &&
    Number.isSafeInteger(textVersion) &&
    textVersion > 0 &&
    (material === 0 || material === 1) &&
    (blackout === 0 || blackout === 1) &&
    Array.isArray(wordIndexes) &&
    wordIndexes.length > 0 &&
    wordIndexes.every(
      (index) =>
        Number.isSafeInteger(index) && index >= 0 && index <= maximumWordIndex,
    ) &&
    isStrictlyIncreasing(wordIndexes)
  );
}

function isStrictlyIncreasing(values: number[]): boolean {
  return values.every(
    (value, index) => index === 0 || value > values[index - 1]!,
  );
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid base64url.');
  const padded = value
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function checksum(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
