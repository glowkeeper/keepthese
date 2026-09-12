import { useRef, useState } from 'react';

import { chooseSurprisePassage } from '../lib/passage-discovery';
import type { PublicLiteraryJourney } from '../lib/literary-journey';
import {
  downloadPng,
  pngFilename,
  renderElementToPng,
} from '../lib/png-export';
import type { PublicPassage } from '../lib/public-passage';
import { segmentPassages } from '../lib/studio-state';
import BlackoutStudio, { type KeptPoemWork } from './BlackoutStudio';

interface PassageDiscoveryProps {
  journeys: PublicLiteraryJourney[];
  passages: PublicPassage[];
}

export function PassageDiscovery({
  journeys,
  passages,
}: PassageDiscoveryProps) {
  const journeyChooserRef = useRef<HTMLDetailsElement>(null);
  const journeySequenceExportRef = useRef<HTMLElement>(null);
  const passageChooserRef = useRef<HTMLDetailsElement>(null);
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(null);
  const [journeyComplete, setJourneyComplete] = useState(false);
  const [journeyPoems, setJourneyPoems] = useState<
    Record<string, KeptPoemWork>
  >({});
  const [isExportingJourney, setIsExportingJourney] = useState(false);
  const [journeyExportStatus, setJourneyExportStatus] = useState(
    'The complete sequence is created here and stays on this device.',
  );
  const [currentPassageId, setCurrentPassageId] = useState(
    passages[0]?.passageId ?? '',
  );
  const currentPassage = passages.find(
    ({ passageId }) => passageId === currentPassageId,
  );
  const activeJourney = journeys.find(
    ({ journeyId }) => journeyId === activeJourneyId,
  );
  const activeJourneyIndex =
    activeJourney?.passageIds.indexOf(currentPassageId) ?? -1;

  if (!currentPassage) {
    throw new Error('The passage shelf requires at least one passage.');
  }

  function choosePassage(passageId: string, journeyId: string | null = null) {
    journeyChooserRef.current?.removeAttribute('open');
    passageChooserRef.current?.removeAttribute('open');
    setActiveJourneyId(journeyId);
    setJourneyComplete(false);
    setCurrentPassageId(passageId);
    requestAnimationFrame(() => {
      const destinationHeading = document.getElementById(
        journeyId ? 'journey-heading' : 'studio-heading',
      );
      const reduceMotion =
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
        false;

      destinationHeading?.focus({ preventScroll: true });
      destinationHeading?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  }

  function surpriseMe() {
    choosePassage(chooseSurprisePassage(passages, currentPassageId).passageId);
  }

  function beginJourney(journey: PublicLiteraryJourney) {
    const firstPassageId = journey.passageIds[0];
    if (!firstPassageId) return;
    setJourneyPoems({});
    choosePassage(firstPassageId, journey.journeyId);
  }

  function keepJourneyPoem(work: KeptPoemWork) {
    if (!activeJourney || activeJourneyIndex < 0) return;

    const keptPoems = { ...journeyPoems, [currentPassageId]: work };
    setJourneyPoems(keptPoems);
    const nextUnkeptId = activeJourney.passageIds.find(
      (passageId) => !keptPoems[passageId],
    );

    if (nextUnkeptId) {
      choosePassage(nextUnkeptId, activeJourney.journeyId);
      return;
    }

    setJourneyComplete(true);
    requestAnimationFrame(() => {
      const heading = document.getElementById('journey-complete-heading');
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)')
          .matches
          ? 'auto'
          : 'smooth',
        block: 'start',
      });
    });
  }

  const allOtherJourneyPagesKept =
    activeJourney?.passageIds.every(
      (passageId) =>
        passageId === currentPassageId || Boolean(journeyPoems[passageId]),
    ) ?? false;

  async function exportJourneySequence() {
    if (
      !activeJourney ||
      !journeySequenceExportRef.current ||
      isExportingJourney
    )
      return;

    setIsExportingJourney(true);
    setJourneyExportStatus('Preparing your complete sequence…');
    try {
      const blob = await renderElementToPng(journeySequenceExportRef.current);
      downloadPng(blob, pngFilename(`${activeJourney.title} sequence`));
      setJourneyExportStatus('Complete sequence downloaded to your device.');
    } catch {
      setJourneyExportStatus(
        "We couldn't create the complete sequence. Your poems are still here; please try again.",
      );
    } finally {
      setIsExportingJourney(false);
    }
  }

  return (
    <>
      <nav className="passage-discovery" aria-label="Passage shelf">
        <div>
          <p className="eyebrow">{passages.length} pages, carefully chosen</p>
          <p className="passage-discovery-introduction">
            Stay with this page, choose another, or let chance place one before
            you.
          </p>
        </div>
        <button className="surprise-action" onClick={surpriseMe} type="button">
          Surprise me
        </button>
        <details className="passage-chooser" ref={passageChooserRef}>
          <summary>Choose a page</summary>
          <ul>
            {passages.map((passage) => (
              <li key={passage.passageId}>
                <button
                  aria-pressed={passage.passageId === currentPassage.passageId}
                  onClick={() => choosePassage(passage.passageId)}
                  type="button"
                >
                  <span>
                    <cite>{passage.work.title}</cite>
                    <small>{passage.work.author.name}</small>
                  </span>
                  <span>
                    <small>{passage.passageLocation.chapter}</small>
                    <small>
                      {passage.curation.motifs.slice(0, 2).join(' · ')}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </details>
        <details className="journey-chooser" ref={journeyChooserRef}>
          <summary>Follow a literary path</summary>
          <ul>
            {journeys.map((journey) => (
              <li key={journey.journeyId}>
                <div className="journey-card">
                  <h3>{journey.title}</h3>
                  <p>{journey.invitation}</p>
                  <button onClick={() => beginJourney(journey)} type="button">
                    Begin this {journey.passageIds.length}-page path
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </details>
      </nav>

      {activeJourney && journeyComplete ? (
        <section
          className="journey-complete"
          aria-labelledby="journey-complete-heading"
        >
          <p className="eyebrow">Literary path complete</p>
          <h2 id="journey-complete-heading" tabIndex={-1}>
            Your <cite>{activeJourney.title}</cite> sequence
          </h2>
          <p>
            Five source pages, answered with five poems of your own. They remain
            private in this browser unless you choose to download them.
          </p>
          <ol>
            {activeJourney.passageIds.map((passageId, index) => {
              const passage = passages.find(
                (candidate) => candidate.passageId === passageId,
              );
              if (!passage) return null;
              return (
                <li key={passageId}>
                  <p className="eyebrow">Poem {index + 1}</p>
                  <h3>{journeyPoems[passageId]?.poem}</h3>
                  <p>
                    From <cite>{passage.work.title}</cite> by{' '}
                    {passage.work.author.name}
                  </p>
                  <button
                    onClick={() =>
                      choosePassage(passageId, activeJourney.journeyId)
                    }
                    type="button"
                  >
                    Return to this poem
                  </button>
                </li>
              );
            })}
          </ol>
          <div aria-hidden="true" className="journey-sequence-export-stage">
            <article
              className="journey-sequence-export"
              ref={journeySequenceExportRef}
            >
              <header>
                <p>Keep These · literary path</p>
                <h2>{activeJourney.title}</h2>
                <p>A sequence of five found poems</p>
              </header>
              <ol>
                {activeJourney.passageIds.map((passageId, index) => {
                  const passage = passages.find(
                    (candidate) => candidate.passageId === passageId,
                  );
                  const keptWork = journeyPoems[passageId];
                  if (!passage || !keptWork) return null;
                  const selected = new Set(keptWork.selectedIds);
                  return (
                    <li key={passageId}>
                      <p>Poem {index + 1}</p>
                      <article
                        className={`source-page source-page--blackout source-page--material-${keptWork.material} journey-sequence-page`}
                      >
                        {segmentPassages(passage.text).map(
                          (segments, paragraphIndex) => (
                            <p key={paragraphIndex}>
                              {segments.map((segment, segmentIndex) =>
                                segment.kind === 'text' ? (
                                  <span key={`text-${segmentIndex}`}>
                                    {segment.text}
                                  </span>
                                ) : (
                                  <span
                                    className={`source-word${selected.has(segment.id) ? ' source-word--kept' : ''}`}
                                    key={segment.id}
                                  >
                                    {segment.text}
                                  </span>
                                ),
                              )}
                            </p>
                          ),
                        )}
                        <footer className="source-credit">
                          <p>
                            <cite>{passage.work.title}</cite> by{' '}
                            {passage.work.author.name} (
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
                    </li>
                  );
                })}
              </ol>
              <footer>
                Made with Keep These · keepthese.com · source texts credited
                above
              </footer>
            </article>
          </div>
          <div className="journey-actions">
            <button
              className="journey-download-action"
              disabled={isExportingJourney}
              onClick={exportJourneySequence}
              type="button"
            >
              {isExportingJourney
                ? 'Preparing complete sequence…'
                : 'Download complete sequence'}
            </button>
            <button onClick={() => setActiveJourneyId(null)} type="button">
              Leave this path
            </button>
            <button
              onClick={() => {
                setActiveJourneyId(null);
                journeyChooserRef.current?.setAttribute('open', '');
                journeyChooserRef.current?.scrollIntoView({ block: 'start' });
              }}
              type="button"
            >
              Choose another path
            </button>
          </div>
          <p className="journey-export-status" aria-live="polite">
            {journeyExportStatus}
          </p>
        </section>
      ) : activeJourney && activeJourneyIndex >= 0 ? (
        <section className="active-journey" aria-labelledby="journey-heading">
          <div className="active-journey-heading">
            <div>
              <p className="eyebrow">
                Literary path · page {activeJourneyIndex + 1} of{' '}
                {activeJourney.passageIds.length}
              </p>
              <h2 id="journey-heading" tabIndex={-1}>
                {activeJourney.title}
              </h2>
            </div>
            <button onClick={() => setActiveJourneyId(null)} type="button">
              Leave this path
            </button>
          </div>
          <p>{activeJourney.invitation}</p>
          <ol aria-label={`${activeJourney.title} pages`}>
            {activeJourney.passageIds.map((passageId, index) => {
              const passage = passages.find(
                (candidate) => candidate.passageId === passageId,
              );
              if (!passage) return null;
              return (
                <li key={passageId}>
                  <button
                    aria-current={
                      index === activeJourneyIndex ? 'step' : undefined
                    }
                    onClick={() =>
                      choosePassage(passageId, activeJourney.journeyId)
                    }
                    type="button"
                  >
                    <span>{index + 1}</span>
                    <cite>{passage.work.title}</cite>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="journey-actions">
            <button
              disabled={activeJourneyIndex === 0}
              onClick={() => {
                const previousId =
                  activeJourney.passageIds[activeJourneyIndex - 1];
                if (previousId)
                  choosePassage(previousId, activeJourney.journeyId);
              }}
              type="button"
            >
              Previous page
            </button>
            <button
              disabled={
                activeJourneyIndex === activeJourney.passageIds.length - 1
              }
              onClick={() => {
                const nextId = activeJourney.passageIds[activeJourneyIndex + 1];
                if (nextId) choosePassage(nextId, activeJourney.journeyId);
              }}
              type="button"
            >
              Next page
            </button>
          </div>
        </section>
      ) : null}

      {journeyComplete ? null : (
        <BlackoutStudio
          journeyAction={
            activeJourney
              ? {
                  label: allOtherJourneyPagesKept
                    ? 'Complete this path'
                    : 'Keep this poem and continue',
                  onKeep: keepJourneyPoem,
                }
              : undefined
          }
          key={currentPassage.passageId}
          passage={currentPassage}
        />
      )}
    </>
  );
}

export default PassageDiscovery;
