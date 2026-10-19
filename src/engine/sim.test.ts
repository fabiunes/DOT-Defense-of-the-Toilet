import { describe, expect, it } from 'vitest';
import { ITEMS, MAX_TEAM, STAT_KEYS } from './data';
import * as G from './game';
import type { Rarity, RunState } from './types';

/** A simple greedy bot, used to check runs always terminate and to get a rough difficulty read. */
function playPreparation(s: RunState): RunState {
  for (let guard = 0; guard < 50; guard++) {
    const before = s;
    if (s.pending) {
      const stat = STAT_KEYS.find((k) => G.canAssignBonus(s, k))!;
      s = G.assignBonusPoint(s, stat);
      continue;
    }
    if (s.ap >= 1) {
      const rarity = (['epic', 'rare', 'common'] as Rarity[]).find((r) => G.canEvacuate(s, r));
      if (rarity) s = G.chooseEvacuated(G.evacuate(s, rarity), 0);
      else if (s.team.some((m) => m.hp * 2 < m.stats.hp)) s = G.heal(s);
      else if (ITEMS.some((i) => G.canBuy(s, i))) s = G.buy(s, ITEMS.find((i) => G.canBuy(s, i))!);
      else if (s.concentration > 6 && s.team.length < MAX_TEAM) s = G.concentrate(s);
      else if (s.team.length < MAX_TEAM) s = G.trade(s, 'merdascore');
      else {
        const m = s.team[0];
        const stat = (['atk', 'hp', 'def', 'spd'] as const).find((k) => G.canTradeStat(s, m.id, k));
        if (stat) s = G.tradeStat(s, m.id, stat);
      }
    }
    if (s === before && s.tp >= 40 && G.canBonusAction(s)) s = G.bonusAction(s);
    if (s === before) break;
  }
  return G.fight(s);
}

function playRun(seed: number): RunState {
  let s = G.newRun(seed);
  s = G.chooseStarter(s, 0);
  for (let steps = 0; steps < 200; steps++) {
    if (s.phase === 'gameover' || s.phase === 'victory') return s;
    if (s.phase === 'combat') s = G.continueAfterCombat(s);
    else s = playPreparation(s);
  }
  throw new Error(`run ${seed} did not terminate`);
}

describe('simulation', () => {
  it('every run terminates', () => {
    const runs = Array.from({ length: 500 }, (_, i) => playRun(i + 1));
    const wins = runs.filter((r) => r.phase === 'victory').length;
    const avgRound = runs.reduce((sum, r) => sum + r.round, 0) / runs.length;
    console.log(`[sim] greedy bot: ${((wins / runs.length) * 100).toFixed(1)}% wins, avg round reached ${avgRound.toFixed(2)}`);
    expect(runs.every((r) => r.phase === 'gameover' || r.phase === 'victory')).toBe(true);
  });
});
