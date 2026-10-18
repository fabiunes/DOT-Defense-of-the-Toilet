import { simulateCombat } from './combat';
import {
  BASE_AP,
  BIDET_CONCENTRATION,
  BRUSH_MERDASCORE,
  CONCENTRATE_GAIN,
  COSTS,
  EVACUATE_COST,
  FLUSH_CONCENTRATION,
  MAX_CONCENTRATION,
  MAX_MERDASCORE,
  MAX_STAT,
  MAX_TEAM,
  ROUNDS,
  SHOWER_DISCOUNT,
  STARTER_CHOICES,
  TOWEL_TP,
} from './data';
import { createMerdomon, createWave } from './generate';
import { Rng } from './rng';
import { countTraits, traitValue } from './traits';
import type { ItemId, Rarity, Reward, RunState, RunStats, StatKey } from './types';

// Every action is a pure function: it returns a new state, or the same state if the action isn't allowed.

const clone = (s: RunState): RunState => structuredClone(s);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function withRng<T>(s: RunState, fn: (rng: Rng) => T): T {
  const rng = new Rng(s.rngState);
  const result = fn(rng);
  s.rngState = rng.state;
  return result;
}

function emptyStats(): RunStats {
  return {
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
  };
}

export function newRun(seed = Math.floor(Math.random() * 2 ** 31)): RunState {
  const s: RunState = {
    version: 1,
    phase: 'starter',
    round: 1,
    concentration: MAX_CONCENTRATION,
    tp: 0,
    merdascore: 0,
    ap: BASE_AP,
    team: [],
    items: [],
    starters: [],
    pending: null,
    wave: [],
    lastCombat: null,
    rngState: seed,
    nextId: 1,
    stats: emptyStats(),
  };
  s.starters = withRng(s, (rng) =>
    Array.from({ length: STARTER_CHOICES }, () => createMerdomon(rng, s.nextId++, 'common')),
  );
  return s;
}

function startPreparation(s: RunState) {
  s.phase = 'preparation';
  s.ap = BASE_AP;
  s.wave = withRng(s, (rng) => createWave(rng, s.round, s.nextId));
  s.nextId += s.wave.length;
}

const inPreparation = (s: RunState) => s.phase === 'preparation' && !s.pending;

// ---------- Starter & bonus point ----------

export function chooseStarter(prev: RunState, index: number): RunState {
  if (prev.phase !== 'starter' || prev.pending || !prev.starters[index]) return prev;
  const s = clone(prev);
  s.pending = s.starters[index];
  return s;
}

/** Only the starter pick can be undone. */
export function cancelPending(prev: RunState): RunState {
  if (prev.phase !== 'starter' || !prev.pending) return prev;
  const s = clone(prev);
  s.pending = null;
  return s;
}

export function canAssignBonus(s: RunState, stat: StatKey): boolean {
  return !!s.pending && s.pending.stats[stat] < MAX_STAT;
}

export function assignBonusPoint(prev: RunState, stat: StatKey): RunState {
  if (!canAssignBonus(prev, stat)) return prev;
  const s = clone(prev);
  const m = s.pending!;
  m.stats[stat]++;
  if (stat === 'hp') m.hp++;
  s.pending = null;
  s.team.push(m);
  s.stats.merdomonCreated++;
  if (s.phase === 'starter') {
    s.starters = [];
    startPreparation(s);
  }
  return s;
}

// ---------- Costs ----------

export function tpCost(s: RunState, action: 'flush' | 'bonusAction' | 'upgrade'): number {
  return COSTS[action] - (s.items.includes('shower') ? SHOWER_DISCOUNT : 0);
}

// ---------- AP actions ----------

export function canHeal(s: RunState): boolean {
  return inPreparation(s) && s.ap >= 1 && s.team.some((m) => m.hp < m.stats.hp);
}

export function heal(prev: RunState): RunState {
  if (!canHeal(prev)) return prev;
  const s = clone(prev);
  s.ap--;
  for (const m of s.team) m.hp = m.stats.hp;
  return s;
}

export function canEvacuate(s: RunState, rarity: Rarity): boolean {
  return inPreparation(s) && s.ap >= 1 && s.team.length < MAX_TEAM && s.merdascore >= EVACUATE_COST[rarity];
}

/** Creates a Merdomon that waits in `pending` for its bonus point. */
export function evacuate(prev: RunState, rarity: Rarity): RunState {
  if (!canEvacuate(prev, rarity)) return prev;
  const s = clone(prev);
  s.ap--;
  s.merdascore -= EVACUATE_COST[rarity];
  s.pending = withRng(s, (rng) => createMerdomon(rng, s.nextId++, rarity));
  if (s.items.includes('bidet')) s.concentration = Math.min(MAX_CONCENTRATION, s.concentration + BIDET_CONCENTRATION);
  return s;
}

export function canBuy(s: RunState, item: ItemId): boolean {
  return inPreparation(s) && s.ap >= 1 && s.tp >= COSTS.shop && !s.items.includes(item);
}

export function buy(prev: RunState, item: ItemId): RunState {
  if (!canBuy(prev, item)) return prev;
  const s = clone(prev);
  s.ap--;
  s.tp -= COSTS.shop;
  s.items.push(item);
  s.stats.itemsBought++;
  return s;
}

export function canConcentrate(s: RunState): boolean {
  return inPreparation(s) && s.ap >= 1 && s.concentration > COSTS.concentrate;
}

export function concentrate(prev: RunState): RunState {
  if (!canConcentrate(prev)) return prev;
  const s = clone(prev);
  s.ap--;
  s.concentration -= COSTS.concentrate;
  s.merdascore = Math.min(MAX_MERDASCORE, s.merdascore + CONCENTRATE_GAIN);
  return s;
}

