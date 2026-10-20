import { simulateCombat } from './combat';
import {
  ABILITIES,
  ABILITY,
  ABILITY_CHOICES,
  BASE_AP,
  BIDET_CONCENTRATION,
  BOSSES,
  BUILD_COST,
  BRUSH_MERDASCORE,
  CONCENTRATE_GAIN,
  EVACUATE_CHOICES,
  GAMEBOY_CHOICES,
  COSTS,
  EVACUATE_COST,
  FLUSH_CONCENTRATION,
  ITEMS,
  MAX_AP,
  MAX_CONCENTRATION,
  MAX_STAT,
  MAX_TIER,
  MODIFIERS,
  MODIFIER_AP_REWARD,
  MODIFIER_DISABLE_COST,
  MODIFIER_WAVES,
  REROLL_COST,
  ROUNDS,
  SHOP_OFFER,
  SHOWER_DISCOUNT,
  STARTER_CHOICES,
  STARTING_MERDASCORE,
  STAT_KEYS,
  STARTING_TP,
  START_PACK,
  STRUCTURES,
  STRUCTURE_INFO,
  TOWEL_TP,
  TRADE,
} from './data';
import { createEnemy, createMerdomon, createWave } from './generate';
import { Rng } from './rng';
import { apBonus, combatBonus, countTraits, traitValue } from './traits';
import type {
  AbilityId,
  CombatBonus,
  ItemId,
  Merdomon,
  ModifierId,
  Rarity,
  Reward,
  RunState,
  RunStats,
  StartBonusId,
  StatKey,
  StructureId,
} from './types';

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
    modifierWavesWon: 0,
    midBossDefeated: false,
    finalBossDefeated: false,
  };
}

export function newRun(seed = Math.floor(Math.random() * 2 ** 31)): RunState {
  const s: RunState = {
    version: 5,
    phase: 'boss',
    round: 1,
    concentration: MAX_CONCENTRATION,
    tp: STARTING_TP,
    merdascore: STARTING_MERDASCORE,
    ap: 0,
    bonusAp: 0,
    boss: 'demonScroller',
    structures: Object.fromEntries(STRUCTURES.map((id) => [id, 1])) as Record<StructureId, number>,
    team: [],
    items: [],
    shopOffer: [],
    starters: [],
    startOptions: null,
    choices: [],
    pending: null,
    pendingAbilities: [],
    modifiers: {},
    modifierDisabled: false,
    wave: [],
    lastCombat: null,
    rngState: seed,
    nextId: 1,
    stats: emptyStats(),
  };
  s.starters = withRng(s, (rng) =>
    Array.from({ length: STARTER_CHOICES }, () => createMerdomon(rng, s.nextId++, 'common')),
  );
  s.modifiers = withRng(s, (rng) => planModifiers(rng));
  s.boss = withRng(s, (rng) => rng.pick(BOSSES));
  return s;
}

/** After the Boss reveal, the run starts with the starter pick. */
export function beginRun(prev: RunState): RunState {
  if (prev.phase !== 'boss') return prev;
  return { ...clone(prev), phase: 'starter' };
}

// ---------- Structures: capacities ----------

export function capacity(s: RunState, id: StructureId): number {
  return STRUCTURE_INFO[id].capacities[s.structures[id] - 1];
}
export const itemCap = (s: RunState) => capacity(s, 'sink');
export const poopCap = (s: RunState) => capacity(s, 'bidet');
export const tpCap = (s: RunState) => capacity(s, 'holder');
export const teamCap = (s: RunState) => capacity(s, 'toilet');

function addTp(s: RunState, amount: number) {
  s.tp = clamp(s.tp + amount, 0, tpCap(s));
}
function addPoop(s: RunState, amount: number) {
  s.merdascore = clamp(s.merdascore + amount, 0, poopCap(s));
}

