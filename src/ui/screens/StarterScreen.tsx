import { cancelPending, chooseStarter } from '../../engine/game';
import type { RunState } from '../../engine/types';
import { PlayerArt } from '../art';
import { MerdomonCard } from '../components';
import type { Update } from '../update';
import { BonusPointModal } from './BonusPointModal';

export function StarterScreen({ run, update }: { run: RunState; update: Update }) {
  return (
    <div className="screen starter">
      <h2 className="screen-title">Pick your Merdomon</h2>
      <div className="starter-cards">
        {run.starters.map((m, i) => (
          <MerdomonCard key={m.id} m={m} big onClick={() => update((s) => chooseStarter(s, i))} />
        ))}
      </div>
      <div className="home-art">
        <PlayerArt />
      </div>
      {run.pending && <BonusPointModal run={run} m={run.pending} update={update} onCancel={() => update(cancelPending)} />}
    </div>
  );
}
