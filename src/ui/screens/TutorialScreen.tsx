import { useRef, useState, type ReactNode } from 'react';
import {
  CONCENTRATE_GAIN,
  COSTS,
  EVACUATE_COST,
  ITEMS,
  ITEM_INFO,
  MAX_CONCENTRATION,
  MAX_MERDASCORE,
  RARITY_POINTS,
  RARITY_TRAITS,
  ROUNDS,
  TRAITS,
  TRAIT_INFO,
  TRAIT_VALUES,
} from '../../engine/data';
import type { Merdomon, Rarity, RunState } from '../../engine/types';
import { EnemyArt, MerdomonArt } from '../art';
import { CostBadge, InfoRow, MerdomonCard, Stars, TopBar, TraitsRow } from '../components';
import { Icon, ItemIcon, TraitIcon, type IconName } from '../icons';
import { PrepScreen } from './PrepScreen';

// ---------- Demo data, shaped like a real run in progress ----------

const demoTeam: Merdomon[] = [
  { id: 1, rarity: 'rare', stats: { hp: 6, atk: 5, def: 2, spd: 3 }, hp: 4, traits: ['fighter', 'paper'], ability: 'generic' },
  { id: 2, rarity: 'common', stats: { hp: 4, atk: 2, def: 3, spd: 1 }, hp: 4, traits: ['fighter'], ability: 'generic' },
  { id: 3, rarity: 'common', stats: { hp: 3, atk: 2, def: 1, spd: 3 }, hp: 3, traits: ['haste'], ability: 'generic' },
];