/** One distinct modifier for each modifier wave. */
function planModifiers(rng: Rng): Partial<Record<number, ModifierId>> {
  const picks = rng.shuffle([...MODIFIERS]).slice(0, MODIFIER_WAVES.length);
  return Object.fromEntries(MODIFIER_WAVES.map((w, i) => [w, picks[i]]));
}

/** The modifier affecting the current wave (null if none or paid off). */
export function activeModifier(s: RunState): ModifierId | null {
  return s.modifierDisabled ? null : (s.modifiers[s.round] ?? null);
}

function startPreparation(s: RunState) {
  s.phase = 'preparation';
  // Unspent AP carry over, up to MAX_AP.
  s.ap = Math.min(MAX_AP, s.ap + BASE_AP + apBonus(s.team, s.items) + s.bonusAp);
  s.bonusAp = 0;
  s.modifierDisabled = false;
  s.wave = withRng(s, (rng) => createWave(rng, s.round, s.nextId, s.boss, s.stats.concentrationLost));
  s.nextId += s.wave.length;
  if (s.modifiers[s.round] === 'groupChat') {
    const extra = withRng(s, (rng) => createEnemy(rng, s.nextId++, 'common', s.boss));
    s.wave.unshift({ ...extra, extra: true });
  }
  drawShop(s);
}

/** How many options the Shop and Evacuate offer (Game Boy: 3). */
export function choiceCount(s: RunState, base: number): number {
  return s.items.includes('gameboy') ? GAMEBOY_CHOICES : base;
}

function drawShop(s: RunState) {
  const available = ITEMS.filter((i) => !s.items.includes(i));
  s.shopOffer = withRng(s, (rng) => rng.shuffle([...available]).slice(0, choiceCount(s, SHOP_OFFER)));
}

function drawChoices(s: RunState, rarity: Rarity) {
  s.choices = withRng(s, (rng) =>
    Array.from({ length: choiceCount(s, EVACUATE_CHOICES) }, () => createMerdomon(rng, s.nextId++, rarity)),
  );
}

const inPreparation = (s: RunState) => s.phase === 'preparation' && !s.pending && s.choices.length === 0;

/** A new Merdomon waits for its ability (1 of 3) and its +1 point. */
function setPending(s: RunState, m: Merdomon) {
  s.pending = m;
  s.pendingAbilities = withRng(s, (rng) => rng.shuffle([...ABILITIES]).slice(0, ABILITY_CHOICES));
}

// ---------- Starter, new Merdomon, starting bonus ----------

export function chooseStarter(prev: RunState, index: number): RunState {
  if (prev.phase !== 'starter' || prev.pending || !prev.starters[index]) return prev;
  const s = clone(prev);
  setPending(s, s.starters[index]);
  return s;
}

/** Only the starter pick can be undone. */
export function cancelPending(prev: RunState): RunState {
  if (prev.phase !== 'starter' || !prev.pending) return prev;
  const s = clone(prev);
  s.pending = null;
  s.pendingAbilities = [];
  return s;
}

export function canAssignBonus(s: RunState, stat: StatKey): boolean {
  return !!s.pending && s.pending.stats[stat] < MAX_STAT;
}

export function canConfirm(s: RunState, stat: StatKey, ability: AbilityId): boolean {
  return canAssignBonus(s, stat) && s.pendingAbilities.includes(ability);
}

/** Gives the pending Merdomon its ability and +1 point, and adds it to the team. */
export function confirmMerdomon(prev: RunState, stat: StatKey, ability: AbilityId): RunState {
  if (!canConfirm(prev, stat, ability)) return prev;
  const s = clone(prev);
  const m = s.pending!;
  m.stats[stat]++;
  if (stat === 'hp') m.hp++;
  m.ability = ability;
  s.pending = null;
  s.pendingAbilities = [];
  s.team.push(m);
  s.stats.merdomonCreated++;
  if (s.phase === 'starter') {
    s.starters = [];
    s.phase = 'startBonus';
    s.startOptions = withRng(s, (rng) => ({
      item: rng.pick(ITEMS),
      merdomon: createMerdomon(rng, s.nextId++, 'common'),
    }));
  } else if (s.phase === 'startBonus') {
    s.startOptions = null;
    startPreparation(s);
  }
  return s;
}

