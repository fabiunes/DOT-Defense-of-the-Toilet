// Anonymous play stats with GoatCounter (no cookies, no personal data): https://fabiunes.goatcounter.com
// Page views are counted by the script in index.html; game moments are sent as named events.
// GoatCounter ignores localhost, so development runs are not counted.

import type { BathroomId, Level } from '../engine/types';

declare global {
  interface Window {
    goatcounter?: { count?: (vars: { path: string; title?: string; event?: boolean }) => void };
  }
}

function track(path: string) {
  try {
    window.goatcounter?.count?.({ path, title: path, event: true });
  } catch {
    // Blocked or not loaded yet: the event is simply lost.
  }
}

/** Score bands of 1,000 points, e.g. "2000-2999". */
const scoreBand = (score: number) => {
  const low = Math.floor(score / 1000) * 1000;
  return `${low}-${low + 999}`;
};

export const analytics = {
  runStart: (level: Level, bathroom: BathroomId) => track(`run-start/L${level}/${bathroom}`),
  runEnd: (level: Level, bathroom: BathroomId, victory: boolean, wave: number, score: number) => {
    track(`run-end/L${level}/${bathroom}/${victory ? 'win' : 'lose'}`);
    if (!victory) track(`run-lost-at/wave-${wave}`);
    track(`run-score/${scoreBand(score)}`);
  },
  unlock: (bathroom: BathroomId) => track(`unlock/${bathroom}`),
  testingUnlock: () => track('testing-privilege'),
};
