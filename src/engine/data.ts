import type { ItemId, Rarity, StatKey, TraitId } from './types';

export const ROUNDS = 10;
export const MAX_STAT = 10;
export const MAX_CONCENTRATION = 10;
export const MAX_MERDASCORE = 20;
export const MAX_TEAM = 6;
export const BASE_AP = 1;
export const STARTER_CHOICES = 3;

export const STAT_KEYS: readonly StatKey[] = ['hp', 'atk', 'def', 'spd'];

export const RARITY_POINTS: Record<Rarity, number> = { common: 5, rare: 10, epic: 15 };
export const RARITY_TRAITS: Record<Rarity, number> = { common: 1, rare: 2, epic: 3 };
export const EVACUATE_COST: Record<Rarity, number> = { common: 5, rare: 10, epic: 20 };

export const COSTS = {
  shop: 10,
  flush: 5,
  bonusAction: 20,
  upgrade: 10,
  /** Concentration spent by Concentrate. */
  concentrate: 2,
} as const;

export const CONCENTRATE_GAIN = 4;
export const FLUSH_CONCENTRATION = 1;

export const TRAITS: readonly TraitId[] = ['paper', 'merdon', 'healthy', 'haste', 'fighter', 'defender'];
export const TRAIT_THRESHOLDS = [2, 4, 6, 8] as const;
export const TRAIT_VALUES: Record<TraitId, readonly number[]> = {
  paper: [2, 5, 9, 15],
  merdon: [1, 2, 3, 4],
  healthy: [1, 2, 3, 4],
  haste: [1, 2, 3, 4],
  fighter: [1, 2, 3, 4],
  defender: [1, 2, 3, 4],
};

export const TRAIT_INFO: Record<TraitId, { name: string; desc: string }> = {
  paper: { name: 'Paper', desc: 'Toilet Paper after each wave' },
  merdon: { name: 'Merdon', desc: 'Merdascore after each wave' },
  healthy: { name: 'Healthy', desc: 'HP to all in combat' },
  haste: { name: 'Haste', desc: 'Speed to all in combat' },
  fighter: { name: 'Fighter', desc: 'Attack to all in combat' },
  defender: { name: 'Defender', desc: 'Defense to all in combat' },
};

export const ITEMS: readonly ItemId[] = ['brush', 'magazine', 'bidet', 'shower', 'window', 'towel'];

export const ITEM_INFO: Record<ItemId, { name: string; trait: TraitId; desc: string }> = {
  brush: { name: 'Toilet Brush', trait: 'merdon', desc: '+2 Merdascore after each wave' },
  magazine: { name: 'Magazine', trait: 'healthy', desc: 'First fallen Merdomon revives at full HP (once per fight)' },
  bidet: { name: 'Bidet', trait: 'defender', desc: 'Evacuate also gives +1 Concentration' },
  shower: { name: 'Hand Shower', trait: 'paper', desc: 'Flush, Bonus Action and Upgrade cost 1 less' },
  window: { name: 'Window', trait: 'haste', desc: 'Front Merdomon strikes twice on its first attack' },
  towel: { name: 'Towel', trait: 'fighter', desc: '+5 Toilet Paper after each wave' },
};

export const BRUSH_MERDASCORE = 2;
export const TOWEL_TP = 5;
export const BIDET_CONCENTRATION = 1;
export const SHOWER_DISCOUNT = 1;

export interface WaveDef {
  common: number;
  rare: number;
  boss?: boolean;
}

/** Level 1 – Home Bathroom. */
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
