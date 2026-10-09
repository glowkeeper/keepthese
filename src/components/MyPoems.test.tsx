import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import firstRecord from '../content/passages/frankenstein-1831-chapter-4.json';
import { archiveKey, saveToArchive } from '../lib/poem-archive';
import { segmentPassages } from '../lib/studio-state';
import { passageSchema } from '../lib/passage-schema';
import { toPublicPassage } from '../lib/public-passage';
import MyPoems from './MyPoems';

// Counts how often a page is split into words, passing the real work through.
vi.mock('../lib/studio-state', async (importOriginal) => {
  const original = await importOriginal<typeof import('../lib/studio-state')>();
  return { ...original, segmentPassages: vi.fn(original.segmentPassages) };
});

const passage = toPublicPassage(passageSchema.parse(firstRecord));
const source = {
  author: passage.work.author.name,
  chapter: passage.passageLocation.chapter,
  recordUrl: passage.source.recordUrl,
  requiredCredit: passage.attribution.requiredCredit,
  sourceLabel: passage.attribution.sourceLabel,
  title: passage.work.title,
};

function savePoem(
  id: string,
  when: string,
  overrides: { textVersion?: number; poem?: string } = {},
) {
  saveToArchive(
    window.localStorage,
    {
      blackout: false,
      material: 'ink',
      passageId: passage.passageId,
      poem: overrides.poem ?? 'Life death',
      selectedIds: ['word-5', 'word-9'],
      source,
      textVersion: overrides.textVersion ?? passage.textVersion,
    },
    { createId: () => id, now: () => new Date(when) },
  );
}

