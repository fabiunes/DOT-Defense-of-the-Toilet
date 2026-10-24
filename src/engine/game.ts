import { simulateCombat } from './combat';
import {
  ABILITIES,
  ABILITY,
  ABILITY_CHOICES,
  BASE_AP,
  BATHROOM_INFO,
  BIDET_CONCENTRATION,
  BATHROOMS,
  BUILD_COST,
  GROUP_ADMIN,
  PLUMBER,
  TRAITS,
  WAVES,
  BRUSH_MERDASCORE,
  CONCENTRATE_GAIN,
  EVACUATE_CHOICES,
  GAMEBOY_CHOICES,
  COSTS,
  EVACUATE_COST,
  FARTING,
  FLUSH_CONCENTRATION,
  GIFT_CHOICES,
  GIFT_WAVE,
  ITEMS,
  LEVEL_BOSS,
  LEVEL_ENEMY_BONUS,
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
  STAT_KEYS,
  START_PACK,
  STRUCTURES,
  STRUCTURE_INFO,
  TOWEL_TP,
  TRADE,
} from './data';
import { createEnemy, createMerdomon, createWave } from './generate';
import { Rng } from './rng';
import { activeTraits, apBonus, combatBonus, countTraits, traitValue } from './traits';
import type {
  AbilityId,
  BathroomId,
  BossForm,
  CombatBonus,
  Level,
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
  TraitId,
  WaveLogEntry,
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

export function emptyStats(): RunStats {
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
    itemsObtained: 0,
    merdomonBySize: { common: 0, rare: 0, epic: 0 },
    enemiesBySize: { common: 0, rare: 0, epic: 0 },
    modifierWavesWon: 0,
    midBossDefeated: false,
    finalBossDefeated: false,
  };
}

export function newRun(seed = Math.floor(Math.random() * 2 ** 31)): RunState {
  const s: RunState = {
    version: 8,
    phase: 'boss',
    round: 1,
    concentration: MAX_CONCENTRATION,
    tp: BATHROOM_INFO[BATHROOMS[0]].tp,
    merdascore: BATHROOM_INFO[BATHROOMS[0]].poop,
    ap: 0,
    bonusAp: 0,
    level: 1,
    bathroom: BATHROOMS[0],
    startStructures: { ...BATHROOM_INFO[BATHROOMS[0]].structures },
    giftOffer: [],
    boss: LEVEL_BOSS[1],
    freeRerolls: 0,
    structures: { ...BATHROOM_INFO[BATHROOMS[0]].structures },
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
    waveLog: [],
    rngState: seed,
    nextId: 1,
    stats: emptyStats(),
  };
  s.starters = withRng(s, (rng) =>
    Array.from({ length: STARTER_CHOICES }, () => createMerdomon(rng, s.nextId++, 'common')),
  );
  s.modifiers = withRng(s, (rng) => planModifiers(rng));
  return s;
}

/**
 * The player picks the difficulty level (and with it the Boss) and the starting bathroom; then the starter pick.
 * Whether the bathroom is unlocked is checked by the caller (it lives outside the run).
 */
export function beginRun(prev: RunState, level: Level = 1, bathroom: BathroomId = BATHROOMS[0]): RunState {
  if (prev.phase !== 'boss') return prev;
  const s = clone(prev);
  const b = BATHROOM_INFO[bathroom];
  s.level = level;
  s.boss = LEVEL_BOSS[level];
  s.bathroom = bathroom;
  s.structures = { ...b.structures };
  s.startStructures = { ...b.structures };
  s.tp = b.tp;
  s.merdascore = b.poop;
  s.concentration = Math.min(b.concentration, concentrationCap(s));
  s.phase = 'starter';
  return s;
}

// ---------- Structures: capacities ----------

/** Structures that don't work this run (the Plumber's Water Shut-Off): they act as Tier 0. */
export function isOffline(s: RunState, id: StructureId): boolean {
  return s.boss === 'plumber' && PLUMBER.offline.includes(id);
}

/** The tier a structure works at (0 while offline). */
export function workingTier(s: RunState, id: StructureId): number {
  return isOffline(s, id) ? 0 : s.structures[id];
}

