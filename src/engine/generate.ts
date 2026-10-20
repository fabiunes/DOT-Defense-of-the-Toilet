import {
  BOSS_INFO,
  BOSS_TOTAL,
  BOSS_TYPE_ATK,
  ENEMY_KINDS,
  KIND_CURVE,
  MAX_STAT,
  MERDOMON_KINDS,
  RARITY_TRAITS,
  SIZE_TOTAL,
  STAT_KEYS,
  TRAITS,
  WAVES,
} from './data';
import type { Rng } from './rng';
import type { BossForm, BossId, Enemy, Merdomon, Rarity, Stats } from './types';

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

/** `extraPoints` comes from the difficulty level. */
export function createEnemy(rng: Rng, id: number, rarity: Rarity, bossId?: BossId, extraPoints = 0): Enemy {
  const kind = rng.pick(ENEMY_KINDS);
  const stats = splitStats(rng, SIZE_TOTAL[rarity] + extraPoints, KIND_CURVE[kind]);
  const enemy: Enemy = { id, rarity, kind, stats, boss: false };
  return bossId ? withBossAura(enemy, bossId) : enemy;
}

/** Run-wide Boss modifier: enemies of the Boss's type get extra ATK. */
export function withBossAura(e: Enemy, bossId: BossId): Enemy {
  if (e.kind === BOSS_INFO[bossId].kind) e.stats.atk += BOSS_TYPE_ATK;
  return e;
}

/** The run's Boss in its medium (wave 5) or final (wave 10) form. */
export function createBoss(rng: Rng, id: number, bossId: BossId, form: BossForm, concentrationLost: number): Enemy {
  const { kind } = BOSS_INFO[bossId];
  const stats = splitStats(rng, BOSS_TOTAL[form], KIND_CURVE[kind]);
  if (bossId === 'demonScroller') stats.hp += concentrationLost;
  const boss: Enemy = { id, rarity: form === 'mid' ? 'rare' : 'epic', kind, stats, boss: true, bossForm: form };
  return withBossAura(boss, bossId);
}

/** Enemies in random order; the Boss (if any) is always last. */
export function createWave(
  rng: Rng,
  round: number,
  firstId: number,
  bossId: BossId,
  concentrationLost = 0,
  extraPoints = 0,
): Enemy[] {
  const def = WAVES[round - 1];
  let id = firstId;
  const wave: Enemy[] = [];
  for (let i = 0; i < def.common; i++) wave.push(createEnemy(rng, id++, 'common', bossId, extraPoints));
  for (let i = 0; i < def.rare; i++) wave.push(createEnemy(rng, id++, 'rare', bossId, extraPoints));
  rng.shuffle(wave);
  if (def.boss) wave.push(createBoss(rng, id++, bossId, def.boss, concentrationLost));
  return wave;
}