async function renderPage() {
  render(<MyPoems passages={[passage]} />);
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  window.localStorage.clear();
  vi.mocked(segmentPassages).mockClear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('My poems', () => {
  it('says plainly when nothing is saved and points back to the studio', async () => {
    await renderPage();

    expect(
      screen.getByRole('heading', { name: 'Nothing saved yet' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Make a poem' }).getAttribute('href'),
    ).toBe('/');
  });

  it('lists poems newest first with their words, source, credit, and date', async () => {
    savePoem('older', '2026-10-01T09:00:00Z', { poem: 'older words' });
    savePoem('newer', '2026-10-09T09:00:00Z', { poem: 'newer words' });
    await renderPage();

    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(2);
    expect(within(articles[0]!).getByText('newer words')).toBeTruthy();
    expect(within(articles[1]!).getByText('older words')).toBeTruthy();
    expect(
      within(articles[0]!).getByText(
        new RegExp(passage.attribution.requiredCredit),
      ),
    ).toBeTruthy();
    expect(
      within(articles[0]!)
        .getByRole('link', { name: /Source edition/ })
        .getAttribute('href'),
    ).toBe(passage.source.recordUrl);
    expect(articles[0]!.querySelector('time')?.getAttribute('datetime')).toBe(
      '2026-10-09T09:00:00.000Z',
    );
  });

  it('explains storage honestly and shows no popularity or streak figures', async () => {
    savePoem('a', '2026-10-09T09:00:00Z');
    const { container } = render(<MyPoems passages={[passage]} />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toMatch(/1 poem saved, using about \d+ KB/);
    expect(container.textContent).toMatch(/may clear it without warning/);
    expect(container.textContent).not.toMatch(
      /streak|views|likes|popular|trending|in a row/i,
    );
  });

  it('offers to open a working copy through the archive address', async () => {
    savePoem('abc-123', '2026-10-09T09:00:00Z');
    await renderPage();

    expect(
      screen
        .getByRole('link', { name: /Open a working copy/ })
        .getAttribute('href'),
    ).toBe(
      `/passages/${encodeURIComponent(passage.passageId)}/#archive=abc-123`,
    );
  });

  it('keeps the words and credit of a poem whose page version is gone, without reopening it', async () => {
    savePoem('old-version', '2026-10-09T09:00:00Z', { textVersion: 99 });
    await renderPage();

    expect(screen.getByText(/earlier version of its page/)).toBeTruthy();
    expect(screen.getByText('Life death')).toBeTruthy();
    expect(
      screen.queryByRole('link', { name: /Open a working copy/ }),
    ).toBeNull();
    expect(screen.queryByRole('button', { name: /Copy poem link/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Download text/ })).toBeTruthy();
  });

  it('asks before deleting, deletes only that poem, and says so', async () => {
    savePoem('keep', '2026-10-09T09:00:00Z', { poem: 'kept poem' });
    savePoem('drop', '2026-10-10T09:00:00Z', { poem: 'dropped poem' });
    await renderPage();

    fireEvent.click(
      screen.getAllByRole('button', { name: /Delete the poem/ })[0]!,
    );
    expect(screen.getByText(/This cannot be undone/)).toBeTruthy();
    expect(window.localStorage.getItem(archiveKey('drop'))).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Delete poem' }));

    expect(window.localStorage.getItem(archiveKey('drop'))).toBeNull();
    expect(window.localStorage.getItem(archiveKey('keep'))).not.toBeNull();
    expect(screen.queryByText('dropped poem')).toBeNull();
    expect(screen.getByText('kept poem')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe(
      'Poem deleted from this browser.',
    );
  });

  it('lets a maker change their mind about deleting', async () => {
    savePoem('a', '2026-10-09T09:00:00Z');
    await renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Delete the poem/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep it' }));

    expect(window.localStorage.getItem(archiveKey('a'))).not.toBeNull();
    expect(screen.queryByText(/This cannot be undone/)).toBeNull();
  });

  it('reports a deletion the browser refused instead of pretending it worked', async () => {
    savePoem('a', '2026-10-09T09:00:00Z');
    await renderPage();
    const real = window.localStorage;
    const stubborn = {
      get length() {
        return real.length;
      },
      getItem: (key: string) => real.getItem(key),
      key: (index: number) => real.key(index),
      removeItem: () => undefined,
      setItem: (key: string, value: string) => real.setItem(key, value),
    };
    vi.spyOn(window, 'localStorage', 'get').mockReturnValue(
      stubborn as unknown as Storage,
    );

    fireEvent.click(screen.getByRole('button', { name: /Delete the poem/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete poem' }));

    expect(screen.getByRole('status').textContent).toMatch(
      /would not let Keep These delete that poem/,
    );
  });

  it('counts unreadable records without removing them', async () => {
    savePoem('good', '2026-10-09T09:00:00Z');
    window.localStorage.setItem(archiveKey('bad'), '{broken');
    await renderPage();

    expect(screen.getByText(/1 saved record could not be read/)).toBeTruthy();
    expect(screen.getByText(/Nothing has been removed/)).toBeTruthy();
    expect(window.localStorage.getItem(archiveKey('bad'))).toBe('{broken');
  });

  it('does not say nothing is saved when every record is unreadable', async () => {
    window.localStorage.setItem(archiveKey('bad'), '{broken');
    await renderPage();

    expect(
      screen.getByRole('heading', { name: 'No readable poems' }),
    ).toBeTruthy();
    expect(screen.queryByText('Nothing saved yet')).toBeNull();
    expect(screen.getByText(/1 saved record could not be read/)).toBeTruthy();
    expect(window.localStorage.getItem(archiveKey('bad'))).toBe('{broken');
  });

  it('moves focus to the confirmation when Delete is activated, and back on Keep it', async () => {
    savePoem('a', '2026-10-09T09:00:00Z');
    await renderPage();
    const deleteButton = screen.getByRole('button', {
      name: /Delete the poem/,
    });
    deleteButton.focus();

    fireEvent.click(deleteButton);

    const group = screen.getByRole('group', {
      name: 'Delete this poem? This cannot be undone.',
    });
    expect(document.activeElement).toBe(group);

    fireEvent.click(screen.getByRole('button', { name: 'Keep it' }));
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: /Delete the poem/ }),
    );
  });

  it('splits each page into words once, however many poems or re-renders', async () => {
    savePoem('a', '2026-10-01T09:00:00Z');
    savePoem('b', '2026-10-02T09:00:00Z');
    savePoem('c', '2026-10-03T09:00:00Z');
    await renderPage();
    const afterFirstRender = vi.mocked(segmentPassages).mock.calls.length;

    fireEvent.click(
      screen.getAllByRole('button', { name: /Delete the poem/ })[0]!,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Keep it' }));

    expect(afterFirstRender).toBe(1);
    expect(vi.mocked(segmentPassages).mock.calls).toHaveLength(1);
  });

  it('says so, without losing anything, when the browser blocks storage', async () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked');
    });
    await renderPage();

    expect(screen.getByRole('status').textContent).toMatch(
      /not letting Keep These read saved poems/,
    );
  });
});
