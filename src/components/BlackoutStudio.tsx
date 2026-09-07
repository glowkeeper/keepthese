import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import type { Passage } from '../lib/passage-schema';
import {
  downloadPng,
  pngFilename,
  renderElementToPng,
} from '../lib/png-export';
import {
  initialStudioState,
  segmentPassages,
  studioReducer,
} from '../lib/studio-state';
import {
  discardStudioState,
  loadStudioState,
  saveStudioState,
  type StudioMaterial,
} from '../lib/studio-persistence';

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

interface BlackoutStudioProps {
  passage: Passage;
}

export function BlackoutStudio({ passage }: BlackoutStudioProps) {
  const [state, dispatch] = useReducer(studioReducer, initialStudioState);
  const [activeWordId, setActiveWordId] = useState('word-0');
  const [material, setMaterial] = useState<StudioMaterial>('ink');
  const [storageStatus, setStorageStatus] = useState(
    'Work is saved privately in this browser as you make it.',
  );
  const [storageReady, setStorageReady] = useState(false);
  const skipNextSave = useRef(false);
  const sourcePageRef = useRef<HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(
    'PNG export is created here and stays on this device.',
  );
  const paragraphs = useMemo(
    () => segmentPassages(passage.text),
    [passage.text],
  );
  const words = useMemo(
    () =>
      paragraphs.flatMap((segments) =>
        segments.filter((segment) => segment.kind === 'word'),
      ),
    [paragraphs],
  );
  const allWordIds = useMemo(() => words.map(({ id }) => id), [words]);
  const selected = new Set(state.selectedIds);
  const poem = words
    .filter(({ id }) => selected.has(id))
    .map(({ text }) => text)
    .join(' ');

  useEffect(() => {
    const result = loadStudioState(
      browserStorage(),
      passage.passageId,
      passage.textVersion,
      new Set(allWordIds),
    );
    queueMicrotask(() => {
      setStorageReady(true);
      if (result.kind === 'failed') {
        queueMicrotask(() =>
          setStorageStatus(
            'This browser is not allowing local saves. Your work will last only in this open page.',
          ),
        );
      } else if (result.kind === 'restored') {
        dispatch({
          blackout: result.value.blackout,
          selectedIds: result.value.selectedIds,
          type: 'restore',
        });
        setMaterial(result.value.material);
        setStorageStatus('Saved work was recovered from this browser.');
      }
    });
  }, [allWordIds, passage.passageId, passage.textVersion]);

  useEffect(() => {
    if (!storageReady) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (
      state.selectedIds.length === 0 &&
      !state.blackout &&
      material === 'ink'
    ) {
      if (
        discardStudioState(browserStorage(), passage.passageId) === 'failed'
      ) {
        queueMicrotask(() =>
          setStorageStatus(
            'This browser is not allowing local saves. Your work will last only in this open page.',
          ),
        );
      }
      return;
    }
    const result = saveStudioState(browserStorage(), {
      blackout: state.blackout,
      material,
      passageId: passage.passageId,
      savedAt: new Date().toISOString(),
      schemaVersion: 1,
      selectedIds: state.selectedIds,
      textVersion: passage.textVersion,
    });
    if (result === 'failed') {
      queueMicrotask(() =>
        setStorageStatus(
          'This browser is not allowing local saves. Your work will last only in this open page.',
        ),
      );
    } else {
      queueMicrotask(() =>
        setStorageStatus('Saved privately in this browser.'),
      );
    }
  }, [
    material,
    passage.passageId,
    passage.textVersion,
    state.blackout,
    state.selectedIds,
    storageReady,
  ]);

  function discardSavedWork() {
    skipNextSave.current = true;
    dispatch({ type: 'restart' });
    setMaterial('ink');
    const result = discardStudioState(browserStorage(), passage.passageId);
    setStorageStatus(
      result === 'saved'
        ? 'Saved work discarded from this browser.'
        : 'The page was cleared, but this browser would not allow the saved copy to be removed.',
    );
  }

  async function exportArtwork() {
    if (!sourcePageRef.current || isExporting) return;
    setIsExporting(true);
    setExportStatus('Preparing your PNG…');

    try {
      const blob = await renderElementToPng(sourcePageRef.current);
      downloadPng(blob, pngFilename(passage.work.title));
      setExportStatus('PNG downloaded to your device.');
    } catch {
      setExportStatus(
        "We couldn't create the PNG. Your poem is still here; please try again.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  function moveWordFocus(
    event: KeyboardEvent<HTMLButtonElement>,
    currentId: string,
  ) {
    const currentIndex = allWordIds.indexOf(currentId);
    let nextIndex: number | undefined;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = Math.min(currentIndex + 1, allWordIds.length - 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = Math.max(currentIndex - 1, 0);
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = allWordIds.length - 1;
    }

    if (nextIndex === undefined) return;

    event.preventDefault();
    const nextId = allWordIds[nextIndex];
    if (!nextId) return;

    setActiveWordId(nextId);
    event.currentTarget
      .closest('.source-page')
      ?.querySelector<HTMLElement>(`[data-word-id="${nextId}"]`)
      ?.focus();
  }

  return (
    <section className="studio" aria-labelledby="studio-heading">
      <div className="studio-introduction">
        <p className="eyebrow">Begin with</p>
        <h2 id="studio-heading">
          <cite>{passage.work.title}</cite>
        </h2>
        <p className="source-byline">
          {passage.work.author.name} · {passage.passageLocation.chapter}
        </p>
        <p>
          Keep the words that speak. Your poem will always follow their order on
          the page. With a keyboard, use the arrow keys to move through words.
        </p>
      </div>

      <div className="making-surface">
        <article
          ref={sourcePageRef}
          className={`source-page source-page--material-${material}${state.blackout ? ' source-page--blackout' : ''}`}
          aria-label="Source passage"
        >
          {paragraphs.map((segments, paragraphIndex) => (
            <p key={paragraphIndex}>
              {segments.map((segment, segmentIndex) => {
                if (segment.kind === 'text') {
                  return (
                    <span key={`text-${segmentIndex}`}>{segment.text}</span>
                  );
                }

                const isSelected = selected.has(segment.id);
                return (
                  <button
                    aria-label={`${isSelected ? 'Remove' : 'Keep'} ${segment.text}`}
                    aria-pressed={isSelected}
                    className={`source-word${isSelected ? ' source-word--kept' : ''}`}
                    data-word-id={segment.id}
                    key={segment.id}
                    onFocus={() => setActiveWordId(segment.id)}
                    onKeyDown={(event) => moveWordFocus(event, segment.id)}
                    onClick={() =>
                      dispatch({
                        allWordIds,
                        tokenId: segment.id,
                        tokenText: segment.text,
                        type: 'toggle-word',
                      })
                    }
                    tabIndex={activeWordId === segment.id ? 0 : -1}
                    type="button"
                  >
                    {segment.text}
                  </button>
                );
              })}
            </p>
          ))}
          <footer className="source-credit">
            <p>
              <cite>{passage.work.title}</cite> by {passage.work.author.name} (
              {passage.work.firstPublishedYear}) ·{' '}
              {passage.passageLocation.chapter}
            </p>
            <a href={passage.source.recordUrl}>
              {passage.attribution.sourceLabel}
            </a>
          </footer>
        </article>

        <aside className="poem-panel" aria-labelledby="poem-heading">
          <p className="eyebrow">Words kept</p>
          <h3 id="poem-heading">Your poem</h3>
          <p
            aria-label="Your poem text"
            className={`emerging-poem${poem ? '' : ' emerging-poem--empty'}`}
          >
            {poem || 'Your chosen words will gather here.'}
          </p>

          <fieldset className="material-picker">
            <legend>Material</legend>
            <button
              aria-pressed={material === 'ink'}
              className="material-choice material-choice--ink"
              onClick={() => setMaterial('ink')}
              type="button"
            >
              Ink
            </button>
            <button
              aria-pressed={material === 'graphite'}
              className="material-choice material-choice--graphite"
              onClick={() => setMaterial('graphite')}
              type="button"
            >
              Graphite
            </button>
          </fieldset>

          <div className="studio-actions" aria-label="Poem actions">
            <button
              disabled={state.history.length === 0}
              onClick={() => dispatch({ type: 'undo' })}
              type="button"
            >
              Undo
            </button>
            <button
              disabled={state.selectedIds.length === 0 && !state.blackout}
              onClick={() => dispatch({ type: 'restart' })}
              type="button"
            >
              Restart
            </button>
            <button
              disabled={state.selectedIds.length === 0 && !state.blackout}
              className="blackout-action"
              onClick={() => dispatch({ type: 'toggle-blackout' })}
              type="button"
            >
              {state.blackout
                ? 'Bring the page back'
                : 'Let the rest fall away'}
            </button>
            <button
              className="export-action"
              disabled={state.selectedIds.length === 0 || isExporting}
              onClick={exportArtwork}
              type="button"
            >
              {isExporting ? 'Preparing PNG…' : 'Download PNG'}
            </button>
            <button
              disabled={
                state.selectedIds.length === 0 &&
                !state.blackout &&
                material === 'ink'
              }
              onClick={discardSavedWork}
              type="button"
            >
              Discard saved work
            </button>
          </div>

          <p className="export-status" aria-live="polite">
            {exportStatus}
          </p>
          <p className="storage-status">{storageStatus}</p>

          <p className="visually-hidden" aria-live="polite" role="status">
            {state.announcement}
          </p>
        </aside>
      </div>
    </section>
  );
}

export default BlackoutStudio;
