import { useEffect, useState } from 'react';

import {
  chooseDailyPassage,
  millisecondsUntilNextUtcDay,
} from '../lib/daily-passage';
import type { PublicPassage } from '../lib/public-passage';
import { passagePath } from '../lib/route-paths';

interface TodaysPageProps {
  passages: PublicPassage[];
}

/**
 * Links to the passage chosen for the current UTC day. The site is static, so
 * the day is only known in the browser, so it is worked out on load, again at
 * 00:00 UTC, and whenever the tab becomes visible. Until then, and whenever no
 * passage can be chosen, nothing is shown. The slot keeps its height either way so the
 * page does not shift when the link appears.
 */
export function TodaysPage({ passages }: TodaysPageProps) {
  const [passage, setPassage] = useState<PublicPassage | null>(null);

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout> | undefined;

    // Refresh at the next 00:00 UTC for a page that stays open and visible, and
    // whenever the tab returns, since background timers can be delayed.
    function choose() {
      const now = new Date();
      setPassage(chooseDailyPassage(passages, now));
      clearTimeout(midnightTimer);
      const untilMidnight = millisecondsUntilNextUtcDay(now);
      if (untilMidnight !== null) {
        midnightTimer = setTimeout(choose, untilMidnight);
      }
    }
    choose();
    document.addEventListener('visibilitychange', choose);
    return () => {
      clearTimeout(midnightTimer);
      document.removeEventListener('visibilitychange', choose);
    };
  }, [passages]);

  return (
    <span className="todays-page-slot">
      {passage ? (
        <a
          className="surprise-action todays-page"
          href={passagePath(passage.passageId)}
        >
          <span className="todays-page-text">
            Today’s page: <cite>{passage.work.title}</cite>
          </span>
          <span className="visually-hidden">(chosen for today in UTC)</span>
        </a>
      ) : null}
    </span>
  );
}

export default TodaysPage;
