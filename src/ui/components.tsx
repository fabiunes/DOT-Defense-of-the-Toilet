import type { ReactNode } from 'react';
import {
  ABILITY_INFO,
  BOSS_INFO,
  KIND_NAME,
  ROUNDS,
  SIZE_NAME,
  STAT_KEYS,
  TRAITS,
  TRAIT_INFO,
  TRAIT_THRESHOLDS,
  TRAIT_VALUES,
} from '../engine/data';
import { activeTeam, apCap, concentrationCap, itemCap, mutedTrait, poopCap, tpCap, traitItems } from '../engine/game';
import { loadToiletPoints } from '../engine/save';
import { countTraits, traitTier } from '../engine/traits';
import type { AbilityId, BossId, Merdomon, Rarity, RunState, Stats, TraitId } from '../engine/types';
import { EnemyArt, MerdomonArt } from './art';
import { Icon, STAT_ICON, TraitIcon } from './icons';

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

/** Loot-style colour band for a stat value: 1–2, 3–4, 5–6, 7–8, 9+ → 1..5. */
export function statBand(v: number): number {
  return Math.min(5, Math.max(1, Math.ceil(v / 2)));
}

/** A stat number on its colour band. */
export function StatValue({ value, label }: { value: number; label?: string }) {
  return <b className={`sv band-${statBand(value)}`}>{label ?? value}</b>;
}

export function StatGrid({ stats, hp, compact = false }: { stats: Stats; hp?: number; compact?: boolean }) {
  return (
    <div className={`statgrid ${compact ? 'compact' : ''}`}>
      {STAT_KEYS.map((k) => (
        <span key={k} className="stat">
          <Icon name={STAT_ICON[k]} size={compact ? 14 : 18} />
          <StatValue value={stats[k]} label={k === 'hp' && hp !== undefined && !compact ? `${hp}/${stats.hp}` : undefined} />
        </span>
      ))}
    </div>
  );
}

/** An ability's icon in a small round badge. */
export function AbilityBadge({ ability, size = 16 }: { ability: AbilityId; size?: number }) {
  return (
    <span className="ability-badge" style={{ width: size, height: size, fontSize: size * 0.62 }} title={ABILITY_INFO[ability].name}>
      {ABILITY_INFO[ability].icon}
    </span>
  );
}

export function KindLabel({ m }: { m: Pick<Merdomon, 'rarity' | 'kind'> }) {
  return (
    <span className="kind-label">
      {SIZE_NAME[m.rarity]} · {KIND_NAME[m.kind]}
    </span>
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
      <span className="block-label">{KIND_NAME[m.kind]}</span>
      <div className="card-top">
        <span className="card-top-left">
          <Stars rarity={m.rarity} size={big ? 14 : 10} />
          {m.ability && <AbilityBadge ability={m.ability} size={big ? 20 : 16} />}
        </span>
        <TraitList traits={m.traits} size={big ? 18 : 13} />
      </div>
      <MerdomonArt size={big ? 72 : 44} kind={m.kind} rarity={m.rarity} sad={m.hp <= 1 && m.stats.hp > 1} />
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
        <small>/{tpCap(run)}</small>
      </div>
      <div className="conc" aria-label={`Concentration ${run.concentration} of ${concentrationCap(run)}`}>
        <Icon name="focus" size={18} fill="#fff" />
        <div className="conc-bar">
          {Array.from({ length: concentrationCap(run) }, (_, i) => (
            <span key={i} className={i < run.concentration ? 'on' : ''} />
          ))}
        </div>
      </div>
      <div className="res right" aria-label="Poop">
        <b>{run.merdascore}</b>
        <small>/{poopCap(run)}</small>
        <Icon name="poop" size={24} fill="#fff" />
      </div>
    </div>
  );
}

