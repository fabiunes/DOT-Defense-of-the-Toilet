import { beginRun } from '../../engine/game';
import type { RunState } from '../../engine/types';
import { BossCard } from '../components';
import { Icon } from '../icons';
import type { Update } from '../update';

/** First screen of a run: who you will face on waves 5 and 10, and how it changes the run. */
export function BossRevealScreen({ run, update }: { run: RunState; update: Update }) {
  return (
    <div className="screen boss-reveal">
      <h2 className="screen-title">Your nemesis</h2>
      <div className="boss-reveal-card sk shadow">
        <BossCard boss={run.boss} />
      </div>
      <p className="muted center">It shows up on wave 5, and again — stronger — on wave 10.</p>
      <button className="big-btn shadow" onClick={() => update(beginRun)}>
        <Icon name="play" size={22} fill="#1b1b1b" /> Start
      </button>
    </div>
  );
}
