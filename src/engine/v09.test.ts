import { describe, expect, it } from 'vitest';
import { BATHROOMS, BATHROOM_INFO, TRADE } from './data';
import * as G from './game';
import { runScore } from './score';
import type { BathroomId, RunState } from './types';

function prep(bathroom: BathroomId = 'homeA', patch: Partial<RunState> = {}): RunState {
  let s = G.chooseStarter(G.beginRun(G.newRun(21), 1, bathroom), 0);
  s = G.confirmMerdomon(s, 'hp', s.pendingAbilities[0]);
  s = G.chooseStartBonus(s, 'item');
  return { ...s, ...patch };
}

describe('score counters', () => {
  it('count the starter by size and the starting item', () => {
    const s = prep();
    expect(s.stats.merdomonBySize).toEqual({ common: 1, rare: 0, epic: 0 });
    expect(s.stats.itemsObtained).toBe(1);
  });

  it('count every TP gained, Trade included', () => {
    const s = prep('homeA', { ap: 1, tp: 0 });
    expect(G.trade(s, 'tp').stats.tpEarned).toBe(s.stats.tpEarned + TRADE.tp);
  });

  it('count defeated enemies by size after a fight', () => {
    const s = prep();
    const strong = { ...s, team: s.team.map((m) => ({ ...m, stats: { hp: 30, atk: 30, def: 30, spd: 30 }, hp: 30 })) };
    const after = G.fight(strong);
    const sizes = after.stats.enemiesBySize;
    expect(sizes.common + sizes.rare + sizes.epic).toBe(strong.wave.length);
    expect(runScore(after).lines[0].points).toBe(sizes.common * 10 + sizes.rare * 15);
  });
});

describe('drag to reorder', () => {
  it('swaps onto a Merdomon and moves to the end onto an empty slot', () => {
    const s = prep();
    const team = [s.team[0], { ...s.team[0], id: 900 }, { ...s.team[0], id: 901 }];
    const three = { ...s, team };
    expect(G.moveMerdomon(three, 0, 2).team.map((m) => m.id)).toEqual([901, 900, team[0].id]);
    expect(G.moveMerdomon(three, 0, 4).team.map((m) => m.id)).toEqual([900, 901, team[0].id]);
    expect(G.moveMerdomon(three, 2, 5)).toBe(three);
  });
});

describe('Bonus preview', () => {
  it('lists every producing structure and the passive rewards', () => {
    const s = prep('hotelB', { items: ['plunger'] });
    const { sure, structures } = G.previewRewards(s);
    expect(structures.map((r) => r.source)).toEqual(['stall', 'sink', 'bidet', 'toilet', 'holder']);
    expect(structures.every((r) => r.amount > 0)).toBe(true);
    expect(sure).toContainEqual({ source: 'plunger', resource: 'merdascore', amount: 2 });
  });
});

describe('bathroom costs (v0.9)', () => {
  it('are scaled to the new score', () => {
    expect(BATHROOMS.map((id) => BATHROOM_INFO[id].cost)).toEqual([0, 2000, 2000, 4000, 6000, 10000, 15000, 30000]);
  });
});
