import { describe, expect, it } from 'vitest';
import { simulateCombat } from './combat';
import { CAT, LEVEL_BOSS, LEVEL_ENEMY_BONUS, LEVEL_REWARD, ROBOT_VACUUM } from './data';
import * as G from './game';
import { Rng } from './rng';
import type { Enemy, ItemId, Level, Merdomon, RunState } from './types';

function prep(level: Level, patch: Partial<RunState> = {}): RunState {
  let s = G.chooseStarter(G.beginRun(G.newRun(51), level, 'homeA'), 0);
  s = G.confirmMerdomon(s, 'hp', s.pendingAbilities[0]);
  s = G.chooseStartBonus(s, 'resources');
  return { ...s, ...patch };
}

const strong = (m: Merdomon, id: number): Merdomon => ({ ...m, id, stats: { hp: 40, atk: 40, def: 40, spd: 40 }, hp: 40 });
const bossWave = (s: RunState, form: 'mid' | 'final'): Enemy[] => [
  { ...s.wave[0], id: 500, boss: true, bossForm: form, stats: { hp: 5, atk: 1, def: 1, spd: 1 } },
];

describe('levels 6 and 7', () => {
  it('have their Boss, +4 enemy stats and a bigger reward', () => {
    expect([LEVEL_BOSS[6], LEVEL_BOSS[7]]).toEqual(['robotVacuum', 'cat']);
    expect([LEVEL_ENEMY_BONUS[6], LEVEL_ENEMY_BONUS[7]]).toEqual([4, 4]);
    expect([LEVEL_REWARD[6], LEVEL_REWARD[7]]).toEqual([2.5, 3]);
  });
});

describe('The Robot Vacuum (level 6)', () => {
  const items: ItemId[] = ['plunger', 'towel', 'magazine', 'window'];

  it("Clean Sweep: items don't count for traits", () => {
    const s = prep(6, { items });
    expect(G.traitItems(s)).toEqual([]);
    expect(G.traitItems({ ...s, boss: 'bestseller' })).toEqual(items);
  });

  it('Suction takes 1 item on wave 5; Turbo Mode takes 2 more and gets +1 ATK per item left', () => {
    const s = prep(6, { items, team: [strong(prep(6).team[0], 1)] });
    const mid = G.fight({ ...s, wave: bossWave(s, 'mid') });
    expect(mid.items).toHaveLength(items.length - ROBOT_VACUUM.midSteal);
    expect(mid.lastCombat!.stolen).toHaveLength(1);
    expect(mid.waveLog!.at(-1)!.stolen).toEqual(mid.lastCombat!.stolen);

    const fin = G.fight({ ...s, wave: bossWave(s, 'final') });
    expect(fin.items).toHaveLength(items.length - ROBOT_VACUUM.finalSteal);
    const boss = fin.lastCombat!.enemies.find((e) => e.boss)!;
    expect(boss.atk).toBe(1 + fin.items.length * ROBOT_VACUUM.atkPerItem);
  });
});

describe('The Cat (level 7)', () => {
  it('shuffles the team every round, keeping the same Merdomon', () => {
    const s = prep(7);
    const team = [1, 2, 3, 4].map((id) => strong(s.team[0], id));
    const next = G.continueAfterCombat(G.fight({ ...s, team }));
    expect(next.team.map((m) => m.id).sort()).toEqual([1, 2, 3, 4]);
  });

  it('moving costs 1 TP from round 2, and is not possible without TP', () => {
    const s = prep(7);
    const team = [1, 2].map((id) => strong(s.team[0], id));
    expect(G.moveMerdomon({ ...s, team, tp: 5 }, 0, 1).tp).toBe(5);
    const r2 = { ...s, team, tp: 5, round: 2 };
    expect(G.moveMerdomon(r2, 0, 1).tp).toBe(5 - CAT.moveTp);
    expect(G.canOrganize({ ...r2, tp: 0 })).toBe(false);
  });

  it('Lap Sitter: the first Merdomon skips its first attack', () => {
    const s = prep(7);
    const r = simulateCombat([strong(s.team[0], 1)], bossWave(s, 'mid'), [], new Rng(1), { bossId: 'cat' });
    const firstPlayerTurn = r.events.findIndex((e) => e.type === 'boss' || (e.type === 'attack' && e.side === 'p'));
    expect(r.events[firstPlayerTurn].type).toBe('boss');
  });

  it('Nine Lives: the final Cat comes back twice', () => {
    const s = prep(7);
    const r = simulateCombat([strong(s.team[0], 1)], bossWave(s, 'final'), [], new Rng(1), { bossId: 'cat' });
    const lives = r.events.filter((e) => e.type === 'boss' && e.hp !== undefined);
    expect(lives).toHaveLength(CAT.lives);
    expect(r.won).toBe(true);
  });

  it('Toilet Paper Massacre: half the TP is lost after wave 5', () => {
    const s = prep(7, { tp: 30 });
    const after = G.fight({ ...s, team: [strong(s.team[0], 1)], wave: bossWave(s, 'mid') });
    const loss = after.lastCombat!.rewards.find((r) => r.source === 'cat');
    expect(loss).toBeDefined();
    // Half (rounded down) of the TP held after the wave's rewards.
    const before = after.tp - loss!.amount;
    expect(-loss!.amount).toBe(Math.floor(before / CAT.tpLossDivisor));
  });
});
