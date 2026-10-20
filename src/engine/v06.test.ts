import { beforeEach, describe, expect, it } from 'vitest';
import { BATHROOMS, BATHROOM_INFO, FARTING, STARTING_TOILET_POINTS } from './data';
import * as G from './game';
import { isUnlocked, loadToiletPoints, recordRun, unlockBathroom } from './save';
import { runScore } from './score';
import type { BathroomId, RunState } from './types';

function prep(bathroom: BathroomId = 'homeA', patch: Partial<RunState> = {}): RunState {
  let s = G.chooseStarter(G.beginRun(G.newRun(21), 1, bathroom), 0);
  s = G.confirmMerdomon(s, 'hp', s.pendingAbilities[0]);
  s = G.chooseStartBonus(s, 'item');
  return { ...s, items: [], ...patch };
}

describe('bathroom types', () => {
  it('set the starting structures, TP, Concentration and Poop', () => {
    for (const id of BATHROOMS) {
      const b = BATHROOM_INFO[id];
      const s = G.beginRun(G.newRun(3), 1, id);
      expect(s.structures).toEqual(b.structures);
      expect(s.startStructures).toEqual(b.structures);
      expect(s).toMatchObject({ bathroom: id, tp: b.tp, merdascore: b.poop, concentration: b.concentration });
      expect(s.concentration).toBeLessThanOrEqual(G.concentrationCap(s));
    }
  });

  it('Tier 0 still gives its minimum capacity', () => {
    const s = G.beginRun(G.newRun(3), 1, 'publicA'); // Shower, Sink, Bidet, Brush at Tier 0
    expect([G.concentrationCap(s), G.itemCap(s), G.poopCap(s), G.apCap(s)]).toEqual([8, 3, 10, 2]);
    expect([G.teamCap(s), G.tpCap(s)]).toEqual([6, 60]);
  });
});

describe('building from Tier 0 and the Hammer', () => {
  it('Tier 0 → 1 costs 30 TP + 1 AP; with the Hammer every build costs 15 TP', () => {
    const s = prep('officeA', { tp: 40, ap: 2 });
    expect(s.structures.stall).toBe(0);
    expect(G.buildTp(s, 'stall')).toBe(30);
    expect(G.buildTp(s, 'sink')).toBe(20);
    const built = G.build(s, 'stall');
    expect(built).toMatchObject({ tp: 10, ap: 1 });
    expect(built.structures.stall).toBe(1);
    const hammer = { ...s, items: ['hammer' as const] };
    expect(G.buildTp(hammer, 'stall')).toBe(15);
    expect(G.buildTp(hammer, 'sink')).toBe(15);
  });

  it('only upgrades built during the run count for the score', () => {
    const s = prep('hotelA');
    const upgraded = { ...s, structures: { ...s.structures, sink: 3 } };
    expect(runScore(upgraded).lines.find((l) => l.label === 'Structure upgrades')!.count).toBe(1);
  });
});

describe('Farting', () => {
  it('heals 1 HP for 3 TP, repeatable, only a hurt Merdomon', () => {
    const s = prep('homeA', { tp: 9 });
    const m = s.team[0];
    expect(G.canFart(s, m.id)).toBe(false); // full HP
    s.team[0].stats.hp = 9;
    s.team[0].hp = 1;
    let after = G.fart(s, m.id);
    after = G.fart(after, m.id);
    expect(after.tp).toBe(9 - 2 * FARTING.tp);
    expect(after.team[0].hp).toBe(1 + 2 * FARTING.hp);
  });
});

describe('gift after wave 5', () => {
  it('offers 3 items once, after wave 5 (won or lost); preparation waits for it', () => {
    let s = prep();
    while (s.round < 6) {
      expect(s.giftOffer).toEqual([]);
      s = G.continueAfterCombat(G.fight({ ...s, concentration: 10 }));
    }
    expect(s.giftOffer).toHaveLength(3);
    expect(G.canFight(s)).toBe(false);
    const item = s.giftOffer[1];
    const taken = G.takeGift(s, item);
    expect(taken.items).toContain(item);
    expect(taken.giftOffer).toEqual([]);
    expect(G.canFight(taken)).toBe(true);
    expect(G.skipGift(s).giftOffer).toEqual([]);
    const next = G.continueAfterCombat(G.fight({ ...taken, concentration: 10 }));
    expect(next.giftOffer).toEqual([]);
  });
});

describe('Toilet Points', () => {
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

  it('start at the testing amount and are spent to unlock bathrooms', () => {
    expect(loadToiletPoints()).toBe(STARTING_TOILET_POINTS);
    expect(isUnlocked('homeA')).toBe(true);
    expect(isUnlocked('homeB')).toBe(false);
    expect(unlockBathroom('homeB')).toBe(true);
    expect(isUnlocked('homeB')).toBe(true);
    expect(loadToiletPoints()).toBe(STARTING_TOILET_POINTS - BATHROOM_INFO.homeB.cost);
  });

  it('a finished run adds its score', () => {
    const run = { ...prep(), phase: 'gameover' as const };
    const before = loadToiletPoints();
    recordRun(run, 'x');
    expect(loadToiletPoints()).toBe(before + runScore(run).total);
  });
});
