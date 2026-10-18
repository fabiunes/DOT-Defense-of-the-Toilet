import { STAT_KEYS } from '../../engine/data';
import { assignBonusPoint, canAssignBonus } from '../../engine/game';
import type { Merdomon, RunState } from '../../engine/types';
import { MerdomonArt } from '../art';
import { Modal, Stars, TraitList } from '../components';
import { Icon, STAT_ICON } from '../icons';
import type { Update } from '../update';

/** Shown whenever a new Merdomon is waiting for its +1 point. */
export function BonusPointModal({ run, m, update, onCancel }: { run: RunState; m: Merdomon; update: Update; onCancel?: () => void }) {
  return (
    <Modal onClose={onCancel} className="bonus-modal">
      <div className="bonus-head">
        <MerdomonArt size={84} />
        <div className="bonus-meta">
          <Stars rarity={m.rarity} size={16} />
          <TraitList traits={m.traits} size={20} />
        </div>
      </div>
      <div className="bonus-title">
        <span className="plus-one">+1</span>
      </div>
      <div className="bonus-stats">
        {STAT_KEYS.map((k) => (
          <button
            key={k}
            className="stat-btn sk"
            disabled={!canAssignBonus(run, k)}
            onClick={() => update((s) => assignBonusPoint(s, k))}
          >
            <Icon name={STAT_ICON[k]} size={24} />
            <b>{m.stats[k]}</b>
            <span className="arrow">→</span>
            <b>{m.stats[k] + 1}</b>
          </button>
        ))}
      </div>
    </Modal>
  );
}
