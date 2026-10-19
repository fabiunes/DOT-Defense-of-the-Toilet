import { useRef, useState, type ReactNode } from 'react';
import {
  CONCENTRATE_GAIN,
  COSTS,
  ENEMY_KINDS,
  EVACUATE_COST,
  ITEMS,
  ITEM_INFO,
  KIND_CURVE,
  KIND_NAME,
  MAX_CONCENTRATION,
  MAX_CONCENTRATION_LOSS,
  MAX_MERDASCORE,
  MERDOMON_KINDS,
  RARITY_TRAITS,
  REROLL_COST,
  ROUNDS,
  SIZE_NAME,
  SIZE_TOTAL,
  TRAITS,
  TRAIT_INFO,
  TRAIT_VALUES,
  TRADE,
} from '../../engine/data';
import type { Merdomon, Rarity, RunState } from '../../engine/types';
import { EnemyArt, MerdomonArt } from '../art';
import { CostBadge, InfoRow, MerdomonCard, Stars, StatValue, TopBar, TraitsRow } from '../components';
import { Icon, ItemIcon, TraitIcon, type IconName } from '../icons';
import { PrepScreen } from './PrepScreen';

// ---------- Demo data, shaped like a real run in progress ----------

const demoTeam: Merdomon[] = [
  { id: 1, rarity: 'rare', kind: 'normal', stats: { hp: 6, atk: 5, def: 2, spd: 3 }, hp: 4, traits: ['fighter', 'paper'], ability: 'generic' },
  { id: 2, rarity: 'common', kind: 'runny', stats: { hp: 4, atk: 2, def: 3, spd: 1 }, hp: 4, traits: ['fighter'], ability: 'generic' },
  { id: 3, rarity: 'common', kind: 'fart', stats: { hp: 3, atk: 2, def: 1, spd: 3 }, hp: 3, traits: ['haste'], ability: 'generic' },
];

const demoRun: RunState = {
  version: 3,
  phase: 'preparation',
  round: 3,
  concentration: 7,
  tp: 24,
  merdascore: 12,
  ap: 1,
  team: demoTeam,
  items: ['brush', 'window'],
  shopOffer: [],
  starters: [],
  choices: [],
  pending: null,
  wave: [
    { id: 10, rarity: 'common', kind: 'phone', stats: { hp: 3, atk: 2, def: 1, spd: 3 }, ability: 'generic', boss: false },
    { id: 11, rarity: 'rare', kind: 'book', stats: { hp: 5, atk: 4, def: 2, spd: 3 }, ability: 'generic', boss: false },
    { id: 12, rarity: 'common', kind: 'console', stats: { hp: 4, atk: 2, def: 1, spd: 2 }, ability: 'generic', boss: false },
  ],
  lastCombat: null,
  rngState: 1,
  nextId: 100,
  stats: {
    wavesWon: 0,
    wavesLost: 0,
    enemiesDefeated: 0,
    damageDealt: 0,
    merdomonCreated: 0,
    merdomonFallen: 0,
    tpEarned: 0,
    merdascoreEarned: 0,
    concentrationLost: 0,
    itemsBought: 0,
  },
};

const noop = () => {};

// ---------- Building blocks ----------

function Row({ icon, title, children }: { icon: ReactNode; title?: string; children: ReactNode }) {
  return (
    <div className="tut-row">
      <span className="tut-row-icon">{icon}</span>
      <div>
        {title && <b>{title}</b>}
        <p>{children}</p>
      </div>
    </div>
  );
}

/** A real piece of the game UI, shown as a non-interactive example. */
function Demo({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`tut-demo sk ${className}`} aria-hidden>
      {children}
    </div>
  );
}

