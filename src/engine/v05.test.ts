import { beforeEach, describe, expect, it } from 'vitest';
import { HISTORY_MAX, LEVEL_BOSS, SIZE_TOTAL } from './data';
import * as G from './game';
import { createWave } from './generate';
import { Rng } from './rng';
import { loadBest, loadHistory, recordRun } from './save';
import type { Level, RunState, Stats } from './types';

function prep(level: Level = 1, patch: Partial<RunState> = {}): RunState {
  let s = G.chooseStarter(G.beginRun(G.newRun(12), level, 'home'), 0);
  s = G.confirmMerdomon(s, 'hp', s.pendingAbilities[0]);
  s = G.chooseStartBonus(s, 'item');
  return { ...s, items: [], ap: 1, ...patch };
}

const total = (e: { stats: Stats }) => e.stats.hp + e.stats.atk + e.stats.def + e.stats.spd;

describe('difficulty levels', () => {
  it('pick the Boss: 1 Bestseller, 2 StreamDeck, 3 Demon Scroller', () => {
    expect(G.newRun(1).phase).toBe('boss');
    for (const level of [1, 2, 3] as Level[]) {
      const s = G.beginRun(G.newRun(1), level, 'home');
      expect(s).toMatchObject({ level, boss: LEVEL_BOSS[level], phase: 'starter' });
    }
  });

  it('give normal enemies +0 / +1 / +2 stat points', () => {
    for (const extra of [0, 1, 2]) {
      const wave = createWave(new Rng(3), 2, 1, 'bestseller', 0, extra);
      // Books get +1 ATK from the Bestseller.
      for (const e of wave) expect(total(e)).toBe(SIZE_TOTAL.common + extra + (e.kind === 'book' ? 1 : 0));
    }
    expect(prep(3).wave.every((e) => total(e) >= SIZE_TOTAL.common + 2)).toBe(true);
  });
});

describe('Shower and Toilet Brush', () => {
  it('Shower raises max Concentration and heals the team after each wave', () => {
    const s = prep(1, { structures: { stall: 3, sink: 1, bidet: 3, scrubber: 1, toilet: 1, holder: 1 }, concentration: 13 });
    expect(G.concentrationCap(s)).toBe(14);
    s.team[0].hp = 1;
    s.team[0].stats.hp = 9;
    s.team[0].stats.atk = 10;
    s.team[0].stats.spd = 10;
    const after = G.fight(s);
    expect(after.lastCombat!.rewards).toContainEqual({ source: 'stall', resource: 'hp', amount: 2 });
    expect(after.concentration).toBe(14); // Bidet +2, capped by the Shower
    expect(after.team[0].hp).toBeGreaterThanOrEqual(3);
  });

  it('Toilet Brush gives free Re-Rolls each round, used before TP', () => {
    let s = prep(1, { structures: { stall: 1, sink: 1, bidet: 1, scrubber: 2, toilet: 1, holder: 1 }, tp: 0 });
    s = G.continueAfterCombat(G.fight({ ...s, concentration: 10 }));
    expect(s.freeRerolls).toBe(2);
    s = G.rerollShop(G.rerollShop(s));
    expect(s.freeRerolls).toBe(0);
    expect(G.canRerollShop(s)).toBe(s.tp >= 2);
  });
});

describe('Plunger', () => {
  it('replaces the Toilet Brush item: +2 Poop after each wave', () => {
    const after = G.fight(prep(1, { items: ['plunger'] }));
    expect(after.lastCombat!.rewards).toContainEqual({ source: 'plunger', resource: 'merdascore', amount: 2 });
  });
});

describe('history', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    } as Storage;
  });

  it('records finished runs once, newest first, with a record per level', () => {
    const run: RunState = { ...prep(2), phase: 'victory' };
    expect(recordRun(run, 'a').previousBest).toBe(0);
    expect(recordRun(run, 'a').previousBest).toBe(0); // same run, not recorded twice
    expect(loadHistory()).toHaveLength(1);
    expect(loadHistory()[0]).toMatchObject({ level: 2, boss: 'streamDeck', victory: true });
    expect(loadBest(2)).toBe(loadHistory()[0].score);
    expect(loadBest(1)).toBe(0);
  });

  it('keeps at most HISTORY_MAX runs', () => {
    const run = prep(1);
    for (let i = 0; i < HISTORY_MAX + 5; i++) recordRun(run, 'r' + i);
    expect(loadHistory()).toHaveLength(HISTORY_MAX);
    expect(loadHistory()[0].id).toBe('r' + (HISTORY_MAX + 4));
  });
});
