import { useRef, useState, type ReactNode } from 'react';
import {
  ABILITIES,
  ABILITY_INFO,
  CONCENTRATE_GAIN,
  COSTS,
  ENEMY_KINDS,
  EVACUATE_COST,
  ITEMS,
  ITEM_INFO,
  KIND_CURVE,
  KIND_NAME,
  MAX_CONCENTRATION,
  LEVELS,
  LEVEL_BOSS,
  LEVEL_ENEMY_BONUS,
  LEVEL_REWARD,
  BOSS_INFO,
  BATHROOMS,
  BATHROOM_INFO,
  BUILD_COST,
  FARTING,
  GIFT_WAVE,
  SCORE,
  STRUCTURES,
  STRUCTURE_INFO,
  MERDOMON_KINDS,
  MODIFIERS,
  MODIFIER_AP_REWARD,
  MODIFIER_DISABLE_COST,
  MODIFIER_INFO,
  MODIFIER_WAVES,
  RARITY_TRAITS,
  REROLL_COST,
  ROUNDS,
  SIZE_NAME,
  SIZE_TOTAL,
  START_PACK,
  TRAITS,
  TRAIT_INFO,
  TRAIT_VALUES,
  TRADE,
  ABILITY_CHOICES,
  BATHROOM_ACTION_POOP,
  MODIFIER_DISABLE_CONCENTRATION,
} from '../../engine/data';
import type { Merdomon, Rarity, RunState } from '../../engine/types';
import * as G from '../../engine/game';
import { unlockAllWithPassword } from '../../engine/save';
import { analytics } from '../analytics';
import { EnemyArt, MerdomonArt } from '../art';
import { StructureIcon } from '../bathroom';
import { AbilityBadge, CostBadge, InfoRow, MerdomonCard, Stars, StatValue, TopBar, TraitsRow } from '../components';
import { Icon, ItemIcon, TraitIcon, type IconName } from '../icons';
import { PrepScreen } from './PrepScreen';

// ---------- Demo data, shaped like a real run in progress ----------

const demoTeam: Merdomon[] = [
  { id: 1, rarity: 'rare', kind: 'normal', stats: { hp: 6, atk: 5, def: 2, spd: 3 }, hp: 4, traits: ['fighter', 'paper'], ability: 'cheerleader' },
  { id: 2, rarity: 'common', kind: 'liquid', stats: { hp: 4, atk: 2, def: 3, spd: 1 }, hp: 4, traits: ['fighter'], ability: 'snowball' },
  { id: 3, rarity: 'common', kind: 'fart', stats: { hp: 3, atk: 2, def: 1, spd: 3 }, hp: 3, traits: ['haste'], ability: 'spiky' },
];

