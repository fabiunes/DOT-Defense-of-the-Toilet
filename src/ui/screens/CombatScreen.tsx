import { useEffect, useMemo, useState } from 'react';
import { ABILITY_INFO, ITEM_INFO, MODIFIER_INFO, ROUNDS, STAT_KEYS, TRAIT_INFO } from '../../engine/data';
import type {
  AbilityId,
  CombatBonus,
  CombatEvent,
  CombatReport,
  EnemyKind,
  Fighter,
  MerdomonKind,
  ModifierId,
  RewardSource,
  Side,
  StatKey,
} from '../../engine/types';
import { EnemyArt, MerdomonArt } from '../art';
import { AbilityBadge, HpBar, Stars, StatValue } from '../components';
import { Icon, ItemIcon, RESOURCE_ICON, STAT_ICON, TraitIcon } from '../icons';

const DELAY: Record<CombatEvent['type'], number> = {
  duel: 450,
  attack: 420,
  death: 380,
  revive: 650,
  ability: 520,
  modifier: 520,
  end: 350,
};
const SPEEDS = [1, 2, 4];
const INTRO_MS = 2600;

const STAT_NAME: Record<StatKey, string> = { hp: 'HP', atk: 'ATK', def: 'DEF', spd: 'SPD' };
const PASSIVE_TEXT: Partial<Record<CombatBonus['source'], string>> = {
  window: 'First strike hits twice',
  flipflops: 'Double hits at 2× speed',
  magazine: 'One free revive',
};

interface View {
  php: number[];
  ehp: number[];
  p: number;
  e: number;
  last: CombatEvent | null;
}

function replay(report: CombatReport, upto: number): View {
  const php = report.player.map((f) => f.hp);
  const ehp = report.enemies.map((f) => f.hp);
  let p = -1;
  let e = -1;
  for (let i = 0; i < upto; i++) {
    const ev = report.events[i];
    if (ev.type === 'duel') {
      p = ev.p;
      e = ev.e;
    } else if (ev.type === 'attack') {
      if (ev.side === 'p') ehp[e] = ev.hp;
      else php[p] = ev.hp;
    } else if (ev.type === 'revive') php[ev.index] = ev.hp;
    else if (ev.type === 'ability' && ev.target) {
      if (ev.target.side === 'p') php[ev.target.index] = ev.target.hp;
      else ehp[ev.target.index] = ev.target.hp;
    }
  }
  return { php, ehp, p, e, last: upto > 0 ? report.events[upto - 1] : null };
}