/** Same look as the tiles in the in-game Action panel. */
function TileDemo({ tiles }: { tiles: { icon: IconName; label: string; cost: Parameters<typeof CostBadge>[0] }[] }) {
  return (
    <Demo>
      <div className="tiles">
        {tiles.map((t) => (
          <span key={t.label} className="tile sk">
            <Icon name={t.icon} size={28} fill="#fff" />
            <span className="tile-label">{t.label}</span>
            <CostBadge {...t.cost} />
          </span>
        ))}
      </div>
    </Demo>
  );
}

/** The stat split of a type, as small bars. */
function Curve({ kind }: { kind: keyof typeof KIND_CURVE }) {
  return (
    <span className="tut-curve">
      {KIND_CURVE[kind].map((p, i) => (
        <span key={i} style={{ height: `${Math.max(2, p * 0.5)}px` }} title={`${p}%`} />
      ))}
      <small>{KIND_CURVE[kind].join('·')}%</small>
    </span>
  );
}

const I = (name: IconName, fill = '#fff', size = 22) => <Icon name={name} fill={fill} size={size} />;

/** Inline icon inside a sentence. */
const ii = (name: IconName, fill = '#fff') => <Icon name={name} fill={fill} size={15} className="inline-icon" />;

// ---------- Pages ----------

interface Page {
  title: string;
  body: ReactNode;
}

