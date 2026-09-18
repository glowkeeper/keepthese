import type { MouseEvent } from 'react';

import { chooseSurprisePassage } from '../lib/passage-discovery';
import type { PublicLiteraryJourney } from '../lib/literary-journey';
import type { PublicPassage } from '../lib/public-passage';
import { journeyPath, passagePath } from '../lib/route-paths';

interface ExplorePageProps {
  journeys: PublicLiteraryJourney[];
  passages: PublicPassage[];
}

export function ExplorePage({ journeys, passages }: ExplorePageProps) {
  const fallback = passages[0];
  if (!fallback) throw new Error('Explore requires at least one passage.');

  function chooseForMe(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }
    event.preventDefault();
    const passage = chooseSurprisePassage(passages, '');
    window.location.assign(passagePath(passage.passageId));
  }

  return (
    <div className="explore-page">
      <section aria-labelledby="explore-pages-heading">
        <div className="explore-section-heading">
          <div>
            <p className="eyebrow">The passage shelf</p>
            <h2 id="explore-pages-heading">Choose a page</h2>
          </div>
          <a
            className="surprise-action"
            href={passagePath(fallback.passageId)}
            onClick={chooseForMe}
          >
            Choose for me
          </a>
        </div>
        <p className="explore-section-introduction">
          Choose any page on the shelf, or let chance choose for you.
        </p>
        <ul className="explore-passage-list">
          {passages.map((passage) => (
            <li key={passage.passageId}>
              <a href={passagePath(passage.passageId)}>
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
      </section>

      <section aria-labelledby="explore-journeys-heading">
        <p className="eyebrow">Five pages, one path</p>
        <h2 id="explore-journeys-heading">Follow a literary path</h2>
        <p className="explore-section-introduction">
          Take five pages in sequence and notice what changes from one to the
          next.
        </p>
        <ul className="explore-journey-list">
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
      </section>
    </div>
  );
}

export default ExplorePage;
