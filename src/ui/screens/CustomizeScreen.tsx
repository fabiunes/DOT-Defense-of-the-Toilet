import { BATHROOM_ACTIONS, BATHROOM_ACTION_POOP, ENDLESS, STRUCTURES, STRUCTURE_INFO } from '../../engine/data';
import * as G from '../../engine/game';
import type { BathroomActionId, RunState } from '../../engine/types';
import { StructureBadges, StructureIcon, TierBadge } from '../bathroom';
import { HomeButton } from '../components';
import { Icon } from '../icons';
import type { Update } from '../update';

const ACTIONS: readonly BathroomActionId[] = ['office', 'public', 'home'];

/** Endless: place up to 3 free tiers on the Custom Toilet (stacking is fine) and pick its bathroom action. */
export function CustomizeScreen({ run, update, onHome }: { run: RunState; update: Update; onHome: () => void }) {
  return (
    <div className="screen customize">
      <div className="setup-head">
        <h2>Customize Toilet</h2>
        <HomeButton onClick={onHome} />
      </div>
      <p className="tut-note">
        Place <b>{run.customPoints}</b> of {ENDLESS.customTiers} free tiers left. You can stack them on the same structure.
      </p>
      <div className="custom-structures">
        {STRUCTURES.map((id) => (
          <div key={id} className={`custom-row sk ${run.structures[id] === 0 ? 't0' : ''}`}>
            <StructureIcon id={id} tier={Math.max(1, run.structures[id])} size={34} />
            <span className="custom-name">
              <b>{STRUCTURE_INFO[id].name}</b>
              <StructureBadges run={run} id={id} />
            </span>
            <TierBadge tier={run.structures[id]} />
            <button
              className="icon-btn sk"
              disabled={run.structures[id] === 0}
              onClick={() => update((s) => G.customUnbuild(s, id))}
              aria-label={`Remove a tier from ${STRUCTURE_INFO[id].name}`}
            >
              −
            </button>
            <button
              className="icon-btn sk"
              disabled={!G.canCustomBuild(run, id)}
              onClick={() => update((s) => G.customBuild(s, id))}
              aria-label={`Add a tier to ${STRUCTURE_INFO[id].name}`}
            >
              +
            </button>
          </div>
        ))}
      </div>
      <div className="carousel-label">Bathroom action ({BATHROOM_ACTION_POOP} Poop, once per round)</div>
      <div className="custom-actions">
        {ACTIONS.map((a) => (
          <button
            key={a}
            className={`custom-action sk ${run.customAction === a ? 'on' : ''}`}
            onClick={() => update((s) => G.setCustomAction(s, a))}
          >
            <span className="tile-emoji">{BATHROOM_ACTIONS[a].icon}</span>
            <b>{BATHROOM_ACTIONS[a].name}</b>
          </button>
        ))}
      </div>
      <p className="ability-desc">
        {run.customAction ? BATHROOM_ACTIONS[run.customAction].desc : 'Tap an action to read it'}
      </p>
      <button className="big-btn shadow" disabled={!G.canFinishCustomize(run)} onClick={() => update(G.finishCustomize)}>
        <Icon name="check" size={22} /> Confirm
      </button>
    </div>
  );
}