const pages: Page[] = [
  {
    title: 'Defend your break!',
    body: (
      <>
        <div className="tut-minimap" aria-hidden>
          <div className="tut-minimap-inner">
            <PrepScreen run={demoRun} update={noop} />
          </div>
        </div>
        <Row icon={<EnemyArt size={30} />} title="Distractions attack">
          {ROUNDS} waves want to ruin your toilet break.
        </Row>
        <Row icon={<MerdomonArt size={30} />} title="Merdomon defend">
          Build your team, then watch them fight on their own.
        </Row>
        <Row icon={I('crown', '#1b1b1b')} title="Win">
          Beat the Boss in wave {ROUNDS}. If Concentration hits 0, it's Game Over.
        </Row>
      </>
    ),
  },
  {
    title: 'Top bar',
    body: (
      <>
        <Demo>
          <TopBar run={demoRun} />
        </Demo>
        <Row icon={I('tp')} title="Toilet Paper">
          Your money. Earn it by dealing damage, spend it on items and free actions.
        </Row>
        <Row icon={I('focus')} title="Concentration">
          Your life ({MAX_CONCENTRATION} max). Losing a wave lowers it. At 0 the run ends.
        </Row>
        <Row icon={I('poop')} title="Merdascore">
          Up to {MAX_MERDASCORE}. Spend it to Evacuate new Merdomon. Won waves fill it.
        </Row>
      </>
    ),
  },
  {
    title: 'Round, actions & bonuses',
    body: (
      <>
        <Demo>
          <InfoRow run={demoRun} onItem={noop} />
          <TraitsRow run={demoRun} onTrait={noop} />
        </Demo>
        <Row icon={<span className="round-badge">Round 3/{ROUNDS}</span>} title="Round">
          Current wave out of {ROUNDS}.
        </Row>
        <Row icon={I('ap', '#1b1b1b')} title="Action Points">
          1 every round (more with the Action trait). Spend them on the main actions: unspent ones are lost.
        </Row>
        <Row icon={<ItemIcon item="brush" size={22} />} title="Items">
          Your items (top right). Tap one to read what it does.
        </Row>
        <Row
          icon={
            <span className="trait-chip on tut-chip">
              <TraitIcon trait="fighter" size={16} />
              <b>2</b>
            </span>
          }
          title="Traits"
        >
          How many of each trait your team has. Solid border = bonus active. Tap for details.
        </Row>
      </>
    ),
  },
  {
    title: 'Your Merdomon',
    body: (
      <>
        <div className="tut-card-row">
          <Demo className="tut-card-demo">
            <MerdomonCard m={demoTeam[0]} />
          </Demo>
          <div className="tut-legend">
            <span>
              <Stars rarity="rare" size={13} /> Size
            </span>
            <span>
              <TraitIcon trait="fighter" size={15} />
              <TraitIcon trait="paper" size={15} /> Traits
            </span>
            <span>
              <span className="tut-mini-bar" /> HP now / max
            </span>
            <span>
              {I('heart', 'none', 16)} Max HP
            </span>
            <span>
              {I('fist', 'none', 16)} Attack
            </span>
            <span>
              {I('shield', 'none', 16)} Defense
            </span>
            <span>
              {I('bolt', 'none', 16)} Speed
            </span>
          </div>
        </div>
        <table className="tut-table">
          <thead>
            <tr>
              <th />
              <th>Stats</th>
              <th>Traits</th>
              <th>Evacuate</th>
            </tr>
          </thead>
          <tbody>
            {(['common', 'rare', 'epic'] as Rarity[]).map((r) => (
              <tr key={r}>
                <td className="left">
                  <Stars rarity={r} size={13} /> {SIZE_NAME[r]}
                </td>
                <td>{SIZE_TOTAL[r]}</td>
                <td>{RARITY_TRAITS[r]}</td>
                <td>
                  <CostBadge ms={String(EVACUATE_COST[r])} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="tut-bands">
          {[1, 3, 5, 7, 9].map((v) => (
            <StatValue key={v} value={v} label={`${v}–${v + 1}`} />
          ))}
        </div>
        <p className="tut-note">
          Stats go from 1 to 10; colours show how strong each one is. Damage stays between waves.
        </p>
      </>
    ),
  },
  {
    title: 'Types',
    body: (
      <>
        <p className="tut-note">
          Every creature has a <b>type</b>, in any size. The type decides how its stats are split; the biggest share
          goes to a random stat.
        </p>
        <div className="tut-types">
          {MERDOMON_KINDS.map((k) => (
            <div key={k} className="tut-type">
              <MerdomonArt size={48} kind={k} />
              <b>{KIND_NAME[k]}</b>
              <Curve kind={k} />
            </div>
          ))}
        </div>
        <p className="tut-note">Distractions work the same way:</p>
        <div className="tut-types">
          {ENEMY_KINDS.map((k) => (
            <div key={k} className="tut-type">
              <EnemyArt size={48} kind={k} rarity="epic" />
              <b>{KIND_NAME[k]}</b>
              <Curve kind={k} />
            </div>
          ))}
        </div>
        <p className="tut-note">
          Example: a Huge Fart (20 points) gets 10 · 7 · 2 · 1. A Huge Normal gets 6 · 6 · 4 · 4.
        </p>
      </>
    ),
  },
  {
    title: 'Traits',
    body: (
      <>
        <p className="tut-note">
          Collect the <b>same trait</b> on Merdomon and items: 2 / 4 / 6 / 8 unlock a stronger bonus.
        </p>
        <table className="tut-table traits">
          <thead>
            <tr>
              <th />
              <th />
              <th>2</th>
              <th>4</th>
              <th>6</th>
              <th>8</th>
            </tr>
          </thead>
          <tbody>
            {TRAITS.map((t) => (
              <tr key={t}>
                <td>
                  <TraitIcon trait={t} size={22} />
                </td>
                <td className="left">
                  <b>{TRAIT_INFO[t].name}</b>
                  <small>{TRAIT_INFO[t].desc}</small>
                </td>
                {TRAIT_VALUES[t].map((v, i) => (
                  <td key={i}>+{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="tut-note">Combat bonuses last only for the fight.</p>
      </>
    ),
  },
  {
    title: 'Main actions',
    body: (
      <>
        <p className="tut-note">
          Tap <b>{ii('bonus')} Preparation</b>. The top actions cost 1 {ii('ap', '#1b1b1b')}:
        </p>
        <TileDemo
          tiles={[
            { icon: 'heal', label: 'Heal', cost: { ap: 1 } },
            { icon: 'toilet', label: 'Evacuate', cost: { ap: 1, ms: `${EVACUATE_COST.common}+` } },
            { icon: 'shop', label: 'Shop', cost: { ap: 1, tp: COSTS.shop } },
            { icon: 'focus', label: 'Concentrate', cost: { ap: 1, ms: `+${CONCENTRATE_GAIN}`, conc: -COSTS.concentrate } },
            { icon: 'trade', label: 'Trade', cost: { ap: 1 } },
          ]}
        />
        <Row icon={I('heal')} title="Heal">
          All Merdomon back to full HP.
        </Row>
        <Row icon={I('toilet')} title="Evacuate">
          Pick 1 of 2 new Merdomon (max 6), then give it +1 to a stat.
        </Row>
        <Row icon={I('shop')} title="Shop">
          Buy one of the 2 items on sale this round.
        </Row>
        <Row icon={I('focus')} title="Concentrate">
          Trade 2 Concentration for {CONCENTRATE_GAIN} Merdascore.
        </Row>
        <Row icon={I('dice')} title="Re-Roll">
          Don't like the options in Evacuate or Shop? Redraw them for {REROLL_COST} {ii('tp')}.
        </Row>
        <Row icon={I('trade')} title="Trade">
          Swap 1 {ii('ap', '#1b1b1b')} for +{TRADE.merdascore} {ii('poop')}, +{TRADE.tp} {ii('tp')} or +{TRADE.stat} to a
          Merdomon stat (max 10).
        </Row>
      </>
    ),
  },
  {
    title: 'Free actions',
    body: (
      <>
        <p className="tut-note">The bottom actions need no {ii('ap', '#1b1b1b')}:</p>
        <TileDemo
          tiles={[
            { icon: 'swap', label: 'Organize', cost: {} },
            { icon: 'flush', label: 'Flush', cost: { tp: COSTS.flush } },
            { icon: 'bonus', label: 'Bonus Action', cost: { tp: COSTS.bonusAction } },
            { icon: 'eye', label: 'Scout', cost: {} },
          ]}
        />
        <Row icon={I('swap')} title="Organize">
          Swap positions: tap one Merdomon, then where it goes. Slot 1 fights first!
        </Row>
        <Row icon={I('flush')} title="Flush">
          Remove a Merdomon and get +1 Concentration.
        </Row>
        <Row icon={I('bonus')} title="Bonus Action">
          +1 {ii('ap', '#1b1b1b')} for this round.
        </Row>
        <Row icon={I('eye')} title="Scout">
          See the stats of the incoming Distractions, in fighting order.
        </Row>
      </>
    ),
  },
  {
    title: 'Next Wave',
    body: (
      <>
        <Demo className="tut-center">
          <span className="big-btn shadow fight-btn tut-fake-btn">
            <span className="fight-label">
              <Icon name="fight" size={22} /> Next Wave
            </span>
            <span className="wave-preview">
              <Icon name="phone" size={16} fill="#fff" />
              <Icon name="phone" size={16} fill="#1b1b1b" />
              <Icon name="phone" size={16} fill="#fff" />
            </span>
          </span>
        </Demo>
        <p className="tut-note">The icons under the button show who is coming:</p>
        <Row icon={I('phone')} title="Small distraction">
          {SIZE_TOTAL.common} stat points.
        </Row>
        <Row icon={I('phone', '#1b1b1b')} title="Big distraction">
          {SIZE_TOTAL.rare} stat points.
        </Row>
        <Row icon={I('crown', '#1b1b1b')} title="The Boss">
          Huge ({SIZE_TOTAL.epic} points), only in wave {ROUNDS}, always last in line.
        </Row>
        <p className="tut-note">
          Use {ii('eye')} Scout to see their stats. When you're ready, tap Next Wave: the fight plays out by itself.
        </p>
      </>
    ),
  },
  {
    title: 'How combat works',
    body: (
      <>
        <div className="tut-duel">
          <div>
            <MerdomonArt size={56} />
            <span className="tut-duel-stats">
              {ii('fist')}5 {ii('bolt')}4
            </span>
          </div>
          <span className="vs">VS</span>
          <div>
            <EnemyArt size={56} />
            <span className="tut-duel-stats">
              {ii('shield')}3 {ii('bolt')}3
            </span>
          </div>
        </div>
        <Row icon={<span className="tut-step">1</span>}>Your first Merdomon faces the first Distraction, one on one.</Row>
        <Row icon={<span className="tut-step">2</span>}>
          Higher {ii('bolt')} Speed strikes first. Tie: the faster team, then luck.
        </Row>
        <Row icon={<span className="tut-step">3</span>}>
          Damage = {ii('fist')} − half {ii('shield')} (rounded down), at least 1. Here: 5 − 1 = <b>4</b>.
        </Row>
        <Row icon={<span className="tut-step">4</span>}>
          They trade hits until one falls. The next in line steps in, until a team is out.
        </Row>
        <p className="tut-note">
          Before each fight, a recap shows the bonuses from your traits and items. Use {ii('ff')} to speed up and{' '}
          {ii('skip')} to skip.
        </p>
      </>
    ),
  },
  {
    title: 'After the wave',
    body: (
      <>
        <div className="tut-outcomes">
          <div className="sk">
            {I('trophy', '#fff', 30)}
            <b>Won</b>
            <p>
              +1 {ii('poop')} for each Merdomon still standing
            </p>
          </div>
          <div className="sk lose">
            {I('skull', '#fff', 30)}
            <b>Lost</b>
            <p>
              −1 {ii('focus')} for each Distraction still standing (max −{MAX_CONCENTRATION_LOSS})
            </p>
          </div>
        </div>
        <p className="tut-note">Then, either way:</p>
        <Row icon={I('tp')}>+1 Toilet Paper for every point of damage dealt.</Row>
        <Row icon={<TraitIcon trait="paper" size={22} />}>Trait and item bonuses are paid out.</Row>
        <Row icon={<MerdomonArt size={26} sad />}>Fallen Merdomon come back with half their HP.</Row>
        <Row icon={I('ap', '#1b1b1b')}>Unspent Action Points are lost.</Row>
      </>
    ),
  },
  {
    title: 'Items',
    body: (
      <>
        <p className="tut-note">
          2 random items are on sale each round. Each item also counts for its <b>traits</b>.
        </p>
        {ITEMS.map((it) => (
          <Row
            key={it}
            icon={<ItemIcon item={it} size={24} />}
            title={ITEM_INFO[it].name}
          >
            {ITEM_INFO[it].traits.map((t) => (
              <TraitIcon key={t} trait={t} size={14} />
            ))}{' '}
            {ITEM_INFO[it].desc}
          </Row>
        ))}
      </>
    ),
  },
];

// ---------- Screen ----------

export function TutorialScreen({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const page = pages[index];
  const last = index === pages.length - 1;

  const go = (delta: number) => setIndex((i) => Math.max(0, Math.min(pages.length - 1, i + delta)));

  return (
    <div
      className="screen tutorial"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="tut-head">
        <h2>{page.title}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close tutorial">
          <Icon name="close" size={22} />
        </button>
      </div>

      <div className="tut-body" key={index}>
        {page.body}
      </div>

      <div className="tut-nav">
        <button className="icon-btn sk" onClick={() => go(-1)} disabled={index === 0} aria-label="Previous">
          <Icon name="play" size={18} fill="#fff" className="flip" />
        </button>
        <div className="tut-dots">
          {pages.map((p, i) => (
            <button
              key={p.title}
              className={`tut-dot ${i === index ? 'on' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={p.title}
            />
          ))}
        </div>
        {last ? (
          <button className="icon-btn sk tut-done" onClick={onClose} aria-label="Done">
            <Icon name="check" size={18} />
          </button>
        ) : (
          <button className="icon-btn sk" onClick={() => go(1)} aria-label="Next">
            <Icon name="play" size={18} fill="#1b1b1b" />
          </button>
        )}
      </div>
    </div>
  );
}
