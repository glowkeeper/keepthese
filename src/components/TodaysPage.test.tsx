import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import firstRecord from '../content/passages/frankenstein-1831-chapter-4.json';
import secondRecord from '../content/passages/persuasion-1818-chapter-4-prudence-and-romance.json';
import { passageSchema } from '../lib/passage-schema';
import { toPublicPassage } from '../lib/public-passage';
import TodaysPage from './TodaysPage';

const passages = [
  toPublicPassage(passageSchema.parse(firstRecord)),
  toPublicPassage(passageSchema.parse(secondRecord)),
];

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Today’s page', () => {
  it('links to the passage for the current UTC day with its source named', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('1970-01-02T00:00:00Z'));
    render(<TodaysPage passages={passages} />);

    const link = screen.getByRole('link', { name: /Today’s page/ });
    expect(link.getAttribute('href')).toBe(
      `/passages/${encodeURIComponent(passages[1]!.passageId)}/`,
    );
    expect(link.textContent).toContain(passages[1]!.work.title);
  });

  it('moves to the next passage at 00:00 UTC without any other event', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('1970-01-01T23:59:00Z'));
    render(<TodaysPage passages={passages} />);
    const href = () =>
      screen.getByRole('link', { name: /Today’s page/ }).getAttribute('href');
    expect(href()).toBe(
      `/passages/${encodeURIComponent(passages[0]!.passageId)}/`,
    );

    act(() => {
      vi.advanceTimersByTime(61_000);
    });

    expect(href()).toBe(
      `/passages/${encodeURIComponent(passages[1]!.passageId)}/`,
    );
  });

  it('uses no streak, countdown, or completion language', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-09T09:00:00Z'));
    const { container } = render(<TodaysPage passages={passages} />);

    expect(container.textContent).not.toMatch(
      /streak|countdown|remaining|missed|complete|days in a row/i,
    );
  });

  it('shows nothing, without failing, when there are no passages', () => {
    const { container } = render(<TodaysPage passages={[]} />);

    expect(screen.queryByRole('link')).toBeNull();
    expect(container.querySelector('.todays-page-slot')).not.toBeNull();
  });
});