const demoRun: RunState = {
  version: 9,
  phase: 'preparation',
  round: 3,
  concentration: 7,
  tp: 24,
  merdascore: 12,
  ap: 1,
  bonusAp: 0,
  level: 1,
  bathroom: 'home',
  startStructures: { stall: 1, sink: 1, bidet: 1, scrubber: 1, toilet: 1, holder: 1 },
  giftOffer: [],
  freeRerolls: 0,
  boss: 'bestseller',
  structures: { stall: 1, sink: 2, bidet: 1, scrubber: 1, toilet: 1, holder: 1 },
  team: demoTeam,
  items: ['plunger', 'window'],
  shopOffer: [],
  starters: [],
  startOptions: null,
  choices: [],
  pending: null,
  pendingAbilities: [],
  modifiers: { 3: 'rushHour' },
  modifierDisabled: false,
  entryFeePaid: false,
  bathroomActionUsed: false,
  comfortHp: 0,
  wave: [
    { id: 10, rarity: 'common', kind: 'phone', stats: { hp: 3, atk: 2, def: 1, spd: 3 }, boss: false },
    { id: 11, rarity: 'rare', kind: 'book', stats: { hp: 5, atk: 4, def: 2, spd: 3 }, boss: false },
    { id: 12, rarity: 'common', kind: 'console', stats: { hp: 4, atk: 2, def: 1, spd: 2 }, boss: false },
  ],
  lastCombat: null,
  rngState: 1,
  nextId: 100,
  stats: G.emptyStats(),
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
    title: "What's new (v0.14)",
    body: (
      <ul className="tut-news">
        <li>Bathrooms are now <b>journeys</b>: 💼 Office, 🚻 Public, 🏠 Home, 🛎️ Hotel, all open. Win a level to unlock the next one with that bathroom.</li>
        <li>Each bathroom has its own action or rule (Coffee Break, Wall Graffiti, Comfort, Entry Fee).</li>
        <li>New Merdomon pick 1 of <b>2</b> abilities (3 with the Game Boy or for your first one), with <b>Re-Roll</b>.</li>
        <li>Evacuate a Huge Merdomon: <b>{EVACUATE_COST.epic}</b> Poop. Bonus Action: <b>{COSTS.bonusAction}</b> TP. Corrupt: <b>{MODIFIER_DISABLE_COST}</b> TP or <b>1</b> Concentration.</li>
        <li>Frontliner +1 HP (was +2). Leech heals at most twice per enemy.</li>
        <li>Flip-Flops: +3 ATK against a foe at most half as fast (Haste). Window: Fighter + Defender. White Towel: Defender. Game Boy: Stinky, 3 abilities too. Paper Towel +4 TP. Hammer 18 TP. Hand Shower: −2 TP on everything.</li>
        <li>New item: <b>Razor</b>, +1 TP per active trait.</li>
        <li>Paper Holder produces +1/+2/+3/+4 TP.</li>
        <li>Tap <b>?</b> during a run to open these rules.</li>
      </ul>
    ),
  },
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
    title: 'Starting a run',
    body: (
      <>
        <Row icon={<span className="tut-step">1</span>} title="Level and bathroom">
          The level sets your Boss (waves 5 and 10); the bathroom sets your starting structures and resources.
        </Row>
        <Row icon={<span className="tut-step">2</span>} title="Pick a starter">
          Choose 1 of 3 Small Merdomon.
        </Row>
        <Row icon={<span className="tut-step">3</span>} title="Ability and +1">
          Every new Merdomon picks <b>1 of 3 abilities</b> and a stat for its +1 point, then Confirm.
        </Row>
        <Row icon={<span className="tut-step">4</span>} title="Starting bonus">
          Choose one:
        </Row>
        <div className="tut-starts">
          <span className="sk">
            <ItemIcon item="towel" size={26} />
            <small>A random item</small>
          </span>
          <span className="sk">
            <MerdomonArt size={30} rarity="common" />
            <small>A Small Merdomon</small>
          </span>
          <span className="sk">
            <Icon name="shop" size={26} fill="#fff" />
            <small>
              +{START_PACK.tp} {ii('tp')} +{START_PACK.merdascore} {ii('poop')} +{START_PACK.ap} {ii('ap', '#1b1b1b')}
            </small>
          </span>
        </div>

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
          Your money. Earn it by dealing damage. The Paper Holder sets how much you can keep.
        </Row>
        <Row icon={I('focus')} title="Concentration">
          Your life ({MAX_CONCENTRATION} max). Losing a wave lowers it. At 0 the run ends.
        </Row>
        <Row icon={I('poop')} title="Poop">
          Spend it to Evacuate new Merdomon. Won waves fill it. The Bidet sets how much you can keep.
        </Row>
      </>
    ),
  },
  {
    title: 'Round, actions & bonuses',
    body: (
      <>
        <Demo>
          <InfoRow run={demoRun} onItems={noop} onBoss={noop} />
          <TraitsRow run={demoRun} onTrait={noop} />
        </Demo>
        <Row icon={<span className="round-badge">Round 3/{ROUNDS}</span>} title="Round">
          Current wave out of {ROUNDS}. Tap it for every wave: results, Concentration lost and gains of the past ones,
          enemies and modifiers of the coming ones.
        </Row>
        <Row icon={I('ap', '#1b1b1b')} title="Action Points">
          +1 every round (more with the Action trait and the Sink). Unspent ones are kept, up to the Toilet Brush limit.
        </Row>
        <Row icon={I('shop')} title="Items">
          Items held / room in the bag (set by the Sink). Tap to see them.
        </Row>
        <Row icon={<span className="mod-emoji">{BOSS_INFO.bestseller.icon}</span>} title="Boss">
          Tap to see this run's Boss.
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
              <AbilityBadge ability="cheerleader" size={16} /> Ability
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
          With 20 points: Normal 5 · 5 · 5 · 5, Runny 8 · 8 · 2 · 2, Fart 10 · 7 · 2 · 1.
        </p>
      </>
    ),
  },
  {
    title: 'Abilities (1/2)',
    body: (
      <>
        <p className="tut-note">Chosen when a Merdomon joins. Same strength for every size.</p>
        {ABILITIES.slice(0, 8).map((a) => (
          <Row key={a} icon={<AbilityBadge ability={a} size={26} />} title={ABILITY_INFO[a].name}>
            {ABILITY_INFO[a].desc}
          </Row>
        ))}
      </>
    ),
  },
  {
    title: 'Abilities (2/2)',
    body: (
      <>
        <p className="tut-note">Chosen when a Merdomon joins. Same strength for every size.</p>
        {ABILITIES.slice(8).map((a) => (
          <Row key={a} icon={<AbilityBadge ability={a} size={26} />} title={ABILITY_INFO[a].name}>
            {ABILITY_INFO[a].desc}
          </Row>
        ))}
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
            { icon: 'trade', label: 'Trade', cost: { ap: 1 } },
            { icon: 'toilet', label: 'Evacuate', cost: { ap: 1, ms: `${EVACUATE_COST.common}+` } },
            { icon: 'focus', label: 'Concentrate', cost: { ap: 1, ms: `+${CONCENTRATE_GAIN}`, conc: -COSTS.concentrate } },
            { icon: 'shop', label: 'Shop', cost: { ap: 1, tp: COSTS.shop } },
            { icon: 'upgrade', label: 'Build', cost: { ap: BUILD_COST.ap, tp: BUILD_COST.tp[0] } },
          ]}
        />
        <Row icon={I('heal')} title="Heal">
          All Merdomon back to full HP.
        </Row>
        <Row icon={I('toilet')} title="Evacuate">
          Pick 1 of 2 new Merdomon, then its ability (1 of {ABILITY_CHOICES}) and +1.
        </Row>
        <Row icon={I('shop')} title="Shop">
          Buy 1 of 2 items. Bag full? Drop one.
        </Row>
        <Row icon={I('focus')} title="Concentrate">
          Trade 2 Concentration for {CONCENTRATE_GAIN} Poop.
        </Row>
        <Row icon={I('trade')} title="Trade">
          Swap 1 {ii('ap', '#1b1b1b')} for +{TRADE.merdascore} {ii('poop')}, +{TRADE.tp} {ii('tp')} or +{TRADE.stat} to a
          Merdomon stat (max 10).
        </Row>
        <Row icon={I('upgrade')} title="Build">
          Upgrade a structure (or just tap it).
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
            { icon: 'heart', label: 'Farting', cost: { tp: FARTING.tp } },
            { icon: 'flush', label: 'Flush', cost: { tp: COSTS.flush } },
            { icon: 'bonus', label: 'Bonus Action', cost: { tp: COSTS.bonusAction } },
          ]}
        />

        <Row icon={I('flush')} title="Flush">
          Remove a Merdomon and get +1 Concentration.
        </Row>
        <Row icon={I('bonus')} title="Bonus Action">
          +1 {ii('ap', '#1b1b1b')} for this round.
        </Row>
        <Row icon={I('swap')} title="Change the order">
          On the main screen, drag a Merdomon onto another slot. Slot 1 fights first!
        </Row>
        <Row icon={I('heart')} title="Farting">
          +{FARTING.hp} HP to one Merdomon, as often as you like.
        </Row>
        <Row icon={<span className="mod-emoji">💼</span>} title="Bathroom action">
          Office, Public and Home have their own, once per round, for {BATHROOM_ACTION_POOP} {ii('poop')}.
        </Row>
        <Row icon={I('dice')} title="Re-Roll">
          Redraw Evacuate, Shop or abilities for {REROLL_COST} {ii('tp')} (Toilet Brush: free ones).
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
          Big on wave 5, Huge on wave {ROUNDS}, always last in line.
        </Row>
        <p className="tut-note">
          Tap Next Wave to see who is coming. Then <b>Corrupt</b> the wave modifier, or <b>Fight</b>: the battle plays out
          by itself.
        </p>
        <Row icon={I('star', '#f2c94c')} title="Bonus">
          The button next to Next Wave lists everything you get after the wave, and where it comes from.
        </Row>
      </>
    ),
  },
  {
    title: 'Wave modifiers',
    body: (
      <>
        <p className="tut-note">
          Waves {MODIFIER_WAVES.join(', ')} come with a twist, shown on Next Wave and in its recap. Win it for{' '}
          <b>
            +{MODIFIER_AP_REWARD} {ii('ap', '#1b1b1b')}
          </b>{' '}
          next round, or <b>Corrupt</b> it for {MODIFIER_DISABLE_COST} {ii('tp')} or {MODIFIER_DISABLE_CONCENTRATION} {ii('focus')} (and lose the reward).
        </p>
        {MODIFIERS.map((m) => (
          <Row key={m} icon={<span className="mod-emoji">{MODIFIER_INFO[m].icon}</span>} title={MODIFIER_INFO[m].name}>
            {MODIFIER_INFO[m].desc}
          </Row>
        ))}
      </>
    ),
  },
  {
    title: 'Your bathroom',
    body: (
      <>
        <p className="tut-note">
          The six blocks at the bottom set how much you can hold and what you get after every wave (the two badges under the name). Grey = Tier 0, not
          built yet. Build: {BUILD_COST.tp.join(' / ')} {ii('tp')} for Tier 1 / 2 / 3 (
          {BUILD_COST.hammerTp} with the Hammer), always + {BUILD_COST.ap} {ii('ap', '#1b1b1b')}.
        </p>
        <table className="tut-table">
          <thead>
            <tr>
              <th />
              <th className="left">Holds</th>
              <th>T0/1/2/3</th>
              <th className="left">Produces</th>
            </tr>
          </thead>
          <tbody>
            {STRUCTURES.map((id) => (
              <tr key={id}>
                <td>
                  <StructureIcon id={id} tier={2} size={30} />
                </td>
                <td className="left">
                  <b>{STRUCTURE_INFO[id].name}</b>
                  <small>{STRUCTURE_INFO[id].capacity}</small>
                </td>
                <td>{STRUCTURE_INFO[id].capacities.join('/')}</td>
                <td className="left">
                  <small>
                    {STRUCTURE_INFO[id].produce} +{STRUCTURE_INFO[id].production.join('/+')}
                  </small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    ),
  },
  {
    title: 'Bathrooms & journey',
    body: (
      <>
        <p className="tut-note">
          Each bathroom is a <b>journey</b> of {LEVELS.length} levels (Bosses): win a level to unlock the next one with that
          bathroom. Goal: complete every level with every bathroom!
        </p>
        {BATHROOMS.map((id) => {
          const b = BATHROOM_INFO[id];
          return (
            <div key={id} className="tut-bathroom" style={{ background: b.color }}>
              <b>
                {b.icon} {b.name}
              </b>
              <small>
                {ii('tp')}
                {b.tp} {ii('focus')}
                {b.concentration} {ii('poop')}
                {b.poop}
              </small>
              <small className="tut-bathroom-special">
                <b>{b.special.name}</b>: {b.special.desc}
              </small>
            </div>
          );
        })}
        <p className="tut-note">
          Your final score still becomes <b>Toilet Points</b> {ii('toilet', '#f2c94c')}: no use for them yet.
        </p>
      </>
    ),
  },
  {
    title: 'Levels & Bosses (1/3)',
    body: (
      <>
        <p className="tut-note">
          Pick a level at the start: it sets the Boss. Its type gets +1 ATK all run, and it fights on wave 5 (Big) and wave
          10 (Huge). Higher levels toughen every enemy. <b>Win a level to unlock the next</b>; higher levels give more
          Toilet Points (×{LEVEL_REWARD[2]} up to ×{LEVEL_REWARD[5]}).
        </p>
        {LEVELS.filter((l) => l <= 3).map((l) => {
          const b = LEVEL_BOSS[l];
          return (
            <Row
              key={l}
              icon={<EnemyArt size={36} kind={BOSS_INFO[b].kind} rarity="epic" boss bossId={b} />}
              title={`Level ${l} · ${BOSS_INFO[b].name}`}
            >
              {BOSS_INFO[b].runDesc}
              {LEVEL_ENEMY_BONUS[l] > 0 && `, enemies +${LEVEL_ENEMY_BONUS[l]} stat`}. <b>{BOSS_INFO[b].ability}</b>:{' '}
              {BOSS_INFO[b].finalDesc}.
            </Row>
          );
        })}
        <p className="tut-note">
          Final score (no points for winning): Distractions {SCORE.enemy.common}–{SCORE.finalBoss}, Merdomon created{' '}
          {SCORE.merdomon.common}–{SCORE.merdomon.epic}, {SCORE.item} per item, upgrade, Poop and Concentration left,{' '}
          {SCORE.tp} per Toilet Paper.
        </p>
      </>
    ),
  },
  {
    title: 'Levels & Bosses (2/3)',
    body: (
      <>
        <p className="tut-note">Levels 4 and 5 also sabotage your bathroom.</p>
        {LEVELS.filter((l) => l === 4 || l === 5).map((l) => {
          const b = LEVEL_BOSS[l];
          const info = BOSS_INFO[b];
          return (
            <Row
              key={l}
              icon={<EnemyArt size={40} kind={info.kind} rarity="epic" boss bossId={b} />}
              title={`Level ${l} · ${info.name}`}
            >
              {info.runDesc}, enemies +{LEVEL_ENEMY_BONUS[l]} stat. <b>{info.ability}</b> (wave 5): {info.midDesc}.{' '}
              <b>{info.finalAbility ?? info.ability}</b> (wave 10): {info.finalDesc}.
            </Row>
          );
        })}
        <Row icon={<span className="mod-emoji">🔧</span>} title="Off structures">
          They work as Tier 0 and can't be built.
        </Row>
        <Row icon={<span className="mod-emoji">📲</span>} title="Locked slots">
          The Merdomon there sit on the bench and don't fight: drag the ones you want to keep fighting.
        </Row>
        <Row icon={<span className="mod-emoji">🔇</span>} title="Muted trait">
          Shown crossed out: it counts 0 for bonuses.
        </Row>
      </>
    ),
  },
  {
    title: 'Levels & Bosses (3/3)',
    body: (
      <>
        <p className="tut-note">The last two Bosses go after your items and your plans.</p>
        {LEVELS.filter((l) => l >= 6).map((l) => {
          const b = LEVEL_BOSS[l];
          const info = BOSS_INFO[b];
          return (
            <Row
              key={l}
              icon={<EnemyArt size={40} kind={info.kind} rarity="epic" boss bossId={b} />}
              title={`Level ${l} · ${info.name}`}
            >
              {info.runDesc}, enemies +{LEVEL_ENEMY_BONUS[l]} stat. <b>{info.ability}</b> (wave 5): {info.midDesc}.{' '}
              <b>{info.finalAbility ?? info.ability}</b> (wave 10): {info.finalDesc}.
            </Row>
          );
        })}
        <Row icon={<span className="mod-emoji">🧹</span>} title="Sucked-up items">
          Gone for good: they show in the wave results and in the Round recap.
        </Row>
        <Row icon={<span className="mod-emoji">🐈</span>} title="Shuffled team">
          Every round, drag your Merdomon back in order: each move costs Toilet Paper from round 2.
        </Row>
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
              −1 {ii('focus')} for each Distraction still standing
            </p>
          </div>
        </div>
        <p className="tut-note">Then, either way:</p>
        <Row icon={I('tp')}>+1 Toilet Paper for every point of damage dealt.</Row>
        <Row icon={<TraitIcon trait="paper" size={22} />}>Trait and item bonuses are paid out.</Row>
        <Row icon={<MerdomonArt size={26} sad />}>Fallen Merdomon come back with half their HP.</Row>
        <Row icon={<StructureIcon id="holder" tier={2} size={24} />}>Structures produce their bonus.</Row>
        <Row icon={<span className="mod-emoji">🎁</span>}>After wave {GIFT_WAVE}: pick a free item out of 3.</Row>
      </>
    ),
  },
  {
    title: 'Items (1/3)',
    body: (
      <>
        <p className="tut-note">
          2 random items are on sale each round. Each item also counts for its <b>traits</b>.
        </p>
        {ITEMS.slice(0, 5).map((it) => (
          <Row key={it} icon={<ItemIcon item={it} size={24} />} title={ITEM_INFO[it].name}>
            {ITEM_INFO[it].traits.map((t) => (
              <TraitIcon key={t} trait={t} size={14} />
            ))}{' '}
            {ITEM_INFO[it].desc}
          </Row>
        ))}
      </>
    ),
  },
  {
    title: 'Items (2/3)',
    body: (
      <>
        {ITEMS.slice(5, 10).map((it) => (
          <Row key={it} icon={<ItemIcon item={it} size={24} />} title={ITEM_INFO[it].name}>
            {ITEM_INFO[it].traits.map((t) => (
              <TraitIcon key={t} trait={t} size={14} />
            ))}{' '}
            {ITEM_INFO[it].desc}
          </Row>
        ))}
      </>
    ),
  },
  {
    title: 'Items (3/3)',
    body: (
      <>
        {ITEMS.slice(10).map((it) => (
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
  {
    title: 'Testing Privilege',
    body: <TestingPrivilege />,
  },
];

/** Testers with the password can unlock every level of every bathroom. */
function TestingPrivilege() {
  const [asking, setAsking] = useState(false);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'wrong' | 'done'>('idle');

  const submit = async () => {
    const ok = await unlockAllWithPassword(password);
    if (ok) analytics.testingUnlock();
    setStatus(ok ? 'done' : 'wrong');
  };

  return (
    <div className="toilets-list testing">
      <p className="tut-note">If you have the password to unlock all the content, tap the button below.</p>
      {status === 'done' ? (
        <span className="unlocked-tag">
          <Icon name="check" size={16} /> Everything unlocked
        </span>
      ) : asking ? (
        <form
          className="password-form"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <input
            className="sk"
            type="password"
            placeholder="Insert Password"
            aria-label="Insert Password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setStatus('idle');
            }}
          />
          {status === 'wrong' && <small className="wrong">Wrong password</small>}
          <button className="big-btn shadow" type="submit" disabled={!password}>
            <Icon name="check" size={20} /> Confirm
          </button>
        </form>
      ) : (
        <button className="big-btn shadow" onClick={() => setAsking(true)}>
          🔒 Unlock All
        </button>
      )}
    </div>
  );
}

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
        <button className="icon-btn" onClick={onClose} aria-label="Close rules">
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