/** Starting bonus: an item, a Small Merdomon (then ability + +1), or a resources pack. */
export function chooseStartBonus(prev: RunState, choice: StartBonusId): RunState {
  if (prev.phase !== 'startBonus' || !prev.startOptions || prev.pending) return prev;
  const s = clone(prev);
  const options = s.startOptions!;
  if (choice === 'merdomon') {
    setPending(s, options.merdomon);
    return s;
  }
  if (choice === 'item') s.items.push(options.item);
  else {
    addTp(s, START_PACK.tp);
    addPoop(s, START_PACK.merdascore);
    s.bonusAp += START_PACK.ap;
  }
  s.startOptions = null;
  startPreparation(s);
  return s;
}

// ---------- Costs ----------

export function tpCost(s: RunState, action: 'shop' | 'flush' | 'bonusAction'): number {
  return Math.max(0, COSTS[action] - (s.items.includes('shower') ? SHOWER_DISCOUNT : 0));
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
  return inPreparation(s) && s.ap >= 1 && s.team.length < teamCap(s) && s.merdascore >= EVACUATE_COST[rarity];
}

/** Pays and offers 2 (Game Boy: 3) Merdomon to choose from. */
export function evacuate(prev: RunState, rarity: Rarity): RunState {
  if (!canEvacuate(prev, rarity)) return prev;
  const s = clone(prev);
  s.ap--;
  s.merdascore -= EVACUATE_COST[rarity];
  drawChoices(s, rarity);
  if (s.items.includes('waterJet')) s.concentration = Math.min(MAX_CONCENTRATION, s.concentration + BIDET_CONCENTRATION);
  return s;
}

/** The picked option waits in `pending` for its bonus point. */
export function chooseEvacuated(prev: RunState, index: number): RunState {
  if (prev.phase !== 'preparation' || !prev.choices[index]) return prev;
  const s = clone(prev);
  setPending(s, s.choices[index]);
  s.choices = [];
  return s;
}

// ---------- Re-Roll (TP, unlimited) ----------

export function canRerollChoices(s: RunState): boolean {
  return s.phase === 'preparation' && s.choices.length > 0 && s.tp >= REROLL_COST;
}

export function rerollChoices(prev: RunState): RunState {
  if (!canRerollChoices(prev)) return prev;
  const s = clone(prev);
  s.tp -= REROLL_COST;
  drawChoices(s, s.choices[0].rarity);
  return s;
}

export function canRerollShop(s: RunState): boolean {
  return inPreparation(s) && s.tp >= REROLL_COST && ITEMS.some((i) => !s.items.includes(i));
}

export function rerollShop(prev: RunState): RunState {
  if (!canRerollShop(prev)) return prev;
  const s = clone(prev);
  s.tp -= REROLL_COST;
  drawShop(s);
  return s;
}

/** The Sink limits how many items you can hold. */
export const bagFull = (s: RunState) => s.items.length >= itemCap(s);

/** With a full bag, an owned item must be discarded to make room. */
export function canBuy(s: RunState, item: ItemId, discard?: ItemId): boolean {
  const room = !bagFull(s) || (discard !== undefined && s.items.includes(discard));
  return inPreparation(s) && s.ap >= 1 && s.tp >= tpCost(s, 'shop') && s.shopOffer.includes(item) && room;
}

/** Could buy this if there were room (used to offer a discard). */
export function affordable(s: RunState, item: ItemId): boolean {
  return inPreparation(s) && s.ap >= 1 && s.tp >= tpCost(s, 'shop') && s.shopOffer.includes(item);
}

