import type { Passage } from './passage-schema';

export function chooseSurprisePassage(
  passages: Passage[],
  currentPassageId: string,
  randomValue = Math.random(),
): Passage {
  if (passages.length === 0) {
    throw new Error('Surprise me requires at least one passage.');
  }

  const alternatives = passages.filter(
    ({ passageId }) => passageId !== currentPassageId,
  );
  const candidates = alternatives.length > 0 ? alternatives : passages;
  const boundedRandom = Math.min(Math.max(randomValue, 0), 0.9999999999999999);
  return candidates[Math.floor(boundedRandom * candidates.length)]!;
}