const demoRun: RunState = {
  version: 1,
  phase: 'preparation',
  round: 3,
  concentration: 7,
  tp: 24,
  merdascore: 12,
  ap: 1,
  team: demoTeam,
  items: ['brush', 'window'],
  starters: [],
  pending: null,
  wave: [
    { id: 10, rarity: 'common', stats: { hp: 3, atk: 2, def: 1, spd: 3 }, ability: 'generic', boss: false },
    { id: 11, rarity: 'rare', stats: { hp: 5, atk: 4, def: 2, spd: 3 }, ability: 'generic', boss: false },
    { id: 12, rarity: 'common', stats: { hp: 4, atk: 2, def: 1, spd: 2 }, ability: 'generic', boss: false },
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
        <Row icon={<span className="round-badge">3/{ROUNDS}</span>} title="Round">
          Current wave out of {ROUNDS}.
        </Row>
        <Row icon={I('ap', '#1b1b1b')} title="Action Points">
          You get 1 every round, to spend on the main actions.
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
              <Stars rarity="rare" size={13} /> Rarity
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
              <th>Stat pts</th>
              <th>Traits</th>
              <th>Evacuate</th>
            </tr>
          </thead>
          <tbody>
            {(['common', 'rare', 'epic'] as Rarity[]).map((r) => (
              <tr key={r}>
                <td>
                  <Stars rarity={r} size={13} />
                </td>
                <td>+{RARITY_POINTS[r]}</td>
                <td>{RARITY_TRAITS[r]}</td>
                <td>
                  <CostBadge ms={String(EVACUATE_COST[r])} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="tut-note">
          Stats go from 1 to 10. Damage stays between waves. Tap a Merdomon to see its details.
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
          Tap <b>{ii('bonus')} Action</b>. The top row costs 1 {ii('ap', '#1b1b1b')}:
        </p>
        <TileDemo
          tiles={[
            { icon: 'heal', label: 'Heal', cost: { ap: 1 } },
            { icon: 'toilet', label: 'Evacuate', cost: { ap: 1, ms: `${EVACUATE_COST.common}+` } },
            { icon: 'shop', label: 'Shop', cost: { ap: 1, tp: COSTS.shop } },
            { icon: 'focus', label: 'Concentrate', cost: { ap: 1, ms: `+${CONCENTRATE_GAIN}`, conc: -COSTS.concentrate } },
          ]}
        />
        <Row icon={I('heal')} title="Heal">
          All Merdomon back to full HP. <CostBadge ap={1} />
        </Row>
        <Row icon={I('toilet')} title="Evacuate">
          Spend Merdascore to create a new Merdomon (max 6). Then pick a stat for its +1 point.{' '}
          <CostBadge ap={1} ms={`${EVACUATE_COST.common}+`} />
        </Row>
        <Row icon={I('shop')} title="Shop">
          Buy one item. <CostBadge ap={1} tp={COSTS.shop} />
        </Row>
        <Row icon={I('focus')} title="Concentrate">
          Trade Concentration for Merdascore.{' '}
          <CostBadge ap={1} ms={`+${CONCENTRATE_GAIN}`} conc={-COSTS.concentrate} />
        </Row>
      </>
    ),
  },
  {
    title: 'Free actions',
    body: (
      <>
        <p className="tut-note">The bottom row needs no {ii('ap', '#1b1b1b')}, only Toilet Paper:</p>
        <TileDemo
          tiles={[
            { icon: 'swap', label: 'Organize', cost: {} },
            { icon: 'flush', label: 'Flush', cost: { tp: COSTS.flush } },
            { icon: 'bonus', label: 'Bonus Action', cost: { tp: COSTS.bonusAction } },
            { icon: 'upgrade', label: 'Upgrade', cost: { tp: COSTS.upgrade } },
          ]}
        />
        <Row icon={I('swap')} title="Organize">
          Swap positions: tap one Merdomon, then where it goes. Slot 1 fights first!
        </Row>
        <Row icon={I('flush')} title="Flush">
          Remove a Merdomon and get +1 Concentration. <CostBadge tp={COSTS.flush} />
        </Row>
        <Row icon={I('bonus')} title="Bonus Action">
          +1 {ii('ap', '#1b1b1b')} for this round. <CostBadge tp={COSTS.bonusAction} />
        </Row>
        <Row icon={I('upgrade')} title="Upgrade">
          +1 to one stat of a Merdomon (max 10). <CostBadge tp={COSTS.upgrade} />
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
        <Row icon={I('phone')} title="Common distraction">
          Weak, {RARITY_POINTS.common} extra stat points.
        </Row>
        <Row icon={I('phone', '#1b1b1b')} title="Rare distraction">
          Tougher, {RARITY_POINTS.rare} extra stat points.
        </Row>
        <Row icon={I('crown', '#1b1b1b')} title="The Boss">
          Epic, only in wave {ROUNDS}, and always last in line.
        </Row>
        <p className="tut-note">When you're ready, tap Next Wave: the fight plays out by itself.</p>
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
              {ii('fist')}4 {ii('bolt')}3
            </span>
          </div>
          <span className="vs">VS</span>
          <div>
            <EnemyArt size={56} />
            <span className="tut-duel-stats">
              {ii('shield')}1 {ii('bolt')}2
            </span>
          </div>
        </div>
        <Row icon={<span className="tut-step">1</span>}>Your first Merdomon faces the first Distraction, one on one.</Row>
        <Row icon={<span className="tut-step">2</span>}>
          Higher {ii('bolt')} Speed strikes first. Tie: the faster team, then luck.
        </Row>
        <Row icon={<span className="tut-step">3</span>}>
          Damage = {ii('fist')} − {ii('shield')}, at least 1. Here: 4 − 1 = <b>3</b>.
        </Row>
        <Row icon={<span className="tut-step">4</span>}>
          They trade hits until one falls. The next in line steps in, until a team is out.
        </Row>
        <p className="tut-note">
          Use {ii('ff')} to speed up and {ii('skip')} to skip.
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
              −1 {ii('focus')} for each Distraction still standing
            </p>
          </div>
        </div>
        <p className="tut-note">Then, either way:</p>
        <Row icon={I('tp')}>+1 Toilet Paper for every point of damage dealt.</Row>
        <Row icon={<TraitIcon trait="paper" size={22} />}>Trait and item bonuses are paid out.</Row>
        <Row icon={<MerdomonArt size={26} sad />}>Fallen Merdomon come back with 1 HP. Heal them!</Row>
      </>
    ),
  },
  {
    title: 'Items',
    body: (
      <>
        <p className="tut-note">
          Bought in the Shop. Each one also counts as <b>1 trait</b>.
        </p>
        {ITEMS.map((it) => (
          <Row
            key={it}
            icon={<ItemIcon item={it} size={24} />}
            title={ITEM_INFO[it].name}
          >
            <TraitIcon trait={ITEM_INFO[it].trait} size={14} /> {ITEM_INFO[it].desc}
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
