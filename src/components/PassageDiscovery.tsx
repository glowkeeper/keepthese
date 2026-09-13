import { useEffect, useRef, useState } from 'react';

import { chooseSurprisePassage } from '../lib/passage-discovery';
import type { PublicLiteraryJourney } from '../lib/literary-journey';
import {
  canSharePng,
  downloadPng,
  pngFilename,
  renderElementToPng,
  sharePng,
} from '../lib/png-export';
import type { PublicPassage } from '../lib/public-passage';
import { decodePoemFragment } from '../lib/stateless-poem-link';
import { segmentPassages } from '../lib/studio-state';
import { journeyPath, passagePath } from '../lib/route-paths';
import BlackoutStudio, { type KeptPoemWork } from './BlackoutStudio';

interface PassageDiscoveryProps {
  initialJourneyId?: string;
  initialPassageId?: string;
  journeys: PublicLiteraryJourney[];
  passages: PublicPassage[];
}

export function PassageDiscovery({
  initialJourneyId,
  initialPassageId,
  journeys,
  passages,
}: PassageDiscoveryProps) {
  const journeyChooserRef = useRef<HTMLDetailsElement>(null);
  const journeySequenceExportRef = useRef<HTMLElement>(null);
  const journeyShareInFlight = useRef(false);
  const passageChooserRef = useRef<HTMLDetailsElement>(null);
  const [receivedPoem, setReceivedPoem] = useState<{
    fragment: string;
    passageId: string;
    work: KeptPoemWork;
  } | null>(null);
  const [poemLinkNotice, setPoemLinkNotice] = useState('');
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(
    initialJourneyId ?? null,
  );
  const [journeyComplete, setJourneyComplete] = useState(false);
  const [journeyPoems, setJourneyPoems] = useState<
    Record<string, KeptPoemWork>
  >({});
  const [isExportingJourney, setIsExportingJourney] = useState(false);
  const [isSharingJourney, setIsSharingJourney] = useState(false);
  const [canShareJourney, setCanShareJourney] = useState(false);
  const [preparedJourneyShare, setPreparedJourneyShare] = useState<{
    blob: Blob;
    key: string;
  } | null>(null);
  const [journeyExportStatus, setJourneyExportStatus] = useState(
    'The complete sequence is created here and stays on this device.',
  );
  const [currentPassageId, setCurrentPassageId] = useState(
    initialPassageId ?? passages[0]?.passageId ?? '',
  );
  const currentPassage = passages.find(
    ({ passageId }) => passageId === currentPassageId,
  );
  const activeJourney = journeys.find(
    ({ journeyId }) => journeyId === activeJourneyId,
  );
  const activeJourneyIndex =
    activeJourney?.passageIds.indexOf(currentPassageId) ?? -1;
  const journeyShareKey =
    activeJourney && journeyComplete
      ? `${activeJourney.journeyId}:${activeJourney.passageIds
          .map((passageId) => {
            const work = journeyPoems[passageId];
            return `${passageId}:${work?.material}:${work?.selectedIds.join(',')}`;
          })
          .join('|')}`
      : '';
  const journeyShareReady = preparedJourneyShare?.key === journeyShareKey;

  useEffect(() => {
    queueMicrotask(() => setCanShareJourney(canSharePng()));
  }, []);

  useEffect(() => {
    function openPoemFromFragment() {
      const decoded = decodePoemFragment(window.location.hash);
      if (decoded.kind === 'none') {
        setReceivedPoem(null);
        setPoemLinkNotice('');
        return;
      }
      if (decoded.kind === 'invalid') {
        setReceivedPoem(null);
        setPoemLinkNotice(
          'This poem link is damaged or uses a version Keep These does not support.',
        );
        return;
      }

      const passage = passages.find(
        ({ passageId }) => passageId === decoded.value.passageId,
      );
      const validWordIds = new Set(
        segmentPassages(passage?.text ?? []).flatMap((segments) =>
          segments.flatMap((segment) =>
            segment.kind === 'word' ? [segment.id] : [],
          ),
        ),
      );
      if (
        !passage ||
        passage.textVersion !== decoded.value.textVersion ||
        !decoded.value.selectedIds.every((id) => validWordIds.has(id))
      ) {
        setReceivedPoem(null);
        setPoemLinkNotice(
          'This poem link refers to a page version that is not available here.',
        );
        return;
      }

      const selected = new Set(decoded.value.selectedIds);
      const poem = segmentPassages(passage.text)
        .flatMap((segments) => segments)
        .filter(
          (segment) => segment.kind === 'word' && selected.has(segment.id),
        )
        .map((segment) => segment.text)
        .join(' ');
      setActiveJourneyId(null);
      setJourneyComplete(false);
      setJourneyPoems({});
      setCurrentPassageId(passage.passageId);
      setReceivedPoem({
        fragment: window.location.hash,
        passageId: passage.passageId,
        work: {
          blackout: decoded.value.blackout,
          material: decoded.value.material,
          poem,
          selectedIds: decoded.value.selectedIds,
        },
      });
      setPoemLinkNotice('');
      requestAnimationFrame(() => {
        const heading = document.getElementById('received-poem-heading');
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

    openPoemFromFragment();
    window.addEventListener('hashchange', openPoemFromFragment);
    return () => window.removeEventListener('hashchange', openPoemFromFragment);
  }, [passages]);

  useEffect(() => {
    if (
      !canShareJourney ||
      !journeyComplete ||
      !journeyShareKey ||
      !journeySequenceExportRef.current
    )
      return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      const exportSurface = journeySequenceExportRef.current;
      if (!exportSurface) return;
      void renderElementToPng(exportSurface)
        .then((blob) => {
          if (!cancelled)
            setPreparedJourneyShare({ blob, key: journeyShareKey });
        })
        .catch(() => {
          // Download remains available if background share preparation fails.
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [canShareJourney, journeyComplete, journeyShareKey]);

  if (!currentPassage) {
    throw new Error('The passage shelf requires at least one passage.');
  }

  function choosePassage(passageId: string, journeyId: string | null = null) {
    leaveReceivedPoem();
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

  function leaveReceivedPoem() {
    setReceivedPoem(null);
    setPoemLinkNotice('');
    if (window.location.hash.startsWith('#poem=')) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`,
      );
    }
  }

  function surpriseMe() {
    const next = chooseSurprisePassage(passages, currentPassageId);
    window.location.assign(passagePath(next.passageId));
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
      isExportingJourney ||
      isSharingJourney
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

  async function shareJourneySequence() {
    const prepared = preparedJourneyShare;
    if (
      !activeJourney ||
      !prepared ||
      prepared.key !== journeyShareKey ||
      isExportingJourney ||
      isSharingJourney
    )
      return;
    if (journeyShareInFlight.current) return;
    journeyShareInFlight.current = true;

    setIsSharingJourney(true);
    setJourneyExportStatus('Opening your device’s share controls…');
    try {
      const filename = pngFilename(`${activeJourney.title} sequence`);
      const result = await sharePng(prepared.blob, filename);
      if (result === 'shared') {
        setJourneyExportStatus(
          'Complete sequence passed to your device’s share controls.',
        );
      } else if (result === 'cancelled') {
        setJourneyExportStatus(
          'Sharing cancelled. Your complete sequence is still here.',
        );
      } else {
        setCanShareJourney(false);
        setJourneyExportStatus(
          'This browser cannot share PNG files directly. Download remains available.',
        );
      }
    } catch {
      setJourneyExportStatus(
        "We couldn't open your device’s share controls. Your sequence is still here; download remains available.",
      );
    } finally {
      journeyShareInFlight.current = false;
      setIsSharingJourney(false);
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
                <a
                  aria-current={
                    passage.passageId === currentPassage.passageId
                      ? 'page'
                      : undefined
                  }
                  href={passagePath(passage.passageId)}
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
                </a>
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
                  <a href={journeyPath(journey.journeyId)}>
                    Begin this {journey.passageIds.length}-page path
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </details>
      </nav>

      {poemLinkNotice ? (
        <p className="poem-link-notice" role="status">
          {poemLinkNotice}
        </p>
      ) : null}

      {receivedPoem ? (
        <section
          className="received-poem"
          aria-labelledby="received-poem-heading"
        >
          <div>
            <p className="eyebrow">A poem shared with you</p>
            <h2 id="received-poem-heading" tabIndex={-1}>
              Someone found these words in{' '}
              <cite>{currentPassage.work.title}</cite>
            </h2>
            <p>
              Explore their reading here, with its author and source attached.
              Your own saved work for this page remains untouched.
            </p>
          </div>
          <button
            onClick={() => {
              leaveReceivedPoem();
              requestAnimationFrame(() =>
                document.getElementById('studio-heading')?.focus(),
              );
            }}
            type="button"
          >
            Make your own from this page
          </button>
        </section>
      ) : null}

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
            {activeJourney.passageIds.length} source pages, answered with{' '}
            {activeJourney.passageIds.length} poems of your own. They remain
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
                <p>
                  A sequence of {activeJourney.passageIds.length} found poems
                </p>
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
                          <a href={passage.source.recordUrl} tabIndex={-1}>
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
              disabled={isExportingJourney || isSharingJourney}
              onClick={exportJourneySequence}
              type="button"
            >
              {isExportingJourney
                ? 'Preparing complete sequence…'
                : 'Download complete sequence'}
            </button>
            {canShareJourney ? (
              <button
                className="journey-share-action"
                disabled={
                  !journeyShareReady || isExportingJourney || isSharingJourney
                }
                onClick={shareJourneySequence}
                type="button"
              >
                {isSharingJourney
                  ? 'Sharing…'
                  : journeyShareReady
                    ? 'Share complete sequence'
                    : 'Preparing sequence to share…'}
              </button>
            ) : null}
            <a href={passagePath(currentPassage.passageId)}>Leave this path</a>
            <a href="/">Choose another path</a>
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
            <a href={passagePath(currentPassage.passageId)}>Leave this path</a>
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
          key={`${currentPassage.passageId}:${receivedPoem?.fragment ?? 'private'}`}
          passage={currentPassage}
          preservePrivateWork={Boolean(receivedPoem)}
          sessionWork={
            receivedPoem?.passageId === currentPassage.passageId
              ? receivedPoem.work
              : activeJourney
                ? journeyPoems[currentPassage.passageId]
                : undefined
          }
        />
      )}
    </>
  );
}

export default PassageDiscovery;
