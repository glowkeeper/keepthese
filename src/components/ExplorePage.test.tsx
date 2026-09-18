import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import firstRecord from '../content/passages/frankenstein-1831-chapter-4.json';
import secondRecord from '../content/passages/persuasion-1818-chapter-4-prudence-and-romance.json';
import { passageSchema } from '../lib/passage-schema';
import { toPublicPassage } from '../lib/public-passage';
import ExplorePage from './ExplorePage';

const passages = [
  toPublicPassage(passageSchema.parse(firstRecord)),
  toPublicPassage(passageSchema.parse(secondRecord)),
];
const journeys = [
  {
    invitation: 'Two pages about changing direction.',
    journeyId: 'test-journey',
    passageIds: [passages[1]!.passageId, passages[0]!.passageId],
    title: 'A test path',
  },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Explore page', () => {
  it('presents the complete finite shelf and literary paths', () => {
    render(<ExplorePage journeys={journeys} passages={passages} />);

    expect(screen.getByRole('heading', { name: 'Choose a page' })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /Chapter IV/ })).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'A test path' })).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Begin this 2-page path' })
        .getAttribute('href'),
    ).toBe('/journeys/test-journey/');
  });

  it('keeps an ordinary fallback destination for modified random choices', () => {
    render(<ExplorePage journeys={journeys} passages={passages} />);
    const link = screen.getByRole('link', { name: 'Choose for me' });

    expect(link.getAttribute('href')).toBe(
      '/passages/frankenstein-1831-chapter-4-life-and-death/',
    );
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      metaKey: true,
    });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
