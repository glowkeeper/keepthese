import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import type { PublicPassage } from '../lib/public-passage';
import {
  canSharePng,
  downloadPng,
  pngFilename,
  renderElementToPng,
  sharePng,
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
import { poemShareUrl } from '../lib/stateless-poem-link';

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

interface BlackoutStudioProps {
  journeyAction?: {
    label: string;
    onKeep: (work: KeptPoemWork) => void;
  };
  passage: PublicPassage;
  preservePrivateWork?: boolean;
  sessionWork?: KeptPoemWork;
}

export interface KeptPoemWork {
  blackout: boolean;
  material: StudioMaterial;
  poem: string;
  selectedIds: string[];
}

export function BlackoutStudio({
  journeyAction,
  passage,
  preservePrivateWork = false,
  sessionWork,
}: BlackoutStudioProps) {
  const [state, dispatch] = useReducer(studioReducer, initialStudioState);
  const [activeWordId, setActiveWordId] = useState('word-0');
  const [material, setMaterial] = useState<StudioMaterial>('ink');
  const [storageStatus, setStorageStatus] = useState(
    'Work is saved privately in this browser as you make it.',
  );
  const [storageReady, setStorageReady] = useState(false);
  const [restoredWork, setRestoredWork] = useState(false);
  const skipNextSave = useRef(false);
  const shareInFlight = useRef(false);
  const sourcePageRef = useRef<HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [canShareArtwork, setCanShareArtwork] = useState(false);
  const [preparedShare, setPreparedShare] = useState<{
    blob: Blob;
    key: string;
  } | null>(null);
  const [exportStatus, setExportStatus] = useState(
    'PNG export is created here and stays on this device.',
  );
  const [poemLink, setPoemLink] = useState('');
  const [poemLinkStatus, setPoemLinkStatus] = useState(
    'Poem links contain your choices and require no account or upload.',
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
  const shareArtworkKey = `${passage.passageId}:${material}:${state.blackout}:${state.selectedIds.join(',')}`;
  const shareArtworkReady = preparedShare?.key === shareArtworkKey;

  useEffect(() => {
    queueMicrotask(() => setCanShareArtwork(canSharePng()));
  }, []);

  useEffect(() => {
    if (
      !canShareArtwork ||
      state.selectedIds.length === 0 ||
      !sourcePageRef.current
    )
      return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      const sourcePage = sourcePageRef.current;
      if (!sourcePage) return;
      void renderElementToPng(sourcePage)
        .then((blob) => {
          if (!cancelled) setPreparedShare({ blob, key: shareArtworkKey });
        })
        .catch(() => {
          // Download remains available if background share preparation fails.
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [canShareArtwork, shareArtworkKey, state.selectedIds.length]);

  useEffect(() => {
    if (sessionWork) {
      queueMicrotask(() => {
        dispatch({
          blackout: sessionWork.blackout,
          selectedIds: sessionWork.selectedIds,
          type: 'restore',
        });
        setMaterial(sessionWork.material);
        setStorageReady(true);
        setStorageStatus(
          preservePrivateWork
            ? 'This shared poem is open only in this tab. Your saved work for this page has not been changed.'
            : 'Work kept in this path was restored for revision.',
        );
      });
      return;
    }

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
        setRestoredWork(true);
        setStorageStatus('Saved work was recovered from this browser.');
      }
    });
  }, [
    allWordIds,
    passage.passageId,
    passage.textVersion,
    preservePrivateWork,
    sessionWork,
  ]);

  useEffect(() => {
    if (!storageReady || preservePrivateWork) return;
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
    preservePrivateWork,
  ]);

  function discardSavedWork() {
    skipNextSave.current = true;
    dispatch({ type: 'restart' });
    setMaterial('ink');
    setRestoredWork(false);
    if (preservePrivateWork) {
      setStorageStatus(
        'The shared version was cleared from this tab. Your saved work was not changed.',
      );
      return;
    }
    const result = discardStudioState(browserStorage(), passage.passageId);
    setStorageStatus(
      result === 'saved'
        ? 'Saved work discarded from this browser.'
        : 'The page was cleared, but this browser would not allow the saved copy to be removed.',
    );
  }

  function restartStudio() {
    setRestoredWork(false);
    dispatch({ type: 'restart' });
  }

  async function exportArtwork() {
    if (!sourcePageRef.current || isExporting || isSharing) return;
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

  async function shareArtwork() {
    const prepared = preparedShare;
    if (
      !prepared ||
      prepared.key !== shareArtworkKey ||
      isExporting ||
      isSharing
    )
      return;
    if (shareInFlight.current) return;
    shareInFlight.current = true;
    setIsSharing(true);
    setExportStatus('Opening your device’s share controls…');

    try {
      const filename = pngFilename(passage.work.title);
      const result = await sharePng(prepared.blob, filename);
      if (result === 'shared') {
        setExportStatus('PNG passed to your device’s share controls.');
      } else if (result === 'cancelled') {
        setExportStatus('Sharing cancelled. Your poem is still here.');
      } else {
        setCanShareArtwork(false);
        setExportStatus(
          'This browser cannot share PNG files directly. Download remains available.',
        );
      }
    } catch {
      setExportStatus(
        "We couldn't open your device’s share controls. Your poem is still here; download remains available.",
      );
    } finally {
      shareInFlight.current = false;
      setIsSharing(false);
    }
  }

  async function copyPoemLink() {
    if (state.selectedIds.length === 0) return;
    const link = poemShareUrl(window.location, {
      blackout: state.blackout,
      material,
      passageId: passage.passageId,
      selectedIds: state.selectedIds,
      textVersion: passage.textVersion,
    });
    setPoemLink(link);

    try {
      if (!navigator.clipboard?.writeText)
        throw new Error('Clipboard unavailable.');
      await navigator.clipboard.writeText(link);
      setPoemLinkStatus(
        'Poem link copied. It contains your choices, not an uploaded poem.',
      );
    } catch {
      setPoemLinkStatus(
        'Your poem link is ready below. Copy it to share your poem.',
      );
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
        <h2 id="studio-heading" tabIndex={-1}>
          <cite>{passage.work.title}</cite>
        </h2>
        <p className="source-byline">
          by <strong>{passage.work.author.name}</strong> · first published{' '}
          {passage.work.firstPublishedYear}
        </p>
        <p className="passage-location">
          {passage.passageLocation.chapter} · {passage.passageLocation.edition}
        </p>
        <p className="passage-context">{passage.curation.context}</p>
        <a className="source-route" href={passage.source.recordUrl}>
          {passage.attribution.sourceLabel} <span aria-hidden="true">→</span>
        </a>
        <details className="studio-help">
          <summary>How to choose words</summary>
          <p>
            Keep the words that speak. Your poem will always follow their order
            on the page. With a keyboard, use the arrow keys to move through
            words.
          </p>
        </details>
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
              {passage.passageLocation.edition} ·{' '}
              {passage.passageLocation.chapter}
            </p>
            <p>{passage.attribution.requiredCredit}</p>
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

          {restoredWork ? (
            <div className="restored-work" role="status">
              <p>Your saved work for this page has been restored.</p>
              <div>
                <button onClick={() => setRestoredWork(false)} type="button">
                  Continue with this poem
                </button>
                <button onClick={discardSavedWork} type="button">
                  Start this page again
                </button>
              </div>
            </div>
          ) : null}

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
            {journeyAction ? (
              <button
                className="journey-keep-action"
                disabled={state.selectedIds.length === 0}
                onClick={() =>
                  journeyAction.onKeep({
                    blackout: state.blackout,
                    material,
                    poem,
                    selectedIds: state.selectedIds,
                  })
                }
                type="button"
              >
                {journeyAction.label}
              </button>
            ) : null}
            <button
              disabled={state.history.length === 0}
              onClick={() => dispatch({ type: 'undo' })}
              type="button"
            >
              Undo
            </button>
            <button
              disabled={state.selectedIds.length === 0 && !state.blackout}
              onClick={restartStudio}
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
              disabled={
                state.selectedIds.length === 0 || isExporting || isSharing
              }
              onClick={exportArtwork}
              type="button"
            >
              {isExporting ? 'Preparing PNG…' : 'Download PNG'}
            </button>
            {canShareArtwork ? (
              <button
                className="share-action"
                disabled={
                  state.selectedIds.length === 0 ||
                  !shareArtworkReady ||
                  isExporting ||
                  isSharing
                }
                onClick={shareArtwork}
                type="button"
              >
                {isSharing
                  ? 'Sharing…'
                  : state.selectedIds.length > 0 && !shareArtworkReady
                    ? 'Preparing share…'
                    : 'Share PNG'}
              </button>
            ) : null}
            <button
              className="poem-link-action"
              disabled={state.selectedIds.length === 0}
              onClick={copyPoemLink}
              type="button"
            >
              Copy poem link
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
              {preservePrivateWork
                ? 'Clear shared changes'
                : 'Discard saved work'}
            </button>
          </div>

          <p className="export-status" aria-live="polite">
            {exportStatus}
          </p>
          <p className="poem-link-status" aria-live="polite">
            {poemLinkStatus}
          </p>
          {poemLink ? (
            <input
              aria-label="Shareable poem link"
              className="poem-link-value"
              onFocus={(event) => event.currentTarget.select()}
              readOnly
              value={poemLink}
            />
          ) : null}
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
