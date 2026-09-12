import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import firstRecord from '../content/passages/frankenstein-1831-chapter-4.json';
import secondRecord from '../content/passages/persuasion-1818-chapter-4-prudence-and-romance.json';
import { passageSchema } from '../lib/passage-schema';
import { toPublicPassage } from '../lib/public-passage';
import PassageDiscovery from './PassageDiscovery';

const passages = [
  toPublicPassage(passageSchema.parse(firstRecord)),
  toPublicPassage(passageSchema.parse(secondRecord)),
];

const originalScrollIntoView = Object.getOwnPropertyDescriptor(
  Element.prototype,
  'scrollIntoView',
);

function installScrollIntoViewMock() {
  const scrollIntoView = vi.fn();
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: scrollIntoView,
    writable: true,
  });
  return scrollIntoView;
}

function captureAnimationFrame() {
  let callback: FrameRequestCallback = () => undefined;
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((nextCallback: FrameRequestCallback) => {
      callback = nextCallback;
      return 1;
    }),
  );
  return () => callback(0);
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalScrollIntoView) {
    Object.defineProperty(
      Element.prototype,
      'scrollIntoView',
      originalScrollIntoView,
    );
  } else {
    Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  }
});

describe('passage discovery', () => {
  it('reports an intentional error for an empty shelf', () => {
    expect(() => render(<PassageDiscovery passages={[]} />)).toThrow(
      'The passage shelf requires at least one passage.',
    );
  });
  it('presents a finite shelf and changes passage with its context intact', () => {
    const scrollIntoView = installScrollIntoViewMock();
    const runAnimationFrame = captureAnimationFrame();
    render(<PassageDiscovery passages={passages} />);

    expect(screen.getByText('2 pages, carefully chosen')).toBeTruthy();
    fireEvent.click(screen.getByText('Choose a page'));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    fireEvent.click(
      screen.getByRole('button', { name: /Persuasion Jane Austen/ }),
    );
    runAnimationFrame();

    const heading = screen.getByRole('heading', { name: 'Persuasion' });
    expect(heading).toBeTruthy();
    expect(document.activeElement).toBe(heading);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
    expect(
      screen
        .getByText('Choose a page')
        .closest('details')
        ?.hasAttribute('open'),
    ).toBe(false);
    expect(document.querySelector('.source-byline')?.textContent).toBe(
      'by Jane Austen · first published 1817',
    );
    expect(
      screen.getByText(
        'Chapter IV · Project Gutenberg English transcription, presented as 1818',
      ),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('button', { name: /Persuasion Jane Austen/ })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('avoids smooth scrolling when reduced motion is preferred', () => {
    const scrollIntoView = installScrollIntoViewMock();
    const runAnimationFrame = captureAnimationFrame();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    render(<PassageDiscovery passages={passages} />);

    fireEvent.click(screen.getByText('Choose a page'));
    fireEvent.click(
      screen.getByRole('button', {
        name: /Frankenstein; Or, The Modern Prometheus/,
      }),
    );
    runAnimationFrame();

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
    });
  });

  it('offers a one-action surprise without choosing poem words', () => {
    const scrollIntoView = installScrollIntoViewMock();
    const runAnimationFrame = captureAnimationFrame();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<PassageDiscovery passages={passages} />);

    fireEvent.click(screen.getByRole('button', { name: 'Surprise me' }));
    runAnimationFrame();

    const heading = screen.getByRole('heading', { name: 'Persuasion' });
    expect(document.activeElement).toBe(heading);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
    expect(screen.getByLabelText('Your poem text').textContent).toBe(
      'Your chosen words will gather here.',
    );
  });
});