export function buy(prev: RunState, item: ItemId, discard?: ItemId): RunState {
  if (!canBuy(prev, item, discard)) return prev;
  const s = clone(prev);
  s.ap--;
  s.tp -= tpCost(s, 'shop');
  if (bagFull(s)) s.items = s.items.filter((i) => i !== discard);
  s.items.push(item);
  s.shopOffer = s.shopOffer.filter((i) => i !== item);
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
  addPoop(s, CONCENTRATE_GAIN);
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
  return inPreparation(s) && s.ap < MAX_AP && s.tp >= tpCost(s, 'bonusAction');
}

export function bonusAction(prev: RunState): RunState {
  if (!canBonusAction(prev)) return prev;
  const s = clone(prev);
  s.tp -= tpCost(s, 'bonusAction');
  s.ap++;
  return s;
}

// ---------- Trade (1 AP) ----------

export function canTrade(s: RunState): boolean {
  return inPreparation(s) && s.ap >= 1;
}

export function trade(prev: RunState, resource: 'merdascore' | 'tp'): RunState {
  if (!canTrade(prev)) return prev;
  const s = clone(prev);
  s.ap--;
  if (resource === 'merdascore') addPoop(s, TRADE.merdascore);
  else addTp(s, TRADE.tp);
  return s;
}

export function canTradeStat(s: RunState, id?: number, stat?: StatKey): boolean {
  if (!canTrade(s)) return false;
  const upgradable = (m: Merdomon) => STAT_KEYS.some((k) => m.stats[k] < MAX_STAT);
  if (id === undefined) return s.team.some(upgradable);
  const m = s.team.find((x) => x.id === id);
  if (!m) return false;
  return stat === undefined ? upgradable(m) : m.stats[stat] < MAX_STAT;
}

export function tradeStat(prev: RunState, id: number, stat: StatKey): RunState {
  if (!canTradeStat(prev, id, stat)) return prev;
  const s = clone(prev);
  const m = s.team.find((x) => x.id === id)!;
  s.ap--;
  m.stats[stat] += TRADE.stat;
  if (stat === 'hp') m.hp += TRADE.stat;
  return s;
}

// ---------- Build (1 AP + TP) ----------

export function canBuild(s: RunState, id: StructureId): boolean {
  return inPreparation(s) && s.structures[id] < MAX_TIER && s.ap >= BUILD_COST.ap && s.tp >= BUILD_COST.tp;
}

export function build(prev: RunState, id: StructureId): RunState {
  if (!canBuild(prev, id)) return prev;
  const s = clone(prev);
  s.ap -= BUILD_COST.ap;
  s.tp -= BUILD_COST.tp;
  s.structures[id]++;
  return s;
}

// ---------- Wave modifier ----------

export function canDisableModifier(s: RunState): boolean {
  return (
    inPreparation(s) &&
    !!s.modifiers[s.round] &&
    !s.modifierDisabled &&
    s.round < ROUNDS &&
    s.tp >= MODIFIER_DISABLE_COST
  );
}

/** Pays to skip the modifier; its reward is lost too. */
export function disableModifier(prev: RunState): RunState {
  if (!canDisableModifier(prev)) return prev;
  const s = clone(prev);
  s.tp -= MODIFIER_DISABLE_COST;
  s.modifierDisabled = true;
  s.wave = s.wave.filter((e) => !e.extra);
  return s;
}

// ---------- Combat ----------

export function canFight(s: RunState): boolean {
  return inPreparation(s);
}

function applyReward(s: RunState, r: Reward) {
  switch (r.resource) {
    case 'tp':
      addTp(s, r.amount);
      s.stats.tpEarned += r.amount;
      break;
    case 'merdascore':
      addPoop(s, r.amount);
      s.stats.merdascoreEarned += r.amount;
      break;
    case 'concentration':
      s.concentration = clamp(s.concentration + r.amount, 0, MAX_CONCENTRATION);
      if (r.amount < 0) s.stats.concentrationLost -= r.amount;
      break;
    case 'ap':
      s.bonusAp += r.amount;
      break;
  }
}

