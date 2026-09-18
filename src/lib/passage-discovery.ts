export function chooseSurprisePassage<T extends { passageId: string }>(
  passages: T[],
  currentPassageId: string,
  randomValue = Math.random(),
): T {
  if (passages.length === 0) {
    throw new Error('Random passage choice requires at least one passage.');
  }

  const alternatives = passages.filter(
    ({ passageId }) => passageId !== currentPassageId,
  );
  const candidates = alternatives.length > 0 ? alternatives : passages;
  const boundedRandom = Math.min(Math.max(randomValue, 0), 1 - Number.EPSILON);
  return candidates[Math.floor(boundedRandom * candidates.length)]!;
}
