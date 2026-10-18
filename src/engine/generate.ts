import { MAX_STAT, RARITY_POINTS, RARITY_TRAITS, STAT_KEYS, TRAITS, WAVES } from './data';
import type { Rng } from './rng';
import type { Enemy, Merdomon, Rarity, Stats } from './types';

/** Every stat starts at 1; `points` extra points are spread randomly, never above MAX_STAT. */
export function rollStats(rng: Rng, points: number): Stats {
  const stats: Stats = { hp: 1, atk: 1, def: 1, spd: 1 };
  for (let i = 0; i < points; i++) {
    const open = STAT_KEYS.filter((k) => stats[k] < MAX_STAT);
    if (open.length === 0) break;
    stats[rng.pick(open)]++;
  }
  return stats;
}

export function createMerdomon(rng: Rng, id: number, rarity: Rarity): Merdomon {
  const stats = rollStats(rng, RARITY_POINTS[rarity]);
  const traits = Array.from({ length: RARITY_TRAITS[rarity] }, () => rng.pick(TRAITS));
  return { id, rarity, stats, hp: stats.hp, traits, ability: 'generic' };
}

export function createEnemy(rng: Rng, id: number, rarity: Rarity, boss = false): Enemy {
  return { id, rarity, stats: rollStats(rng, RARITY_POINTS[rarity]), ability: 'generic', boss };
}

/** Enemies in random order; the Boss (if any) is always last. */
export function createWave(rng: Rng, round: number, firstId: number): Enemy[] {
  const def = WAVES[round - 1];
  let id = firstId;
  const wave: Enemy[] = [];
  for (let i = 0; i < def.common; i++) wave.push(createEnemy(rng, id++, 'common'));
  for (let i = 0; i < def.rare; i++) wave.push(createEnemy(rng, id++, 'rare'));
  rng.shuffle(wave);
  if (def.boss) wave.push(createEnemy(rng, id++, 'epic', true));
  return wave;
}
