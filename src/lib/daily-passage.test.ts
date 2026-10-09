import { describe, expect, it } from 'vitest';

import { chooseDailyPassage, utcDayNumber } from './daily-passage';

const shelf = ['a', 'b', 'c'];

describe('daily passage', () => {
  it('counts whole UTC days', () => {
    expect(utcDayNumber(new Date('1970-01-01T00:00:00Z'))).toBe(0);
    expect(utcDayNumber(new Date('1970-01-01T23:59:59.999Z'))).toBe(0);
    expect(utcDayNumber(new Date('1970-01-02T00:00:00Z'))).toBe(1);
  });

  it('gives every moment in one UTC day the same passage', () => {
    const start = chooseDailyPassage(shelf, new Date('2026-10-09T00:00:00Z'));
    expect(chooseDailyPassage(shelf, new Date('2026-10-09T12:34:56Z'))).toBe(
      start,
    );
    expect(
      chooseDailyPassage(shelf, new Date('2026-10-09T23:59:59.999Z')),
    ).toBe(start);
  });

  it('rolls over exactly at midnight UTC, not local midnight', () => {
    const before = chooseDailyPassage(shelf, new Date('2026-10-09T23:59:59Z'));
    const after = chooseDailyPassage(shelf, new Date('2026-10-10T00:00:00Z'));
    expect(after).not.toBe(before);
    // 00:30 in Europe/London on 10 October is still 9 October in UTC.
    expect(chooseDailyPassage(shelf, new Date('2026-10-09T23:30:00Z'))).toBe(
      before,
    );
  });

  it('rotates through the whole shelf in order and then repeats', () => {
    const days = [0, 1, 2, 3, 4, 5].map((day) =>
      chooseDailyPassage(shelf, new Date(Date.UTC(1970, 0, 1 + day))),
    );
    expect(days).toEqual(['a', 'b', 'c', 'a', 'b', 'c']);
  });

  it('is deterministic and handles dates before 1970', () => {
    const date = new Date('1969-12-31T12:00:00Z');
    expect(chooseDailyPassage(shelf, date)).toBe('c');
    expect(chooseDailyPassage(shelf, date)).toBe('c');
  });

  it('fails gracefully with an empty shelf or an invalid date', () => {
    expect(chooseDailyPassage([], new Date('2026-10-09T00:00:00Z'))).toBeNull();
    expect(chooseDailyPassage(shelf, new Date('not a date'))).toBeNull();
  });
});
