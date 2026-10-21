import { beforeEach, describe, expect, it } from 'vitest';
import { simulateCombat } from './combat';
import { LEVEL_REWARD, PLUMBER } from './data';
import * as G from './game';
import { Rng } from './rng';
import { isLevelUnlocked, loadToiletPoints, recordRun, toiletPointsFor, unlockAllWithPassword } from './save';
import { runScore } from './score';
import type { Level, Merdomon, RunState } from './types';

function prep(level: Level, patch: Partial<RunState> = {}): RunState {
  let s = G.chooseStarter(G.beginRun(G.newRun(31), level, 'homeA'), 0);
  s = G.confirmMerdomon(s, 'hp', s.pendingAbilities[0]);
  s = G.chooseStartBonus(s, 'resources');
  return { ...s, ...patch };
}

const copy = (m: Merdomon, id: number, patch: Partial<Merdomon> = {}): Merdomon => ({ ...m, id, ...patch });

describe('The Plumber (level 4)', () => {
  it('Water Shut-Off: Shower and Bidet work as Tier 0 and cannot be built', () => {
    const s = prep(4, { tp: 40, ap: 2 });
    expect(s.boss).toBe('plumber');
    expect(PLUMBER.offline.every((id) => G.isOffline(s, id))).toBe(true);
    expect([G.concentrationCap(s), G.poopCap(s)]).toEqual([8, 10]);
    expect(s.concentration).toBeLessThanOrEqual(8);
    expect(G.canBuild(s, 'stall')).toBe(false);
    expect(G.canBuild(s, 'sink')).toBe(true);
    const hotel = { ...s, structures: { ...s.structures, stall: 3, bidet: 3 } };
    expect([G.production(hotel, 'stall'), G.production(hotel, 'bidet')]).toEqual([0, 0]);
  });

  it('Knock Knock and Pipe Burst cost Concentration on its waves', () => {
    const s = prep(4);
    const boss = { ...s.wave[0], boss: true, bossForm: 'mid' as const };
    const mid = G.previewRewards({ ...s, wave: [boss] }).sure.find((r) => r.source === 'plumber');
    const fin = G.previewRewards({ ...s, wave: [{ ...boss, bossForm: 'final' }] }).sure.find((r) => r.source === 'plumber');
    expect(mid?.amount).toBe(-PLUMBER.midConcentration);
    expect(fin?.amount).toBe(-PLUMBER.finalConcentration);
    expect(G.previewRewards(s).sure.some((r) => r.source === 'plumber')).toBe(false);
  });

  it("Pipe Burst: the final Plumber's first attack hits twice", () => {
    const s = prep(4);
    const tank = copy(s.team[0], 1, { stats: { hp: 50, atk: 1, def: 1, spd: 1 }, hp: 50 });
    const plumber = { ...s.wave[0], boss: true, bossForm: 'final' as const, stats: { hp: 99, atk: 3, def: 1, spd: 9 } };
    const r = simulateCombat([tank], [plumber], [], new Rng(1), { bossId: 'plumber' });
    const hits = r.events.filter((e) => e.type === 'attack' && e.side === 'e');
    expect(hits[1]).toMatchObject({ double: true });
    expect(hits.filter((e) => e.type === 'attack' && e.double)).toHaveLength(1);
  });
});

describe('The Group Admin (level 5)', () => {
  it('Muted: the most common trait gives no bonus', () => {
    const s = prep(5);
    const m = s.team[0];
    const team = [copy(m, 1, { traits: ['fighter'] }), copy(m, 2, { traits: ['fighter'] }), copy(m, 3, { traits: ['healthy'] })];
    const run = { ...s, team, items: [] };
    expect(G.mutedTrait(run)).toBe('fighter');
    expect(G.mutedTrait({ ...run, boss: 'bestseller' })).toBe(null);
  });

  it('Pinned Message locks the last slot from wave 5, @everyone 2 slots on wave 10', () => {
    const s = prep(5);
    const cap = G.capacity(s, 'toilet');
    expect(G.teamCap({ ...s, round: 4 })).toBe(cap);
    expect(G.teamCap({ ...s, round: 5 })).toBe(cap - 1);
    expect(G.teamCap({ ...s, round: 10 })).toBe(cap - 2);
  });

  it('benched Merdomon do not fight and keep their HP', () => {
    const s = prep(5);
    const m = s.team[0];
    const strong = { hp: 30, atk: 30, def: 30, spd: 30 };
    const team = [1, 2, 3, 4].map((id) => copy(m, id, { stats: { ...strong }, hp: 30 }));
    team[3] = { ...team[3], hp: 7 };
    const run = { ...s, round: 5, team };
    expect(G.activeTeam(run)).toHaveLength(3);
    const after = G.fight(run);
    expect(after.lastCombat!.player).toHaveLength(3);
    expect(after.team[3].hp).toBe(7);
  });
});

describe('levels and rewards', () => {
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

  it('only level 1 is open; winning a level unlocks the next', () => {
    expect([1, 2, 3, 4, 5].map((l) => isLevelUnlocked(l as Level))).toEqual([true, false, false, false, false]);
    recordRun({ ...prep(1), phase: 'gameover' }, 'lost');
    expect(isLevelUnlocked(2)).toBe(false);
    recordRun({ ...prep(1), phase: 'victory' }, 'won');
    expect(isLevelUnlocked(2)).toBe(true);
    expect(isLevelUnlocked(3)).toBe(false);
  });

  it('the testing password opens every level', async () => {
    expect(await unlockAllWithPassword('PalleMerda')).toBe(true);
    expect([2, 3, 4, 5].every((l) => isLevelUnlocked(l as Level))).toBe(true);
  });

  it('Toilet Points use the level reward, the score does not change', () => {
    const run = { ...prep(4), phase: 'gameover' as const };
    const { total } = runScore(run);
    recordRun(run, 'x');
    expect(loadToiletPoints()).toBe(Math.round(total * LEVEL_REWARD[4]));
    expect(toiletPointsFor(1000, 5)).toBe(2000);
    expect(runScore(run).total).toBe(total);
  });
});
