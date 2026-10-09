import { useEffect, useState } from 'react';

import { chooseDailyPassage } from '../lib/daily-passage';
import type { PublicPassage } from '../lib/public-passage';
import { passagePath } from '../lib/route-paths';

interface TodaysPageProps {
  passages: PublicPassage[];
}

/**
 * Links to the passage chosen for the current UTC day. The site is static, so
 * the day is only known in the browser; until then, and whenever no passage
 * can be chosen, nothing is shown. The slot keeps its height either way so the
 * page does not shift when the link appears.
 */
export function TodaysPage({ passages }: TodaysPageProps) {
  const [passage, setPassage] = useState<PublicPassage | null>(null);

  useEffect(() => {
    function choose() {
      setPassage(chooseDailyPassage(passages, new Date()));
    }
    choose();
    document.addEventListener('visibilitychange', choose);
    return () => document.removeEventListener('visibilitychange', choose);
  }, [passages]);

  return (
    <span className="todays-page-slot">
      {passage ? (
        <a
          className="surprise-action todays-page"
          href={passagePath(passage.passageId)}
        >
          Today’s page: <cite>{passage.work.title}</cite>
          <span className="visually-hidden">(chosen for today in UTC)</span>
        </a>
      ) : null}
    </span>
  );
}

export default TodaysPage;