export function capacity(s: RunState, id: StructureId): number {
  return STRUCTURE_INFO[id].capacities[workingTier(s, id)];
}

/** What a structure produces after each wave. */
export function production(s: RunState, id: StructureId): number {
  return STRUCTURE_INFO[id].production[workingTier(s, id)];
}
export const itemCap = (s: RunState) => capacity(s, 'sink');
export const poopCap = (s: RunState) => capacity(s, 'bidet');
export const tpCap = (s: RunState) => capacity(s, 'holder');
/** Merdomon slots locked by the Group Admin (Pinned Message, @everyone). */
export function pinnedSlots(s: RunState): number {
  if (s.boss !== 'groupAdmin' || s.round < GROUP_ADMIN.pinnedFrom) return 0;
  return s.round >= ROUNDS ? GROUP_ADMIN.finalPinned : GROUP_ADMIN.pinned;
}
/** Merdomon that can fight: the Toilet's limit minus the locked slots (at least 1). */
export const teamCap = (s: RunState) => Math.max(1, capacity(s, 'toilet') - pinnedSlots(s));
/** The Merdomon that fight; those beyond the open slots sit out (benched). */
export const activeTeam = (s: RunState) => s.team.slice(0, teamCap(s));

/** Group Admin's Muted: the most common trait in the fighting team gives no bonus (ties change each round). */
export function mutedTrait(s: RunState): TraitId | null {
  if (s.boss !== 'groupAdmin') return null;
  const counts = countTraits(activeTeam(s), s.items);
  const order = TRAITS.map((_, i) => TRAITS[(i + s.round) % TRAITS.length]);
  let best: TraitId | null = null;
  for (const t of order) if (counts[t] > 0 && (best === null || counts[t] > counts[best])) best = t;
  return best;
}
export const concentrationCap = (s: RunState) => capacity(s, 'stall');
export const apCap = (s: RunState) => capacity(s, 'scrubber');

function addConcentration(s: RunState, amount: number) {
  s.concentration = clamp(s.concentration + amount, 0, concentrationCap(s));
}

