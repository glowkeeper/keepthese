import { useRef, useState } from 'react';

import { chooseSurprisePassage } from '../lib/passage-discovery';
import type { Passage } from '../lib/passage-schema';
import BlackoutStudio from './BlackoutStudio';

interface PassageDiscoveryProps {
  passages: Passage[];
}

export function PassageDiscovery({ passages }: PassageDiscoveryProps) {
  const passageChooserRef = useRef<HTMLDetailsElement>(null);
  const [currentPassageId, setCurrentPassageId] = useState(
    passages[0]?.passageId ?? '',
  );
  const currentPassage = passages.find(
    ({ passageId }) => passageId === currentPassageId,
  );

  if (!currentPassage) {
    throw new Error('The passage shelf requires at least one passage.');
  }

  function choosePassage(passageId: string) {
    passageChooserRef.current?.removeAttribute('open');
    setCurrentPassageId(passageId);
    requestAnimationFrame(() => {
      const studioHeading = document.getElementById('studio-heading');
      const reduceMotion =
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
        false;

      studioHeading?.focus({ preventScroll: true });
      studioHeading?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  }

  function surpriseMe() {
    choosePassage(chooseSurprisePassage(passages, currentPassageId).passageId);
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
        <details ref={passageChooserRef}>
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
      </nav>

      <BlackoutStudio key={currentPassage.passageId} passage={currentPassage} />
    </>
  );
}

export default PassageDiscovery;
