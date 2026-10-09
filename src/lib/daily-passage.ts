const millisecondsPerDay = 86_400_000;

/** Whole days since 1970-01-01 in UTC, so every visitor shares one day. */
export function utcDayNumber(date: Date): number {
  return Math.floor(date.getTime() / millisecondsPerDay);
}

/**
 * Chooses the passage for a UTC day by rotating through the shelf in its
 * published order. The same day always yields the same passage, and an empty
 * shelf or an invalid date yields no passage rather than an error.
 */
export function chooseDailyPassage<T>(passages: T[], date: Date): T | null {
  const day = utcDayNumber(date);
  if (passages.length === 0 || !Number.isFinite(day)) return null;
  return passages[
    ((day % passages.length) + passages.length) % passages.length
  ]!;
}