export function CombatScreen({ report, onDone }: { report: CombatReport; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [intro, setIntro] = useState(
    report.bonuses.length > 0 || report.modifier !== null || startAbilities(report).length > 0,
  );
  const total = report.events.length;
  const done = step >= total;

  useEffect(() => {
    if (!intro) return;
    const t = setTimeout(() => setIntro(false), INTRO_MS);
    return () => clearTimeout(t);
  }, [intro]);

  useEffect(() => {
    if (done || intro) return;
    const t = setTimeout(() => setStep((s) => s + 1), DELAY[report.events[step].type] / SPEEDS[speedIdx]);
    return () => clearTimeout(t);
  }, [step, speedIdx, done, intro, report]);

  const view = useMemo(() => replay(report, step), [report, step]);
  const last = view.last;

  const anim = (side: Side): string => {
    if (!last) return '';
    if (last.type === 'attack') return last.side === side ? `lunge-${side}` : 'hit';
    if (last.type === 'death' && last.side === side) return 'dying';
    if (last.type === 'revive' && side === 'p') return 'revive';
    return '';
  };
  const dmgOn = (side: Side) => (last?.type === 'attack' && last.side !== side ? last.damage : null);
  const popup =
    last?.type === 'ability'
      ? { side: 'p', text: `${ABILITY_INFO[last.ability].icon} ${ABILITY_INFO[last.ability].name}` }
      : last?.type === 'modifier'
        ? { side: 'e', text: `${MODIFIER_INFO[last.modifier].icon} +1 ATK` }
        : null;

  return (
    <div className="screen combat">
      <div className="combat-head">
        <span className="round-badge">
          Round {report.round}/{ROUNDS}
        </span>
        <Icon name="fight" size={22} />
      </div>

      <Queue fighters={report.enemies} hp={view.ehp} active={view.e} enemy />

      <div className="arena">
        <div className="duel-slot top">
          {view.e >= 0 && (
            <BigFighter
              key={`e-${step}`}
              f={report.enemies[view.e]}
              hp={view.ehp[view.e]}
              enemy
              anim={anim('e')}
              dmg={dmgOn('e')}
              double={last?.type === 'attack' && last.double}
            />
          )}
        </div>
        <div className="vs">VS</div>
        {popup && (
          <span key={`pop-${step}`} className={`ability-pop ${popup.side}`}>
            {popup.text}
          </span>
        )}
        <div className="duel-slot bottom">
          {view.p >= 0 && (
            <BigFighter
              key={`p-${step}`}
              f={report.player[view.p]}
              hp={view.php[view.p]}
              anim={anim('p')}
              dmg={dmgOn('p')}
              double={false}
            />
          )}
        </div>
      </div>

      <Queue fighters={report.player} hp={view.php} active={view.p} />

      <div className="combat-controls">
        <button className="icon-btn sk speed" onClick={() => setSpeedIdx((i) => (i + 1) % SPEEDS.length)} disabled={done}>
          <Icon name="ff" size={20} fill="#fff" /> x{SPEEDS[speedIdx]}
        </button>
        <button className="icon-btn sk" onClick={() => setStep(total)} disabled={done} aria-label="Skip">
          <Icon name="skip" size={20} fill="#fff" />
        </button>
      </div>

      {intro && <BonusIntro report={report} onStart={() => setIntro(false)} />}
      {done && <ResultOverlay report={report} onDone={onDone} />}
    </div>
  );
}

function BigFighter({
  f,
  hp,
  enemy = false,
  anim,
  dmg,
  double,
}: {
  f: Fighter;
  hp: number;
  enemy?: boolean;
  anim: string;
  dmg: number | null;
  double: boolean;
}) {
  return (
    <div className={`big-fighter ${anim} ${hp <= 0 ? 'dead' : ''}`}>
      <div className="art-wrap">
        {enemy ? (
          <EnemyArt size={f.boss ? 104 : 90} kind={f.kind as EnemyKind} rarity={f.rarity} boss={f.boss} />
        ) : (
          <MerdomonArt size={90} kind={f.kind as MerdomonKind} rarity={f.rarity} />
        )}
        {dmg !== null && (
          <span className="dmg">
            -{dmg}
            {double && '!'}
          </span>
        )}
      </div>
      <div className="fighter-info">
        <span className="fighter-meta">
          <Stars rarity={f.rarity} size={11} />
          {f.ability && <AbilityBadge ability={f.ability} size={18} />}
        </span>
        <HpBar hp={Math.max(0, hp)} max={f.maxHp} />
        <span className="mini-stats">
          {(['atk', 'def', 'spd'] as const).map((k) => (
            <span key={k}>
              <Icon name={STAT_ICON[k]} size={12} />
              <StatValue value={f[k]} />
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

function Queue({ fighters, hp, active, enemy = false }: { fighters: Fighter[]; hp: number[]; active: number; enemy?: boolean }) {
  return (
    <div className="queue">
      {fighters.map((f, i) => (
        <div key={f.id} className={`queue-item ${i === active ? 'active' : ''} ${hp[i] <= 0 ? 'dead' : ''}`}>
          {enemy ? (
            <EnemyArt size={32} kind={f.kind as EnemyKind} rarity={f.rarity} boss={f.boss} />
          ) : (
            <MerdomonArt size={32} kind={f.kind as MerdomonKind} rarity={f.rarity} />
          )}
          <div className="queue-hp">
            <div style={{ width: `${Math.max(0, (hp[i] / f.maxHp) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SourceIcon({ source }: { source: RewardSource }) {
  switch (source) {
    case 'survivors':
      return <MerdomonArt size={24} />;
    case 'enemies':
      return <EnemyArt size={24} />;
    case 'damage':
      return <Icon name="fist" size={22} fill="#fff" />;
    default:
      if (source in TRAIT_INFO) return <TraitIcon trait={source as keyof typeof TRAIT_INFO} size={22} />;
      if (source in ITEM_INFO) return <ItemIcon item={source as keyof typeof ITEM_INFO} size={22} />;
      if (source in ABILITY_INFO) return <AbilityBadge ability={source as AbilityId} size={24} />;
      if (source in MODIFIER_INFO) return <span className="mod-emoji">{MODIFIER_INFO[source as ModifierId].icon}</span>;
      return null;
  }
}

function BonusSource({ source }: { source: CombatBonus['source'] }) {
  if (source in TRAIT_INFO) return <TraitIcon trait={source as keyof typeof TRAIT_INFO} size={24} />;
  return <ItemIcon item={source as keyof typeof ITEM_INFO} size={24} />;
}

/** Abilities that act before the first duel (Frontliner, Rear Guard, Cheerleader). */
function startAbilities(report: CombatReport) {
  const firstDuel = report.events.findIndex((e) => e.type === 'duel');
  return report.events
    .slice(0, firstDuel < 0 ? report.events.length : firstDuel)
    .flatMap((e) => (e.type === 'ability' ? [e] : []));
}

const START_ABILITY_STATS: Partial<Record<AbilityId, StatKey[]>> = {
  frontliner: ['hp', 'def'],
  rearGuard: ['def'],
  cheerleader: ['atk'],
};

/** Combat-start recap: the wave modifier, what traits/items/abilities change, and the boosted team. */
function BonusIntro({ report, onStart }: { report: CombatReport; onStart: () => void }) {
  const boosted = new Set(report.bonuses.flatMap((b) => (b.stat ? [b.stat] : [])));
  const starts = startAbilities(report);
  for (const e of starts) for (const k of START_ABILITY_STATS[e.ability] ?? []) boosted.add(k);
  return (
    <div className="overlay" onClick={onStart}>
      <div className="modal sk intro">
        <h2 className="intro-title">Bonuses</h2>
        {report.modifier && (
          <div className="intro-modifier">
            <span className="mod-emoji">{MODIFIER_INFO[report.modifier].icon}</span>
            <span>
              <b>{MODIFIER_INFO[report.modifier].name}</b>
              <small>{MODIFIER_INFO[report.modifier].desc}</small>
            </span>
          </div>
        )}
        <div className="intro-bonuses">
          {starts.map((e, i) => (
            <div key={`a${i}`} className="intro-bonus">
              <AbilityBadge ability={e.ability} size={24} />
              <span className="intro-gain">{ABILITY_INFO[e.ability].name}</span>
            </div>
          ))}
          {report.bonuses.map((b, i) => (
            <div key={i} className="intro-bonus">
              <BonusSource source={b.source} />
              {b.stat ? (
                <span className="intro-gain">
                  <Icon name={STAT_ICON[b.stat]} size={18} />+{b.amount} {STAT_NAME[b.stat]}
                </span>
              ) : (
                <span className="muted">{PASSIVE_TEXT[b.source]}</span>
              )}
            </div>
          ))}
        </div>
        <div className="intro-team">
          {report.player.map((f) => (
            <div key={f.id} className="intro-fighter">
              <MerdomonArt size={34} kind={f.kind as MerdomonKind} rarity={f.rarity} />
              <span className="intro-stats">
                {STAT_KEYS.map((k) => (
                  <span key={k} className={boosted.has(k) ? 'boosted' : ''}>
                    <Icon name={STAT_ICON[k]} size={11} />
                    <StatValue value={k === 'hp' ? f.maxHp : f[k]} />
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
        <div className="intro-timer" style={{ animationDuration: `${INTRO_MS}ms` }} />
      </div>
    </div>
  );
}

function ResultOverlay({ report, onDone }: { report: CombatReport; onDone: () => void }) {
  return (
    <div className="overlay">
      <div className="modal sk result">
        <div className={`result-title ${report.won ? 'win' : 'lose'}`}>
          <Icon name={report.won ? 'trophy' : 'skull'} size={44} fill="#fff" />
          <h2>{report.won ? 'Wave cleared!' : 'Distracted...'}</h2>
        </div>
        <div className="rewards">
          {report.rewards.map((r, i) => (
            <div key={i} className="reward">
              <SourceIcon source={r.source} />
              {r.source === 'survivors' || r.source === 'enemies' ? (
                <span className="muted">×{Math.abs(r.amount)}</span>
              ) : (
                <span />
              )}
              <span className={`reward-amount ${r.amount < 0 ? 'neg' : ''}`}>
                {r.amount > 0 ? '+' : ''}
                {r.amount}
                <Icon name={RESOURCE_ICON[r.resource]} size={20} fill="#fff" />
              </span>
            </div>
          ))}
        </div>
        <button className="big-btn shadow" onClick={onDone}>
          <Icon name="play" size={22} fill="#1b1b1b" />
        </button>
      </div>
    </div>
  );
}