/** Runs the whole combat, applies its outcome and moves to the 'combat' phase (for the replay). */
export function fight(prev: RunState): RunState {
  if (!canFight(prev)) return prev;
  const s = clone(prev);
  const traits = countTraits(s.team, s.items);
  const toothbrushHp = s.items.includes('toothbrush') ? s.ap : 0;
  const modifier = activeModifier(s);
  const result = withRng(s, (rng) =>
    simulateCombat(s.team, s.wave, s.items, rng, { extraHp: toothbrushHp, modifier, bossId: s.boss }),
  );

  // What changes at combat start, for the pre-fight recap.
  const bonuses: CombatBonus[] = [];
  const statBonus =
    modifier === 'wifiDown' ? { hp: 0, atk: 0, def: 0, spd: 0 } : combatBonus(s.team, s.items);
  const BONUS_TRAIT = { hp: 'healthy', atk: 'fighter', def: 'defender', spd: 'haste' } as const;
  for (const k of STAT_KEYS) if (statBonus[k] > 0) bonuses.push({ source: BONUS_TRAIT[k], stat: k, amount: statBonus[k] });
  if (toothbrushHp > 0) bonuses.push({ source: 'toothbrush', stat: 'hp', amount: toothbrushHp });
  for (const item of ['window', 'flipflops', 'magazine', 'brownTowel', 'yellowTowel', 'whiteTowel'] as const)
    if (s.items.includes(item)) bonuses.push({ source: item });

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
  if (modifier !== 'silentMode') {
    s.team.forEach((m, i) => {
      if (m.ability === 'collector' && result.kills[i] > 0)
        rewards.push({ source: 'collector', resource: 'tp', amount: ABILITY.collectorTp * result.kills[i] });
      if (m.ability === 'fertilizer' && result.hpAfter[i] > 0)
        rewards.push({ source: 'fertilizer', resource: 'merdascore', amount: ABILITY.fertilizerMerdascore });
    });
  }
  if (modifier === 'jackpot') {
    for (const res of ['tp', 'merdascore'] as const) {
      const extra = rewards.filter((r) => r.resource === res && r.amount > 0).reduce((t, r) => t + r.amount, 0);
      if (extra > 0) rewards.push({ source: 'jackpot', resource: res, amount: extra });
    }
  }
  if (modifier && result.won && s.round < ROUNDS)
    rewards.push({ source: modifier, resource: 'ap', amount: MODIFIER_AP_REWARD });
  // Structures produce after every combat.
  const produce = (id: StructureId) => STRUCTURE_INFO[id].production[s.structures[id] - 1];
  if (produce('sink') > 0) rewards.push({ source: 'sink', resource: 'ap', amount: produce('sink') });
  if (produce('bidet') > 0) rewards.push({ source: 'bidet', resource: 'concentration', amount: produce('bidet') });
  if (produce('holder') > 0) rewards.push({ source: 'holder', resource: 'tp', amount: produce('holder') });
  if (produce('toilet') > 0) rewards.push({ source: 'toilet', resource: 'merdascore', amount: produce('toilet') });
  for (const r of rewards) applyReward(s, r);

  // Combat-only bonus HP is dropped; fallen Merdomon come back with half their max HP.
  s.team.forEach((m, i) => {
    const hp = result.hpAfter[i];
    m.hp = hp > 0 ? Math.min(hp, m.stats.hp) : Math.ceil(m.stats.hp / 2);
  });

  s.stats.damageDealt += result.damageDealt;
  s.stats.enemiesDefeated += result.enemiesDefeated;
  s.stats.merdomonFallen += result.merdomonFallen;
  if (result.won) s.stats.wavesWon++;
  else s.stats.wavesLost++;
  if (result.won && modifier) s.stats.modifierWavesWon++;
  s.wave.forEach((e, i) => {
    if (!e.boss || result.enemyHpAfter[i] > 0) return;
    if (e.bossForm === 'mid') s.stats.midBossDefeated = true;
    else s.stats.finalBossDefeated = true;
  });

  s.lastCombat = {
    round: s.round,
    bonuses,
    modifier,
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
