import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import firstRecord from '../content/passages/frankenstein-1831-chapter-4.json';
import secondRecord from '../content/passages/persuasion-1818-chapter-4-prudence-and-romance.json';
import { passageSchema } from '../lib/passage-schema';
import PassageDiscovery from './PassageDiscovery';

const passages = [
  passageSchema.parse(firstRecord),
  passageSchema.parse(secondRecord),
];

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('passage discovery', () => {
  it('reports an intentional error for an empty shelf', () => {
    expect(() => render(<PassageDiscovery passages={[]} />)).toThrow(
      'The passage shelf requires at least one passage.',
    );
  });
  it('presents a finite shelf and changes passage with its context intact', () => {
    render(<PassageDiscovery passages={passages} />);

    expect(screen.getByText('2 pages, carefully chosen')).toBeTruthy();
    fireEvent.click(screen.getByText('Choose a page'));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    fireEvent.click(
      screen.getByRole('button', { name: /Persuasion Jane Austen/ }),
    );

    expect(screen.getByRole('heading', { name: 'Persuasion' })).toBeTruthy();
    expect(screen.getByText(/Jane Austen · Chapter IV/)).toBeTruthy();
    expect(
      screen
        .getByRole('button', { name: /Persuasion Jane Austen/ })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('offers a one-action surprise without choosing poem words', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<PassageDiscovery passages={passages} />);

    fireEvent.click(screen.getByRole('button', { name: 'Surprise me' }));

    expect(screen.getByRole('heading', { name: 'Persuasion' })).toBeTruthy();
    expect(screen.getByLabelText('Your poem text').textContent).toBe(
      'Your chosen words will gather here.',
    );
  });
});
