import type { ReactNode } from 'react';
import { MAX_CONCENTRATION, MAX_MERDASCORE, ROUNDS, STAT_KEYS, TRAITS, TRAIT_INFO, TRAIT_THRESHOLDS, TRAIT_VALUES } from '../engine/data';
import { countTraits, traitTier } from '../engine/traits';
import type { ItemId, Merdomon, Rarity, RunState, Stats, TraitId } from '../engine/types';
import { MerdomonArt } from './art';
import { Icon, ItemIcon, STAT_ICON, TraitIcon } from './icons';

export function Modal({ children, onClose, className = '' }: { children: ReactNode; onClose?: () => void; className?: string }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className={`modal sk ${className}`} onClick={(e) => e.stopPropagation()}>
        {onClose && (
          <button className="modal-close icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function Stars({ rarity, size = 12 }: { rarity: Rarity; size?: number }) {
  const n = rarity === 'common' ? 1 : rarity === 'rare' ? 2 : 3;
  return (
    <span className={`stars ${rarity}`}>
      {Array.from({ length: n }, (_, i) => (
        <Icon key={i} name="star" size={size} fill={rarity === 'epic' ? '#1b1b1b' : '#fff'} />
      ))}
    </span>
  );
}

export function HpBar({ hp, max }: { hp: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (hp / Math.max(1, max)) * 100));
  return (
    <div className="hpbar">
      <div className="hpbar-fill" style={{ width: `${pct}%` }} />
      <span className="hpbar-text">
        {hp}/{max}
      </span>
    </div>
  );
}

export function StatGrid({ stats, hp, compact = false }: { stats: Stats; hp?: number; compact?: boolean }) {
  return (
    <div className={`statgrid ${compact ? 'compact' : ''}`}>
      {STAT_KEYS.map((k) => (
        <span key={k} className="stat">
          <Icon name={STAT_ICON[k]} size={compact ? 14 : 18} />
          <b>{k === 'hp' && hp !== undefined && !compact ? `${hp}/${stats.hp}` : stats[k]}</b>
        </span>
      ))}
    </div>
  );
}

export function TraitList({ traits, size = 14 }: { traits: TraitId[]; size?: number }) {
  return (
    <span className="traitlist">
      {traits.map((t, i) => (
        <TraitIcon key={i} trait={t} size={size} />
      ))}
    </span>
  );
}

export function MerdomonCard({
  m,
  onClick,
  selected = false,
  dim = false,
  big = false,
}: {
  m: Merdomon;
  onClick?: () => void;
  selected?: boolean;
  dim?: boolean;
  big?: boolean;
}) {
  return (
    <button className={`card sk ${selected ? 'selected' : ''} ${dim ? 'dim' : ''} ${big ? 'big' : ''}`} onClick={onClick}>
      <div className="card-top">
        <Stars rarity={m.rarity} size={big ? 14 : 10} />
        <TraitList traits={m.traits} size={big ? 18 : 13} />
      </div>
      <MerdomonArt size={big ? 72 : 40} sad={m.hp <= 1 && m.stats.hp > 1} />
      <HpBar hp={m.hp} max={m.stats.hp} />
      <StatGrid stats={m.stats} compact />
    </button>
  );
}

export function EmptySlot({ index, onClick }: { index: number; onClick?: () => void }) {
  return (
    <button className="card empty" onClick={onClick} disabled={!onClick} aria-label={`Empty slot ${index + 1}`}>
      <span>{index + 1}</span>
    </button>
  );
}

export function CostBadge({ ap, tp, ms, conc }: { ap?: number; tp?: number; ms?: string; conc?: number }) {
  return (
    <span className="costs">
      {ap !== undefined && (
        <span className="cost ap">
          <Icon name="ap" size={12} fill="#1b1b1b" />
          {ap}
        </span>
      )}
      {tp !== undefined && (
        <span className="cost">
          <Icon name="tp" size={12} fill="#fff" />
          {tp}
        </span>
      )}
      {ms !== undefined && (
        <span className="cost">
          <Icon name="poop" size={12} fill="#fff" />
          {ms}
        </span>
      )}
      {conc !== undefined && (
        <span className="cost">
          <Icon name="focus" size={12} fill="#fff" />
          {conc}
        </span>
      )}
    </span>
  );
}

export function TopBar({ run }: { run: RunState }) {
  return (
    <div className="topbar">
      <div className="res" aria-label="Toilet Paper">
        <Icon name="tp" size={24} fill="#fff" />
        <b>{run.tp}</b>
      </div>
      <div className="conc" aria-label={`Concentration ${run.concentration} of ${MAX_CONCENTRATION}`}>
        <Icon name="focus" size={18} fill="#fff" />
        <div className="conc-bar">
          {Array.from({ length: MAX_CONCENTRATION }, (_, i) => (
            <span key={i} className={i < run.concentration ? 'on' : ''} />
          ))}
        </div>
      </div>
      <div className="res right" aria-label="Merdascore">
        <b>{run.merdascore}</b>
        <small>/{MAX_MERDASCORE}</small>
        <Icon name="poop" size={24} fill="#fff" />
      </div>
    </div>
  );
}

export function InfoRow({ run, onItem }: { run: RunState; onItem: (item: ItemId) => void }) {
  return (
    <div className="inforow">
      <span className="round-badge">
        Round {run.round}/{ROUNDS}
      </span>
      <span className="ap-pips" aria-label={`${run.ap} action points`}>
        {Array.from({ length: Math.max(run.ap, 1) }, (_, i) => (
          <Icon key={i} name="ap" size={16} fill={i < run.ap ? '#1b1b1b' : '#fff'} />
        ))}
      </span>
      <span className="items">
        {run.items.map((it) => (
          <button key={it} className="icon-btn item-btn" onClick={() => onItem(it)} aria-label={it}>
            <ItemIcon item={it} size={20} />
          </button>
        ))}
      </span>
    </div>
  );
}

export function TraitsRow({ run, onTrait }: { run: RunState; onTrait: (t: TraitId) => void }) {
  const counts = countTraits(run.team, run.items);
  const active = TRAITS.filter((t) => counts[t] > 0);
  return (
    <div className="traitsrow">
      {active.map((t) => {
        const tier = traitTier(counts[t]);
        return (
          <button key={t} className={`trait-chip ${tier > 0 ? 'on' : ''}`} onClick={() => onTrait(t)}>
            <TraitIcon trait={t} size={16} />
            <b>{counts[t]}</b>
          </button>
        );
      })}
    </div>
  );
}

export function TraitDetail({ trait, count }: { trait: TraitId; count: number }) {
  const tier = traitTier(count);
  return (
    <div className="detail">
      <div className="detail-title">
        <TraitIcon trait={trait} size={32} />
        <h2>{TRAIT_INFO[trait].name}</h2>
      </div>
      <p className="muted">{TRAIT_INFO[trait].desc}</p>
      <div className="tiers">
        {TRAIT_THRESHOLDS.map((th, i) => (
          <div key={th} className={`tier ${tier === i + 1 ? 'on' : ''} ${count >= th ? 'reached' : ''}`}>
            <span>{th}</span>
            <b>+{TRAIT_VALUES[trait][i]}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MerdomonDetail({ m, children }: { m: Merdomon; children?: ReactNode }) {
  return (
    <div className="detail">
      <div className="detail-title">
        <MerdomonArt size={80} />
        <div>
          <Stars rarity={m.rarity} size={16} />
          <HpBar hp={m.hp} max={m.stats.hp} />
        </div>
      </div>
      <StatGrid stats={m.stats} hp={m.hp} />
      <div className="detail-traits">
        {m.traits.map((t, i) => (
          <span key={i} className="trait-pill">
            <TraitIcon trait={t} size={16} /> {TRAIT_INFO[t].name}
          </span>
        ))}
      </div>
      <p className="muted ability">
        <Icon name="question" size={14} /> Generic Ability
      </p>
      {children}
    </div>
  );
}
