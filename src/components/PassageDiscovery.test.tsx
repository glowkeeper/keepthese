import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
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
const journeys = [
  {
    invitation: 'Two pages about changing direction.',
    journeyId: 'test-journey',
    passageIds: [passages[1]!.passageId, passages[0]!.passageId],
    title: 'A test path',
  },
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
    expect(() =>
      render(<PassageDiscovery journeys={journeys} passages={[]} />),
    ).toThrow('The passage shelf requires at least one passage.');
  });
  it('presents a finite shelf and changes passage with its context intact', () => {
    const scrollIntoView = installScrollIntoViewMock();
    const runAnimationFrame = captureAnimationFrame();
    render(<PassageDiscovery journeys={journeys} passages={passages} />);

    expect(screen.getByText('2 pages, carefully chosen')).toBeTruthy();
    fireEvent.click(screen.getByText('Choose a page'));
    expect(
      screen
        .getByText('Choose a page')
        .closest('details')
        ?.querySelectorAll('li'),
    ).toHaveLength(2);
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
    render(<PassageDiscovery journeys={journeys} passages={passages} />);

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
    render(<PassageDiscovery journeys={journeys} passages={passages} />);

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

  it('offers a finite literary path with clear position and navigation', () => {
    installScrollIntoViewMock();
    const runAnimationFrame = captureAnimationFrame();
    render(<PassageDiscovery journeys={journeys} passages={passages} />);

    fireEvent.click(screen.getByText('Follow a literary path'));
    expect(screen.getByRole('heading', { name: 'A test path' })).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Begin this 2-page path' }),
    );
    runAnimationFrame();

    expect(screen.getByText('Literary path · page 1 of 2')).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: 'A test path', level: 2 }),
    );
    expect(screen.getByRole('heading', { name: 'Persuasion' })).toBeTruthy();
    expect(
      screen
        .getByRole('button', { name: 'Previous page' })
        .hasAttribute('disabled'),
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    runAnimationFrame();

    expect(screen.getByText('Literary path · page 2 of 2')).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: 'A test path', level: 2 }),
    );
    expect(
      screen.getByRole('heading', {
        name: 'Frankenstein; Or, The Modern Prometheus',
      }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Leave this path' }));
    expect(screen.queryByText('Literary path · page 2 of 2')).toBeNull();
  });

  it('keeps each journey poem and resolves into an ordered sequence', async () => {
    installScrollIntoViewMock();
    const runAnimationFrame = captureAnimationFrame();
    render(<PassageDiscovery journeys={journeys} passages={passages} />);

    fireEvent.click(screen.getByText('Follow a literary path'));
    fireEvent.click(
      screen.getByRole('button', { name: 'Begin this 2-page path' }),
    );
    runAnimationFrame();

    fireEvent.click(screen.getAllByRole('button', { name: /^Keep / })[0]!);
    fireEvent.click(
      screen.getByRole('button', { name: 'Keep this poem and continue' }),
    );
    runAnimationFrame();

    expect(screen.getByText('Literary path · page 2 of 2')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: /^Keep / })[0]!);
    fireEvent.click(screen.getByRole('button', { name: 'Complete this path' }));
    runAnimationFrame();

    expect(screen.getByText('Literary path complete')).toBeTruthy();
    expect(
      screen.getByText(
        '2 source pages, answered with 2 poems of your own. They remain private in this browser unless you choose to download them.',
      ),
    ).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole('heading', {
        name: 'Your A test path sequence',
        level: 2,
      }),
    );
    expect(
      screen.getAllByRole('button', { name: 'Return to this poem' }),
    ).toHaveLength(2);
    expect(screen.queryByRole('heading', { name: 'Your poem' })).toBeNull();

    localStorage.clear();
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Return to this poem' })[0]!,
    );
    runAnimationFrame();
    await waitFor(() =>
      expect(screen.getByLabelText('Your poem text').textContent).not.toBe(
        'Your chosen words will gather here.',
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Complete this path' }));
    runAnimationFrame();
    fireEvent.click(screen.getByRole('button', { name: 'Leave this path' }));
    expect(screen.queryByText('Literary path complete')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Your poem' })).toBeTruthy();
  });
});
