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
  it('presents a finite shelf of canonical passage links', () => {
    render(
      <PassageDiscovery
        journeys={journeys}
        passageRouteId={passages[0]!.passageId}
        passages={passages}
      />,
    );

    expect(screen.queryByText('2 pages, carefully chosen')).toBeNull();
    fireEvent.click(screen.getByText('Choose another'));
    expect(
      screen
        .getByText('Choose another')
        .closest('details')
        ?.querySelectorAll('li'),
    ).toHaveLength(2);
    expect(
      screen
        .getByRole('link', { name: /Persuasion Jane Austen/ })
        .getAttribute('href'),
    ).toBe('/passages/persuasion-1818-chapter-4-prudence-and-romance/');
    expect(document.querySelector('.source-byline')?.textContent).toBe(
      'by Mary Wollstonecraft Shelley · first published 1818',
    );
    expect(
      screen
        .getByRole('link', {
          name: /Frankenstein; Or, The Modern Prometheus/,
        })
        .getAttribute('aria-current'),
    ).toBe('page');
  });

  it('opens on a passage selected by its route', () => {
    render(
      <PassageDiscovery
        initialPassageId={passages[1]!.passageId}
        journeys={journeys}
        passages={passages}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Persuasion' })).toBeTruthy();
    expect(document.querySelector('.source-byline')?.textContent).toBe(
      'by Jane Austen · first published 1817',
    );
  });

  it('offers a one-action alternative without preselecting poem words', () => {
    render(<PassageDiscovery journeys={journeys} passages={passages} />);

    expect(
      screen.getByRole('link', { name: 'Choose for me' }).getAttribute('href'),
    ).toBe('/passages/persuasion-1818-chapter-4-prudence-and-romance/');
    expect(screen.getByLabelText('Your poem text').textContent).toBe(
      'Your chosen words will gather here.',
    );
    expect(screen.getByText('Begin with this page')).toBeTruthy();
    const studio = document.querySelector('.studio');
    expect(studio).toBeTruthy();
    expect(
      studio!.compareDocumentPosition(
        screen.getByRole('navigation', { name: 'Explore other pages' }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('does not claim the selected passage is the current page off-route', () => {
    render(<PassageDiscovery journeys={journeys} passages={passages} />);
    fireEvent.click(screen.getByText('Choose another'));

    expect(
      screen
        .getByRole('link', {
          name: /Frankenstein; Or, The Modern Prometheus/,
        })
        .hasAttribute('aria-current'),
    ).toBe(false);
  });

  it('offers a finite literary path with clear position and navigation', () => {
    installScrollIntoViewMock();
    const runAnimationFrame = captureAnimationFrame();
    render(
      <PassageDiscovery
        initialJourneyId={journeys[0]!.journeyId}
        initialPassageId={passages[1]!.passageId}
        journeys={journeys}
        passages={passages}
      />,
    );

    expect(screen.getByText('Literary path · page 1 of 2')).toBeTruthy();
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
    expect(
      screen
        .getByRole('link', { name: 'Leave this path' })
        .getAttribute('href'),
    ).toBe('/passages/frankenstein-1831-chapter-4-life-and-death/');
  });

  it('keeps each journey poem and resolves into an ordered sequence', async () => {
    installScrollIntoViewMock();
    const runAnimationFrame = captureAnimationFrame();
    render(
      <PassageDiscovery
        initialJourneyId={journeys[0]!.journeyId}
        initialPassageId={passages[1]!.passageId}
        journeys={journeys}
        passages={passages}
      />,
    );

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
    expect(
      screen
        .getByRole('link', { name: 'Leave this path' })
        .getAttribute('href'),
    ).toContain('/passages/');
  });
});
