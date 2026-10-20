import { ITEM_INFO, START_PACK } from '../../engine/data';
import { chooseStartBonus } from '../../engine/game';
import type { RunState } from '../../engine/types';
import { PlayerArt } from '../art';
import { MerdomonCard } from '../components';
import { Icon, ItemIcon, TraitIcon } from '../icons';
import type { Update } from '../update';
import { NewMerdomonModal } from './NewMerdomonModal';

/** Pick one starting bonus: a random item, a random Small Merdomon or a resources pack. */
export function StartBonusScreen({ run, update }: { run: RunState; update: Update }) {
  const options = run.startOptions;
  return (
    <div className="screen start-bonus">
      <h2 className="screen-title">Pick a starting bonus</h2>
      {options && (
        <div className="start-options">
          <button className="start-option sk shadow" onClick={() => update((s) => chooseStartBonus(s, 'item'))}>
            <span className="start-option-head">
              <ItemIcon item={options.item} size={34} />
              <b>{ITEM_INFO[options.item].name}</b>
              {ITEM_INFO[options.item].traits.map((t) => (
                <TraitIcon key={t} trait={t} size={18} />
              ))}
            </span>
            <small>{ITEM_INFO[options.item].desc}</small>
          </button>

          <div
            className="start-option merdomon sk shadow"
            role="button"
            onClick={() => update((s) => chooseStartBonus(s, 'merdomon'))}
          >
            <MerdomonCard m={options.merdomon} />
            <span className="start-option-text">
              <b>An extra Merdomon</b>
              <small>Choose its ability and +1 next</small>
            </span>
          </div>

          <button className="start-option sk shadow" onClick={() => update((s) => chooseStartBonus(s, 'resources'))}>
            <span className="start-option-head">
              <Icon name="shop" size={30} fill="#fff" />
              <b>Supplies</b>
            </span>
            <span className="start-pack">
              <span>
                +{START_PACK.tp} <Icon name="tp" size={18} fill="#fff" />
              </span>
              <span>
                +{START_PACK.merdascore} <Icon name="poop" size={18} fill="#fff" />
              </span>
              <span>
                +{START_PACK.ap} <Icon name="ap" size={16} fill="#1b1b1b" />
                <small>round 1</small>
              </span>
            </span>
          </button>
        </div>
      )}
      <div className="home-art">
        <PlayerArt />
      </div>
      {run.pending && <NewMerdomonModal key={run.pending.id} run={run} m={run.pending} update={update} />}
    </div>
  );
}
