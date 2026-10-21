import { ITEM_INFO, TRAITS, TRAIT_THRESHOLDS, TRAIT_VALUES } from './data';
import type { ItemId, Merdomon, Stats, TraitId } from './types';

export function countTraits(team: readonly Merdomon[], items: readonly ItemId[]): Record<TraitId, number> {
  const counts = Object.fromEntries(TRAITS.map((t) => [t, 0])) as Record<TraitId, number>;
  for (const m of team) for (const t of m.traits) counts[t]++;
  for (const i of items) for (const t of ITEM_INFO[i].traits) counts[t]++;
  return counts;
}

/** 0 = inactive, 1..4 = bonus level. */
export function traitTier(count: number): number {
  let tier = 0;
  for (const threshold of TRAIT_THRESHOLDS) if (count >= threshold) tier++;
  return tier;
}

export function traitValue(trait: TraitId, count: number): number {
  const tier = traitTier(count);
  return tier === 0 ? 0 : TRAIT_VALUES[trait][tier - 1];
}

/** Trait counts for bonuses: a muted trait (Group Admin) counts 0. */
export function activeTraits(team: readonly Merdomon[], items: readonly ItemId[], muted: TraitId | null = null) {
  const c = countTraits(team, items);
  if (muted) c[muted] = 0;
  return c;
}

/** Stat bonus applied to every Merdomon at the start of combat. */
export function combatBonus(team: readonly Merdomon[], items: readonly ItemId[], muted: TraitId | null = null): Stats {
  const c = activeTraits(team, items, muted);
  return {
    hp: traitValue('healthy', c.healthy),
    atk: traitValue('fighter', c.fighter),
    def: traitValue('defender', c.defender),
    spd: traitValue('haste', c.haste),
  };
}

/** Extra Action Points each round from the Action trait. */
export function apBonus(team: readonly Merdomon[], items: readonly ItemId[], muted: TraitId | null = null): number {
  return traitValue('action', activeTraits(team, items, muted).action);
}