// ---------- Free actions ----------

export function canOrganize(s: RunState): boolean {
  return inPreparation(s) && s.team.length > 1;
}

export function swap(prev: RunState, a: number, b: number): RunState {
  if (!canOrganize(prev) || a === b || !prev.team[a] || !prev.team[b]) return prev;
  const s = clone(prev);
  [s.team[a], s.team[b]] = [s.team[b], s.team[a]];
  return s;
}

export function canFlush(s: RunState): boolean {
  return inPreparation(s) && s.team.length > 1 && s.tp >= tpCost(s, 'flush');
}

export function flush(prev: RunState, id: number): RunState {
  if (!canFlush(prev) || !prev.team.some((m) => m.id === id)) return prev;
  const s = clone(prev);
  s.tp -= tpCost(s, 'flush');
  s.team = s.team.filter((m) => m.id !== id);
  s.concentration = Math.min(MAX_CONCENTRATION, s.concentration + FLUSH_CONCENTRATION);
  return s;
}

export function canBonusAction(s: RunState): boolean {
  return inPreparation(s) && s.tp >= tpCost(s, 'bonusAction');
}

export function bonusAction(prev: RunState): RunState {
  if (!canBonusAction(prev)) return prev;
  const s = clone(prev);
  s.tp -= tpCost(s, 'bonusAction');
  s.ap++;
  return s;
}

export function canUpgrade(s: RunState, id?: number, stat?: StatKey): boolean {
  if (!inPreparation(s) || s.tp < tpCost(s, 'upgrade')) return false;
  if (id === undefined) return s.team.length > 0;
  const m = s.team.find((x) => x.id === id);
  if (!m) return false;
  return stat === undefined || m.stats[stat] < MAX_STAT;
}

export function upgrade(prev: RunState, id: number, stat: StatKey): RunState {
  if (!canUpgrade(prev, id, stat)) return prev;
  const s = clone(prev);
  const m = s.team.find((x) => x.id === id)!;
  s.tp -= tpCost(s, 'upgrade');
  m.stats[stat]++;
  if (stat === 'hp') m.hp++;
  return s;
}

// ---------- Combat ----------

export function canFight(s: RunState): boolean {
  return inPreparation(s);
}

function applyReward(s: RunState, r: Reward) {
  switch (r.resource) {
    case 'tp':
      s.tp = Math.max(0, s.tp + r.amount);
      s.stats.tpEarned += r.amount;
      break;
    case 'merdascore':
      s.merdascore = clamp(s.merdascore + r.amount, 0, MAX_MERDASCORE);
      s.stats.merdascoreEarned += r.amount;
      break;
    case 'concentration':
      s.concentration = clamp(s.concentration + r.amount, 0, MAX_CONCENTRATION);
      if (r.amount < 0) s.stats.concentrationLost -= r.amount;
      break;
  }
}

/** Runs the whole combat, applies its outcome and moves to the 'combat' phase (for the replay). */
export function fight(prev: RunState): RunState {
  if (!canFight(prev)) return prev;
  const s = clone(prev);
  const traits = countTraits(s.team, s.items);
  const result = withRng(s, (rng) => simulateCombat(s.team, s.wave, s.items, rng));

  const rewards: Reward[] = [];
  if (result.won) rewards.push({ source: 'survivors', resource: 'merdascore', amount: result.survivors });
  else rewards.push({ source: 'enemies', resource: 'concentration', amount: -result.enemySurvivors });
  if (result.damageDealt > 0) rewards.push({ source: 'damage', resource: 'tp', amount: result.damageDealt });
  const paper = traitValue('paper', traits.paper);
  if (paper > 0) rewards.push({ source: 'paper', resource: 'tp', amount: paper });
  const merdon = traitValue('merdon', traits.merdon);
  if (merdon > 0) rewards.push({ source: 'merdon', resource: 'merdascore', amount: merdon });
  if (s.items.includes('brush')) rewards.push({ source: 'brush', resource: 'merdascore', amount: BRUSH_MERDASCORE });
  if (s.items.includes('towel')) rewards.push({ source: 'towel', resource: 'tp', amount: TOWEL_TP });
  for (const r of rewards) applyReward(s, r);

  // Combat-only bonus HP is dropped; fallen Merdomon come back with 1 HP.
  s.team.forEach((m, i) => {
    const hp = result.hpAfter[i];
    m.hp = hp > 0 ? Math.min(hp, m.stats.hp) : 1;
  });

  s.stats.damageDealt += result.damageDealt;
  s.stats.enemiesDefeated += result.enemiesDefeated;
  s.stats.merdomonFallen += result.merdomonFallen;
  if (result.won) s.stats.wavesWon++;
  else s.stats.wavesLost++;

  s.lastCombat = {
    round: s.round,
    won: result.won,
    events: result.events,
    player: result.player,
    enemies: result.enemies,
    rewards,
    survivors: result.survivors,
    enemySurvivors: result.enemySurvivors,
  };
  s.phase = 'combat';
  return s;
}

/** After the combat replay: next round, game over or victory. */
export function continueAfterCombat(prev: RunState): RunState {
  if (prev.phase !== 'combat') return prev;
  const s = clone(prev);
  if (s.concentration <= 0) s.phase = 'gameover';
  else if (s.round >= ROUNDS) s.phase = s.lastCombat?.won ? 'victory' : 'gameover';
  else {
    s.round++;
    startPreparation(s);
  }
  return s;
}