/** Every TP gained counts as produced for the score, even the part lost over the limit. */
function addTp(s: RunState, amount: number) {
  if (amount > 0) s.stats.tpEarned += amount;
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
/** What a coming wave will bring: enemies by size, the Boss form and the planned modifier (types are drawn later). */
export function wavePlan(s: RunState, round: number): { small: number; big: number; boss: BossForm | null; modifier: ModifierId | null } {
  const def = WAVES[round - 1];
  const modifier = s.modifiers[round] ?? null;
  let small = def.common;
  if (modifier === 'groupChat') small++;
  if (s.boss === 'groupAdmin' && round === ROUNDS) small++;
  return { small, big: def.rare, boss: def.boss ?? null, modifier };
}

export function activeModifier(s: RunState): ModifierId | null {
  return s.modifierDisabled ? null : (s.modifiers[s.round] ?? null);
}

function startPreparation(s: RunState) {
  s.phase = 'preparation';
  // Unspent AP carry over, up to the Toilet Brush's limit.
  s.ap = Math.min(apCap(s), s.ap + BASE_AP + apBonus(activeTeam(s), s.items, mutedTrait(s)) + s.bonusAp);
  s.bonusAp = 0;
  s.freeRerolls = production(s, 'scrubber');
  s.modifierDisabled = false;
  const extraPoints = LEVEL_ENEMY_BONUS[s.level];
  s.wave = withRng(s, (rng) =>
    createWave(rng, s.round, s.nextId, s.boss, s.stats.concentrationLost, extraPoints),
  );
  s.nextId += s.wave.length;
  if (s.modifiers[s.round] === 'groupChat') {
    const extra = withRng(s, (rng) => createEnemy(rng, s.nextId++, 'common', s.boss, extraPoints));
    s.wave.unshift({ ...extra, extra: true });
  }
  // The Group Admin's @everyone: one more Small enemy on the last wave.
  if (s.boss === 'groupAdmin' && s.round === ROUNDS) {
    s.wave.unshift(withRng(s, (rng) => createEnemy(rng, s.nextId++, 'common', s.boss, extraPoints)));
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

const inPreparation = (s: RunState) =>
  s.phase === 'preparation' && !s.pending && s.choices.length === 0 && s.giftOffer.length === 0;

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
  s.stats.merdomonBySize[m.rarity]++;
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
  if (choice === 'item') {
    s.items.push(options.item);
    s.stats.itemsObtained++;
  }
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
  if (s.items.includes('waterJet')) addConcentration(s, BIDET_CONCENTRATION);
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

// ---------- Re-Roll (free ones from the Toilet Brush first, then TP; unlimited) ----------

const canPayReroll = (s: RunState) => s.freeRerolls > 0 || s.tp >= REROLL_COST;
function payReroll(s: RunState) {
  if (s.freeRerolls > 0) s.freeRerolls--;
  else s.tp -= REROLL_COST;
}

export function canRerollChoices(s: RunState): boolean {
  return s.phase === 'preparation' && s.choices.length > 0 && canPayReroll(s);
}

export function rerollChoices(prev: RunState): RunState {
  if (!canRerollChoices(prev)) return prev;
  const s = clone(prev);
  payReroll(s);
  drawChoices(s, s.choices[0].rarity);
  return s;
}

export function canRerollShop(s: RunState): boolean {
  return inPreparation(s) && canPayReroll(s) && ITEMS.some((i) => !s.items.includes(i));
}

export function rerollShop(prev: RunState): RunState {
  if (!canRerollShop(prev)) return prev;
  const s = clone(prev);
  payReroll(s);
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
  s.stats.itemsObtained++;
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

/** Drag and drop on the main screen: onto another Merdomon swaps them, onto an empty slot moves it last. */
export function moveMerdomon(prev: RunState, from: number, to: number): RunState {
  if (!canOrganize(prev) || from === to || !prev.team[from] || to < 0) return prev;
  if (to < prev.team.length) return swap(prev, from, to);
  if (from === prev.team.length - 1) return prev;
  const s = clone(prev);
  const [m] = s.team.splice(from, 1);
  s.team.push(m);
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
  addConcentration(s, FLUSH_CONCENTRATION);
  return s;
}

export function canBonusAction(s: RunState): boolean {
  return inPreparation(s) && s.ap < apCap(s) && s.tp >= tpCost(s, 'bonusAction');
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

/** TP to build the next tier: 20 / 25 / 30 by current tier; 15 for any tier with the Hammer. */
export function buildTp(s: RunState, id: StructureId): number {
  if (s.items.includes('hammer')) return BUILD_COST.hammerTp;
  return BUILD_COST.tp[Math.min(s.structures[id], BUILD_COST.tp.length - 1)];
}

export function canBuild(s: RunState, id: StructureId): boolean {
  return inPreparation(s) && !isOffline(s, id) && s.structures[id] < MAX_TIER && s.ap >= BUILD_COST.ap && s.tp >= buildTp(s, id);
}

export function build(prev: RunState, id: StructureId): RunState {
  if (!canBuild(prev, id)) return prev;
  const s = clone(prev);
  s.ap -= BUILD_COST.ap;
  s.tp -= buildTp(s, id);
  s.structures[id]++;
  return s;
}

// ---------- Farting (free action, TP) ----------

export function canFart(s: RunState, id?: number): boolean {
  if (!inPreparation(s) || s.tp < FARTING.tp) return false;
  const hurt = (m: Merdomon) => m.hp < m.stats.hp;
  return id === undefined ? s.team.some(hurt) : s.team.some((m) => m.id === id && hurt(m));
}

/** Heals one Merdomon a little. Repeatable. */
export function fart(prev: RunState, id: number): RunState {
  if (!canFart(prev, id)) return prev;
  const s = clone(prev);
  const m = s.team.find((x) => x.id === id)!;
  s.tp -= FARTING.tp;
  m.hp = Math.min(m.stats.hp, m.hp + FARTING.hp);
  return s;
}

// ---------- Gift after wave 5 ----------

function drawGift(s: RunState) {
  const available = ITEMS.filter((i) => !s.items.includes(i));
  s.giftOffer = withRng(s, (rng) => rng.shuffle([...available]).slice(0, GIFT_CHOICES));
}

/** Takes one gift item (dropping `discard` if the bag is full). */
export function takeGift(prev: RunState, item: ItemId, discard?: ItemId): RunState {
  if (!prev.giftOffer.includes(item)) return prev;
  const full = prev.items.length >= itemCap(prev);
  if (full && (discard === undefined || !prev.items.includes(discard))) return prev;
  const s = clone(prev);
  if (full) s.items = s.items.filter((i) => i !== discard);
  s.items.push(item);
  s.stats.itemsObtained++;
  s.giftOffer = [];
  return s;
}

export function skipGift(prev: RunState): RunState {
  if (prev.giftOffer.length === 0) return prev;
  return { ...clone(prev), giftOffer: [] };
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
      break;
    case 'merdascore':
      addPoop(s, r.amount);
      s.stats.merdascoreEarned += r.amount;
      break;
    case 'concentration':
      addConcentration(s, r.amount);
      if (r.amount < 0) s.stats.concentrationLost -= r.amount;
      break;
    case 'ap':
      s.bonusAp += r.amount;
      break;
    case 'hp':
      // Applied after the fight's HP are settled (see fight).
      break;
  }
}

// ---------- End-of-wave rewards ----------

/** End-of-wave rewards from traits and items, the same whatever happens in the fight. */
function passiveRewards(s: RunState): Reward[] {
  const traits = activeTraits(activeTeam(s), s.items, mutedTrait(s));
  const rewards: Reward[] = [];
  const paper = traitValue('paper', traits.paper);
  if (paper > 0) rewards.push({ source: 'paper', resource: 'tp', amount: paper });
  const merdon = traitValue('merdon', traits.merdon);
  if (merdon > 0) rewards.push({ source: 'merdon', resource: 'merdascore', amount: merdon });
  if (s.items.includes('plunger')) rewards.push({ source: 'plunger', resource: 'merdascore', amount: BRUSH_MERDASCORE });
  if (s.items.includes('towel')) rewards.push({ source: 'towel', resource: 'tp', amount: TOWEL_TP });
  // The Plumber's Knock Knock / Pipe Burst: Concentration lost on its waves.
  const boss = s.wave.find((e) => e.boss);
  if (s.boss === 'plumber' && boss) {
    const amount = boss.bossForm === 'final' ? PLUMBER.finalConcentration : PLUMBER.midConcentration;
    rewards.push({ source: 'plumber', resource: 'concentration', amount: -amount });
  }
  return rewards;
}

/** Every structure's production after each wave (0 at low tiers is listed too, for the Bonus panel). */
export function structureProduction(s: RunState): Reward[] {
  const resource: Record<StructureId, Reward['resource'] | 'reroll'> = {
    stall: 'hp',
    sink: 'ap',
    bidet: 'concentration',
    scrubber: 'reroll',
    toilet: 'merdascore',
    holder: 'tp',
  };
  return STRUCTURES.filter((id) => resource[id] !== 'reroll').map((id) => ({
    source: id,
    resource: resource[id] as Reward['resource'],
    amount: production(s, id),
  }));
}

/** Structures produce after every combat. */
function structureRewards(s: RunState): Reward[] {
  return structureProduction(s).filter((r) => r.amount > 0);
}

/**
 * What the coming wave will give for sure (traits, items, structures) and, if won, the modifier's AP.
 * Fight-dependent rewards (damage, survivors, Collector, Fertilizer, Jackpot) are described by the UI.
 */
export function previewRewards(s: RunState): { sure: Reward[]; structures: Reward[]; ifWon: Reward[] } {
  const modifier = activeModifier(s);
  const ifWon: Reward[] = [];
  if (modifier && s.round < ROUNDS) ifWon.push({ source: modifier, resource: 'ap', amount: MODIFIER_AP_REWARD });
  return { sure: passiveRewards(s), structures: structureProduction(s), ifWon };
}

/** Runs the whole combat, applies its outcome and moves to the 'combat' phase (for the replay). */
export function fight(prev: RunState): RunState {
  if (!canFight(prev)) return prev;
  const s = clone(prev);
  const toothbrushHp = s.items.includes('toothbrush') ? s.ap : 0;
  const modifier = activeModifier(s);
  const result = withRng(s, (rng) =>
    simulateCombat(activeTeam(s), s.wave, s.items, rng, {
      extraHp: toothbrushHp,
      modifier,
      bossId: s.boss,
      muted: mutedTrait(s),
    }),
  );

  // What changes at combat start, for the pre-fight recap.
  const bonuses: CombatBonus[] = [];
  const statBonus =
    modifier === 'wifiDown' ? { hp: 0, atk: 0, def: 0, spd: 0 } : combatBonus(activeTeam(s), s.items, mutedTrait(s));
  const BONUS_TRAIT = { hp: 'healthy', atk: 'fighter', def: 'defender', spd: 'haste' } as const;
  for (const k of STAT_KEYS) if (statBonus[k] > 0) bonuses.push({ source: BONUS_TRAIT[k], stat: k, amount: statBonus[k] });
  if (toothbrushHp > 0) bonuses.push({ source: 'toothbrush', stat: 'hp', amount: toothbrushHp });
  for (const item of ['window', 'flipflops', 'magazine', 'brownTowel', 'yellowTowel', 'whiteTowel'] as const)
    if (s.items.includes(item)) bonuses.push({ source: item });

  const rewards: Reward[] = [];
  if (result.won) rewards.push({ source: 'survivors', resource: 'merdascore', amount: result.survivors });
  else rewards.push({ source: 'enemies', resource: 'concentration', amount: -result.enemySurvivors });
  if (result.damageDealt > 0) rewards.push({ source: 'damage', resource: 'tp', amount: result.damageDealt });
  rewards.push(...passiveRewards(s));
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
  rewards.push(...structureRewards(s));
  const produce = (id: StructureId) => production(s, id);
  for (const r of rewards) applyReward(s, r);

  // The Round recap: who was faced, the outcome, Concentration lost and what was gained.
  const gains: WaveLogEntry['gains'] = {};
  for (const r of rewards) if (r.amount > 0) gains[r.resource] = (gains[r.resource] ?? 0) + r.amount;
  const concentrationLost = rewards
    .filter((r) => r.resource === 'concentration' && r.amount < 0)
    .reduce((t, r) => t - r.amount, 0);
  s.waveLog = [
    ...(s.waveLog ?? []),
    {
      round: s.round,
      won: result.won,
      modifier,
      enemies: s.wave.map((e, i) => ({ kind: e.kind, rarity: e.rarity, boss: e.boss, defeated: result.enemyHpAfter[i] <= 0 })),
      concentrationLost,
      gains,
    },
  ];

  // Combat-only bonus HP is dropped; fallen Merdomon come back with half their max HP.
  s.team.forEach((m, i) => {
    // Benched Merdomon (locked slots) did not fight: their HP stay.
    const hp = i < result.hpAfter.length ? result.hpAfter[i] : m.hp;
    m.hp = hp > 0 ? Math.min(hp, m.stats.hp) : Math.ceil(m.stats.hp / 2);
    // The Shower heals everyone a little after each wave.
    m.hp = Math.min(m.stats.hp, m.hp + produce('stall'));
  });

  s.stats.damageDealt += result.damageDealt;
  s.stats.enemiesDefeated += result.enemiesDefeated;
  s.stats.merdomonFallen += result.merdomonFallen;
  if (result.won) s.stats.wavesWon++;
  else s.stats.wavesLost++;
  if (result.won && modifier) s.stats.modifierWavesWon++;
  s.wave.forEach((e, i) => {
    if (result.enemyHpAfter[i] > 0) return;
    if (!e.boss) s.stats.enemiesBySize[e.rarity]++;
    else if (e.bossForm === 'mid') s.stats.midBossDefeated = true;
    else s.stats.finalBossDefeated = true;
  });

  s.lastCombat = {
    round: s.round,
    bossId: s.boss,
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
    if (s.round === GIFT_WAVE + 1) drawGift(s);
  }
  return s;
}
