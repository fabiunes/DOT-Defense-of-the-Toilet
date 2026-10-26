import { cancelPending, chooseStarter } from '../../engine/game';
import type { RunState } from '../../engine/types';
import { PlayerArt } from '../art';
import { HomeButton, MerdomonCard } from '../components';
import type { Update } from '../update';
import { NewMerdomonModal } from './NewMerdomonModal';

export function StarterScreen({ run, update, onHome }: { run: RunState; update: Update; onHome: () => void }) {
  return (
    <div className="screen starter">
      <div className="floating-home">
        <HomeButton onClick={onHome} />
      </div>
      <h2 className="screen-title">Pick your Merdomon</h2>
      <div className="starter-cards">
        {run.starters.map((m, i) => (
          <MerdomonCard key={m.id} m={m} big onClick={() => update((s) => chooseStarter(s, i))} />
        ))}
      </div>
      <div className="home-art">
        <PlayerArt />
      </div>
      {run.pending && (
        <NewMerdomonModal key={run.pending.id} run={run} m={run.pending} update={update} onCancel={() => update(cancelPending)} />
      )}
    </div>
  );
}
