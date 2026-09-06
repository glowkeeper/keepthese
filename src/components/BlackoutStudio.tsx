import { type KeyboardEvent, useMemo, useReducer, useState } from 'react';

import type { Passage } from '../lib/passage-schema';
import {
  initialStudioState,
  segmentPassage,
  studioReducer,
} from '../lib/studio-state';

interface BlackoutStudioProps {
  passage: Passage;
}

export function BlackoutStudio({ passage }: BlackoutStudioProps) {
  const [state, dispatch] = useReducer(studioReducer, initialStudioState);
  const [activeWordId, setActiveWordId] = useState('word-0');
  const paragraphs = useMemo(
    () => passage.text.map((paragraph) => segmentPassage(paragraph)),
    [passage.text],
  );
  const words = paragraphs.flatMap((segments) =>
    segments.filter((segment) => segment.kind === 'word'),
  );
  const allWordIds = words.map(({ id }) => id);
  const selected = new Set(state.selectedIds);
  const poem = words
    .filter(({ id }) => selected.has(id))
    .map(({ text }) => text)
    .join(' ');

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
        <p className="eyebrow">The playable sketch</p>
        <h2 id="studio-heading">Meet the page</h2>
        <p>
          Keep the words that speak. Your poem will always follow their order on
          the page. With a keyboard, use the arrow keys to move through words.
        </p>
      </div>

      <div className="making-surface">
        <article
          className={`source-page${state.blackout ? ' source-page--blackout' : ''}`}
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
              onClick={() => dispatch({ type: 'toggle-blackout' })}
              type="button"
            >
              {state.blackout
                ? 'Bring the page back'
                : 'Let the rest fall away'}
            </button>
          </div>

          <p className="visually-hidden" aria-live="polite" role="status">
            {state.announcement}
          </p>
        </aside>
      </div>

      <details className="source-information">
        <summary>About this page</summary>
        <div>
          <p>
            <cite>{passage.work.title}</cite> by {passage.work.author.name} (
            {passage.work.firstPublishedYear}),{' '}
            {passage.passageLocation.edition}, {passage.passageLocation.chapter}
            .
          </p>
          <p>{passage.attribution.requiredCredit}</p>
          <a href={passage.source.recordUrl}>
            {passage.attribution.sourceLabel}
          </a>
        </div>
      </details>
    </section>
  );
}

export default BlackoutStudio;
