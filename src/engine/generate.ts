import { ENEMY_KINDS, KIND_CURVE, MAX_STAT, MERDOMON_KINDS, RARITY_TRAITS, SIZE_TOTAL, STAT_KEYS, TRAITS, WAVES } from './data';
import type { Rng } from './rng';
import type { Enemy, Merdomon, Rarity, Stats } from './types';

/**
 * Splits `total` points exactly by `curve` (in %, highest share first), then gives each share to a random stat.
 * Rounding: leftover points go to the largest fractions (ties → higher share). Every stat stays within 1..MAX_STAT.
 */
export function splitStats(rng: Rng, total: number, curve: readonly number[]): Stats {
  const shares = curve.map((p) => (total * p) / 100);
  const vals = shares.map(Math.floor);
  let rest = total - vals.reduce((a, b) => a + b, 0);
  const byFraction = shares
    .map((s, i) => ({ i, f: s - Math.floor(s) }))
    .sort((a, b) => b.f - a.f || a.i - b.i);
  for (const { i } of byFraction) {
    if (rest <= 0) break;
    vals[i]++;
    rest--;
  }

  // Minimum 1: take the missing points from the highest stat.
  for (let i = 0; i < vals.length; i++) {
    while (vals[i] < 1) {
      const max = vals.indexOf(Math.max(...vals));
      vals[max]--;
      vals[i]++;
    }
  }
  // Maximum: excess flows to the next shares in order.
  for (let i = 0; i < vals.length; i++) {
    let excess = vals[i] - MAX_STAT;
    for (let j = 0; excess > 0 && j < vals.length; j++) {
      if (j === i) continue;
      while (excess > 0 && vals[j] < MAX_STAT) {
        vals[j]++;
        vals[i]--;
        excess--;
      }
    }
  }

  const keys = rng.shuffle([...STAT_KEYS]);
  const stats = { hp: 1, atk: 1, def: 1, spd: 1 } as Stats;
  keys.forEach((k, i) => (stats[k] = vals[i]));
  return stats;
}

/** Merdomon are created 1 point short: the player adds the last one (see confirmMerdomon). */
export function createMerdomon(rng: Rng, id: number, rarity: Rarity): Merdomon {
  const kind = rng.pick(MERDOMON_KINDS);
  const stats = splitStats(rng, SIZE_TOTAL[rarity] - 1, KIND_CURVE[kind]);
  const traits = Array.from({ length: RARITY_TRAITS[rarity] }, () => rng.pick(TRAITS));
  return { id, rarity, kind, stats, hp: stats.hp, traits, ability: null };
}

export function createEnemy(rng: Rng, id: number, rarity: Rarity, boss = false): Enemy {
  const kind = rng.pick(ENEMY_KINDS);
  return { id, rarity, kind, stats: splitStats(rng, SIZE_TOTAL[rarity], KIND_CURVE[kind]), boss };
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
