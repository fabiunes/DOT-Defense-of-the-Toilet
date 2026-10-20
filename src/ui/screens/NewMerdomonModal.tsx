import { useState } from 'react';
import { ABILITY_INFO, STAT_KEYS } from '../../engine/data';
import { canAssignBonus, canConfirm, confirmMerdomon } from '../../engine/game';
import type { AbilityId, Merdomon, RunState, StatKey } from '../../engine/types';
import { MerdomonArt } from '../art';
import { AbilityBadge, KindLabel, Modal, Stars, StatValue, TraitList } from '../components';
import { Icon, STAT_ICON } from '../icons';
import type { Update } from '../update';

/** A new Merdomon: pick 1 of 3 abilities and the stat for its +1 point, then confirm. */
export function NewMerdomonModal({
  run,
  m,
  update,
  onCancel,
}: {
  run: RunState;
  m: Merdomon;
  update: Update;
  onCancel?: () => void;
}) {
  const [ability, setAbility] = useState<AbilityId | null>(null);
  const [stat, setStat] = useState<StatKey | null>(null);
  const ready = ability !== null && stat !== null && canConfirm(run, stat, ability);

  return (
    <Modal onClose={onCancel} className="bonus-modal">
      <div className="bonus-head">
        <MerdomonArt size={76} kind={m.kind} rarity={m.rarity} />
        <div className="bonus-meta">
          <Stars rarity={m.rarity} size={16} />
          <KindLabel m={m} />
          <TraitList traits={m.traits} size={20} />
        </div>
      </div>

      <div className="pick-label">Ability</div>
      <div className="ability-options">
        {run.pendingAbilities.map((a) => (
          <button key={a} className={`ability-option sk ${ability === a ? 'on' : ''}`} onClick={() => setAbility(a)}>
            <AbilityBadge ability={a} size={26} />
            <span>{ABILITY_INFO[a].name}</span>
          </button>
        ))}
      </div>
      <p className="ability-desc">{ability ? ABILITY_INFO[ability].desc : 'Tap an ability to read it'}</p>

      <div className="pick-label">+1</div>
      <div className="bonus-stats">
        {STAT_KEYS.map((k) => (
          <button
            key={k}
            className={`stat-btn sk ${stat === k ? 'on' : ''}`}
            disabled={!canAssignBonus(run, k)}
            onClick={() => setStat(k)}
          >
            <Icon name={STAT_ICON[k]} size={22} />
            <StatValue value={m.stats[k] + (stat === k ? 1 : 0)} />
          </button>
        ))}
      </div>

      <button
        className="big-btn shadow"
        disabled={!ready}
        onClick={() => ability && stat && update((s) => confirmMerdomon(s, stat, ability))}
      >
        <Icon name="check" size={22} /> Confirm
      </button>
    </Modal>
  );
}
