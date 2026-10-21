import { describe, expect, it } from 'vitest';
import * as G from './game';
import { claimTutorialReward, loadToiletPoints } from './save';
import { TUTORIAL_REWARD, tutorialAdjust, tutorialRun } from './tutorial';
import type { RunState } from './types';

/** The tutorial's guided path, played by the engine (tutorialAdjust after every action, like the app). */
function play(s: RunState, fn: (s: RunState) => RunState) {
  return tutorialAdjust(fn(s));
}

describe('Tutorial Game', () => {
  it('can always be played as the guide asks, winning both waves', () => {
    let s = tutorialRun();
    expect(s).toMatchObject({ phase: 'starter', bathroom: 'homeA', modifiers: {} });
    expect(s.starters.map((m) => m.kind)).toEqual(['normal', 'liquid', 'fart']);

    s = play(s, (x) => G.chooseStarter(x, 0));
    s = play(s, (x) => G.confirmMerdomon(x, 'atk', x.pendingAbilities[0]));
    s = play(s, (x) => G.chooseStartBonus(x, 'resources'));
    expect(s.phase).toBe('preparation');
    expect(s.wave).toHaveLength(1);

    // Round 1: Evacuate a Small one, swap the order, fight.
    s = play(s, (x) => G.evacuate(x, 'common'));
    s = play(s, (x) => G.chooseEvacuated(x, 0));
    s = play(s, (x) => G.confirmMerdomon(x, 'hp', x.pendingAbilities[0]));
    expect(s.team).toHaveLength(2);
    s = play(s, (x) => G.moveMerdomon(x, 0, 1));
    s = play(s, G.fight);
    expect(s.lastCombat?.won).toBe(true);
    s = play(s, G.continueAfterCombat);

    // Round 2: enough for the Shop and one Build, then fight.
    expect(s).toMatchObject({ round: 2, phase: 'preparation' });
    expect(s.wave).toHaveLength(2);
    expect(s.tp).toBeGreaterThanOrEqual(35);
    s = play(s, (x) => G.buy(x, x.shopOffer[0]));
    expect(s.items).toHaveLength(1);
    s = play(s, (x) => G.build(x, 'holder'));
    expect(s.structures.holder).toBe(2);
    s = play(s, G.fight);
    expect(s.lastCombat?.won).toBe(true);
    expect(play(s, G.continueAfterCombat).round).toBe(3);
  });

  it('gives its Toilet Points only once', () => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    } as Storage;
    expect(claimTutorialReward(TUTORIAL_REWARD)).toBe(TUTORIAL_REWARD);
    expect(claimTutorialReward(TUTORIAL_REWARD)).toBe(0);
    expect(loadToiletPoints()).toBe(TUTORIAL_REWARD);
  });
});