export function InfoRow({
  run,
  onItems,
  onBoss,
  onRound,
  onHelp,
}: {
  run: RunState;
  onItems: () => void;
  onBoss: () => void;
  onRound?: () => void;
  onHelp?: () => void;
}) {
  return (
    <div className="inforow">
      <button className="round-badge round-btn" onClick={onRound} disabled={!onRound} aria-label="Waves recap">
        Round {run.round}/{ROUNDS}
      </button>
      <button className="info-chip" onClick={onItems} aria-label="Items">
        <Icon name="shop" size={16} fill="#fff" />
        {run.items.length}/{itemCap(run)}
        {run.boss === 'robotVacuum' && <span title="Clean Sweep: items don't count for traits">🧹</span>}
      </button>
      <button className="info-chip boss-chip" onClick={onBoss} aria-label={BOSS_INFO[run.boss].name}>
        {BOSS_INFO[run.boss].icon}
      </button>
      <span className="round-badge ap-badge" aria-label={`${run.ap} action points`}>
        Actions
        {Array.from({ length: Math.max(run.ap, 1) }, (_, i) => (
          <Icon key={i} name="ap" size={12} fill={i < run.ap ? '#1b1b1b' : '#fff'} />
        ))}
        <small className="muted">/{apCap(run)}</small>
      </span>
      {onHelp && (
        <button className="info-chip help-chip" onClick={onHelp} aria-label="Help: the rules">
          <Icon name="question" size={16} fill="#fff" />
        </button>
      )}
    </div>
  );
}

/** The run's Boss: run-wide modifier and its two forms. */
export function BossCard({ boss }: { boss: BossId }) {
  const info = BOSS_INFO[boss];
  return (
    <div className="boss-card">
      <div className="boss-card-head">
        <EnemyArt size={84} kind={info.kind} rarity="epic" boss bossId={boss} />
        <div>
          <h2>{info.name}</h2>
          <span className="boss-run">
            <span className="mod-emoji">{info.icon}</span> {info.runDesc}
          </span>
        </div>
      </div>
      <div className="boss-forms">
        <div className="sk">
          <b>Wave 5</b>
          <small>
            {info.ability}: {info.midDesc}
          </small>
        </div>
        <div className="sk">
          <b>Wave 10</b>
          <small>
            {info.ability}: {info.finalDesc}
          </small>
        </div>
      </div>
    </div>
  );
}

export function TraitsRow({ run, onTrait }: { run: RunState; onTrait: (t: TraitId) => void }) {
  // Benched Merdomon (locked slots) don't count; the Group Admin mutes the most common trait.
  const counts = countTraits(activeTeam(run), traitItems(run));
  const muted = mutedTrait(run);
  const active = TRAITS.filter((t) => counts[t] > 0);
  return (
    <div className="traitsrow">
      {active.map((t) => {
        const tier = traitTier(counts[t]);
        return (
          <button key={t} className={`trait-chip ${tier > 0 && t !== muted ? 'on' : ''} ${t === muted ? 'muted' : ''}`} onClick={() => onTrait(t)}>
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
        <MerdomonArt size={80} kind={m.kind} rarity={m.rarity} />
        <div>
          <span className="detail-meta">
            <Stars rarity={m.rarity} size={16} />
            <KindLabel m={m} />
          </span>
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
      {m.ability ? (
        <div className="ability-line">
          <AbilityBadge ability={m.ability} size={26} />
          <span>
            <b>{ABILITY_INFO[m.ability].name}</b>
            <small>{ABILITY_INFO[m.ability].desc}</small>
          </span>
        </div>
      ) : (
        <p className="muted ability">
          <Icon name="question" size={14} /> Ability chosen when it joins
        </p>
      )}
      {children}
    </div>
  );
}

/** Toilet Points balance (earned with the final score of every run; no use for now). */
export function ToiletPoints() {
  return (
    <span className="toilet-points" aria-label="Toilet Points">
      <Icon name="toilet" size={18} fill="#f2c94c" />
      <b>{loadToiletPoints().toLocaleString('en')}</b>
    </span>
  );
}

/** Re-Roll: free ones (Toilet Brush) are used before paying Toilet Paper. */
export function RerollButton({ enabled, onClick, free, cost }: { enabled: boolean; onClick: () => void; free: number; cost: number }) {
  return (
    <button className="big-btn reroll-btn" disabled={!enabled} onClick={onClick}>
      <Icon name="dice" size={22} fill="#fff" /> Re-Roll
      {free > 0 ? <span className="cost free">free ×{free}</span> : <CostBadge tp={cost} />}
    </button>
  );
}
