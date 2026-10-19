import type { EnemyKind, ItemId, MerdomonKind, Rarity, StatKey, TraitId } from './types';

export const ROUNDS = 10;
export const MAX_STAT = 10;
export const MAX_CONCENTRATION = 10;
export const MAX_MERDASCORE = 20;
export const MAX_TEAM = 6;
export const BASE_AP = 1;
export const STARTER_CHOICES = 3;
export const STARTING_TP = 5;
export const STARTING_MERDASCORE = 5;
/** Max Concentration lost in a single wave. */
export const MAX_CONCENTRATION_LOSS = 3;
export const SHOP_OFFER = 2;
export const EVACUATE_CHOICES = 2;
/** Shop items / Evacuate options with the Game Boy. */
export const GAMEBOY_CHOICES = 3;
export const REROLL_COST = 2;

export const STAT_KEYS: readonly StatKey[] = ['hp', 'atk', 'def', 'spd'];

// Sizes keep the internal ids common / rare / epic.
export const SIZE_NAME: Record<Rarity, string> = { common: 'Small', rare: 'Big', epic: 'Huge' };
/** Total stat points (all four stats together). Merdomon get 1 less and add the last point themselves. */
export const SIZE_TOTAL: Record<Rarity, number> = { common: 10, rare: 15, epic: 20 };
export const RARITY_TRAITS: Record<Rarity, number> = { common: 1, rare: 2, epic: 3 };
export const EVACUATE_COST: Record<Rarity, number> = { common: 5, rare: 10, epic: 20 };

export const MERDOMON_KINDS: readonly MerdomonKind[] = ['normal', 'runny', 'fart'];
export const ENEMY_KINDS: readonly EnemyKind[] = ['phone', 'book', 'console'];

/** How a creature's total is split across its stats (in %), highest share first; shares go to random stats. */
export const KIND_CURVE: Record<MerdomonKind | EnemyKind, readonly number[]> = {
  normal: [30, 30, 20, 20],
  runny: [40, 30, 20, 10],
  fart: [60, 30, 10, 0],
  phone: [30, 30, 20, 20],
  book: [40, 30, 20, 10],
  console: [60, 30, 10, 0],
};

export const KIND_NAME: Record<MerdomonKind | EnemyKind, string> = {
  normal: 'Normal',
  runny: 'Runny',
  fart: 'Fart',
  phone: 'Smartphone',
  book: 'Book',
  console: 'Console',
};

export const COSTS = {
  shop: 10,
  flush: 5,
  bonusAction: 20,
  /** Concentration spent by Concentrate. */
  concentrate: 2,
} as const;

export const CONCENTRATE_GAIN = 4;
export const FLUSH_CONCENTRATION = 1;

/** What 1 AP buys with the Trade action. */
export const TRADE = { merdascore: 2, tp: 5, stat: 1 } as const;

export const TRAITS: readonly TraitId[] = ['paper', 'merdon', 'healthy', 'haste', 'fighter', 'defender', 'action'];
export const TRAIT_THRESHOLDS = [2, 4, 6, 8] as const;
export const TRAIT_VALUES: Record<TraitId, readonly number[]> = {
  paper: [2, 5, 9, 15],
  merdon: [1, 2, 3, 4],
  healthy: [1, 2, 3, 4],
  haste: [1, 2, 3, 4],
  fighter: [1, 2, 3, 4],
  defender: [1, 2, 3, 4],
  action: [1, 1, 2, 2],
};

export const TRAIT_INFO: Record<TraitId, { name: string; desc: string }> = {
  paper: { name: 'Paper', desc: 'Toilet Paper after each wave' },
  merdon: { name: 'Merdon', desc: 'Merdascore after each wave' },
  healthy: { name: 'Healthy', desc: 'HP to all in combat' },
  haste: { name: 'Haste', desc: 'Speed to all in combat' },
  fighter: { name: 'Fighter', desc: 'Attack to all in combat' },
  defender: { name: 'Defender', desc: 'Defense to all in combat' },
  action: { name: 'Action', desc: 'Action Points each round' },
};

export const ITEMS: readonly ItemId[] = [
  'brush',
  'magazine',
  'bidet',
  'shower',
  'window',
  'towel',
  'toothbrush',
  'flipflops',
  'gameboy',
];

/** Each trait listed counts once towards the trait thresholds. */
export const ITEM_INFO: Record<ItemId, { name: string; traits: readonly TraitId[]; desc: string }> = {
  brush: { name: 'Toilet Brush', traits: ['merdon'], desc: '+2 Merdascore after each wave' },
  magazine: { name: 'Magazine', traits: ['healthy'], desc: 'First fallen Merdomon revives at full HP (once per fight)' },
  bidet: { name: 'Bidet', traits: ['defender'], desc: 'Evacuate also gives +1 Concentration' },
  shower: { name: 'Hand Shower', traits: ['paper'], desc: 'Shop, Flush and Bonus Action cost 2 less' },
  window: { name: 'Window', traits: ['haste'], desc: 'Front Merdomon strikes twice on its first attack' },
  towel: { name: 'Towel', traits: ['fighter'], desc: '+5 Toilet Paper after each wave' },
  toothbrush: { name: 'Toothbrush', traits: ['action'], desc: '+1 HP to all in combat for each unspent Action Point' },
  flipflops: { name: 'Flip-Flops', traits: ['action', 'haste'], desc: 'A Merdomon twice as fast as its foe strikes twice each turn' },
  gameboy: { name: 'Game Boy', traits: ['paper', 'merdon'], desc: 'Choose among 3 options (instead of 2) in Shop and Evacuate' },
};

export const BRUSH_MERDASCORE = 2;
export const TOWEL_TP = 5;
export const BIDET_CONCENTRATION = 1;
export const SHOWER_DISCOUNT = 2;

export interface WaveDef {
  common: number;
  rare: number;
  boss?: boolean;
}

/** Level 1 – Home Bathroom. common = Small, rare = Big, the Boss is Huge. */
export const WAVES: readonly WaveDef[] = [
  { common: 1, rare: 0 },
  { common: 2, rare: 0 },
  { common: 2, rare: 1 },
  { common: 3, rare: 1 },
  { common: 4, rare: 1 },
  { common: 3, rare: 2 },
  { common: 3, rare: 3 },
  { common: 2, rare: 4 },
  { common: 0, rare: 6 },
  { common: 0, rare: 5, boss: true },
];
