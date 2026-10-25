// The guided Tutorial Game: a prepared 2-round run in Home Bathroom A, always the same and easy to win.

import { beginRun, newRun } from './game';
import type { Merdomon, RunState, Stats } from './types';

export const TUTORIAL_ROUNDS = 2;
/** Toilet Points given once, the first time the tutorial is completed. */
export const TUTORIAL_REWARD = 500;
const TUTORIAL_SEED = 2024;

/** The three starters, so the guide always shows the same choice. Totals 9 (+1 chosen by the player). */
const STARTERS: Pick<Merdomon, 'kind' | 'stats' | 'traits'>[] = [
  { kind: 'normal', stats: { hp: 3, atk: 2, def: 2, spd: 2 }, traits: ['paper'] },
  { kind: 'liquid', stats: { hp: 4, atk: 3, def: 1, spd: 1 }, traits: ['paper'] },
  { kind: 'fart', stats: { hp: 1, atk: 5, def: 2, spd: 1 }, traits: ['haste'] },
];

/** Tutorial enemies: weak, so both waves are won. */
const ENEMY_STATS: Stats = { hp: 3, atk: 1, def: 1, spd: 1 };
const WAVE_SIZE: Record<number, number> = { 1: 1, 2: 2 };
/** Toilet Paper at the start of round 2, enough to try both the Shop and Build. */
const ROUND_2_TP = 40;

export function tutorialRun(): RunState {
  const s = beginRun(newRun(TUTORIAL_SEED), 1, 'home');
  s.modifiers = {};
  // Home starts without Poop: the guide needs 5 (with Supplies) for its Evacuate.
  s.merdascore = 5;
  s.starters = s.starters.map((m, i) => ({ ...m, ...STARTERS[i], rarity: 'common', hp: STARTERS[i].stats.hp }));
  return s;
}

const isEased = (s: RunState) =>
  s.wave.length === (WAVE_SIZE[s.round] ?? s.wave.length) &&
  s.wave.every((e) => e.stats.atk === ENEMY_STATS.atk && e.stats.hp === ENEMY_STATS.hp);

/**
 * Applied after every tutorial action: when a round's preparation starts, its wave becomes weak
 * (and round 2 gets enough Toilet Paper for the Shop and a Build).
 */
export function tutorialAdjust(s: RunState): RunState {
  if (s.phase !== 'preparation' || s.wave.length === 0 || isEased(s)) return s;
  const next: RunState = {
    ...s,
    wave: s.wave.slice(0, WAVE_SIZE[s.round] ?? 1).map((e) => ({ ...e, rarity: 'common', stats: { ...ENEMY_STATS } })),
  };
  if (s.round === 2) next.tp = Math.max(s.tp, ROUND_2_TP);
  return next;
}
