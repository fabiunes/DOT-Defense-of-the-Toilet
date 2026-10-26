import { beforeEach, describe, expect, it } from 'vitest';
import { BATHROOM_ACTION_POOP, ENDLESS, endlessEnemyBonus } from './data';
import * as G from './game';
import { loadEndlessBest, recordRun } from './save';
import type { Merdomon, RunState } from './types';

const strong = (m: Merdomon, id: number): Merdomon => ({ ...m, id, stats: { hp: 60, atk: 60, def: 60, spd: 60 }, hp: 60 });

/** An Endless run past the customization, the starter and the starting bonus. */
function endless(patch: Partial<RunState> = {}): RunState {
  let s = G.beginEndless(G.newRun(71));
  s = G.customBuild(s, 'toilet');
  s = G.customBuild(s, 'toilet');
  s = G.customBuild(s, 'holder');
  s = G.setCustomAction(s, 'home');
  s = G.finishCustomize(s);
  s = G.chooseStarter(s, 0);
  s = G.confirmMerdomon(s, 'hp', s.pendingAbilities[0]);
  s = G.chooseStartBonus(s, 'resources');
  return { ...s, ...patch };
}

describe('Endless Mode', () => {
  it('starts in the Custom Toilet (all Tier 0, 5/5/5) with 3 free tiers to place', () => {
    const s = G.beginEndless(G.newRun(71));
    expect(s).toMatchObject({ mode: 'endless', phase: 'customize', bathroom: 'custom', customPoints: 3, endlessLevel: 1 });
    expect(Object.values(s.structures).every((t) => t === 0)).toBe(true);
    expect([s.tp, s.concentration, s.merdascore]).toEqual([5, 5, 5]);
  });

  it('customize: tiers can stack on one structure and be taken back; an action must be chosen', () => {
    let s = G.beginEndless(G.newRun(71));
    s = G.customBuild(G.customBuild(G.customBuild(s, 'toilet'), 'toilet'), 'toilet');
    expect(s.structures.toilet).toBe(3);
    expect(G.canCustomBuild(s, 'sink')).toBe(false);
    s = G.customUnbuild(s, 'toilet');
    expect(s.customPoints).toBe(1);
    expect(G.canFinishCustomize(s)).toBe(false);
    s = G.finishCustomize(G.setCustomAction(s, 'office'));
    expect(s.phase).toBe('starter');
    expect(s.startStructures.toilet).toBe(2);
    expect(G.bathroomActionOf(s)).toBe('office');
  });

  it('has 6 waves per level, the mid Boss on wave 3 and 2 modifiers', () => {
    const s = endless();
    expect(G.roundsOf(s)).toBe(6);
    expect(G.wavePlan(s, 3).boss).toBe('mid');
    expect(G.wavePlan(s, 6).boss).toBe('final');
    expect(Object.keys(s.modifiers).map(Number).sort()).toEqual([...ENDLESS.modifierWaves]);
  });

  it('beating the final Boss leads to the next level, with a gift', () => {
    const s = endless({ round: 6 });
    const won = G.continueAfterCombat(G.fight({ ...s, team: [strong(s.team[0], 1)] }));
    expect(won).toMatchObject({ endlessLevel: 2, level: 2, boss: 'streamDeck', round: 1, phase: 'preparation' });
    expect(won.giftOffer.length).toBeGreaterThan(0);
  });

  it('losing to the final Boss ends the run; after level 7 the Bosses start again, tougher', () => {
    const s = endless({ round: 6 });
    const weak = { ...s, team: [{ ...s.team[0], stats: { hp: 1, atk: 1, def: 1, spd: 1 }, hp: 1, ability: null }] };
    expect(G.continueAfterCombat(G.fight({ ...weak, concentration: 20 })).phase).toBe('gameover');
    expect([1, 4, 5, 7, 8].map(endlessEnemyBonus)).toEqual([0, 3, 5, 7, 8]);
    const s7 = endless({ round: 6, endlessLevel: 7, level: 7, boss: 'cat' });
    const next = G.continueAfterCombat(G.fight({ ...s7, team: [strong(s.team[0], 1)] }));
    expect(next).toMatchObject({ endlessLevel: 8, level: 1, boss: 'bestseller' });
  });
});

describe('Flush and bathroom actions (v0.15)', () => {
  it('Flush gives Concentration and AP by size (up to the limits)', () => {
    const s = endless({ tp: 20, ap: 0, concentration: 2 });
    const big = { ...s.team[0], id: 500, rarity: 'rare' as const };
    const after = G.flush({ ...s, team: [...s.team, big] }, 500);
    expect(after).toMatchObject({ ap: 2, concentration: 4 });
  });

  it('the Custom Toilet uses its chosen action, for 3 Poop', () => {
    const s = endless({ merdascore: 10 });
    expect(BATHROOM_ACTION_POOP).toBe(3);
    const after = G.bathroomAction(s);
    expect(after).toMatchObject({ comfortHp: 1, merdascore: 7 });
  });
});

describe('Endless records', () => {
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

  it('keep the best score and the furthest level and wave', () => {
    recordRun({ ...endless({ endlessLevel: 3, round: 4 }), phase: 'gameover' }, 'a');
    recordRun({ ...endless({ endlessLevel: 2, round: 6 }), phase: 'gameover' }, 'b');
    expect(loadEndlessBest()).toMatchObject({ level: 3, round: 4 });
  });
});
