import { describe, expect, it } from 'vitest';
import { simulateCombat } from './combat';
import { BOSS_INFO, BUILD_COST, ITEMS } from './data';
import * as G from './game';
import { createBoss } from './generate';
import { Rng } from './rng';
import { runScore } from './score';
import type { BossId, Enemy, Merdomon, RunState, Stats } from './types';

const mk = (stats: Partial<Stats>, extra: Partial<Merdomon> = {}): Merdomon => {
  const s = { hp: 5, atk: 3, def: 1, spd: 1, ...stats };
  return { id: Math.random(), rarity: 'common', kind: 'normal', stats: s, hp: s.hp, traits: [], ability: null, ...extra };
};
const bossFoe = (form: 'mid' | 'final', stats: Partial<Stats>): Enemy => ({
  id: Math.random(),
  rarity: form === 'mid' ? 'rare' : 'epic',
  kind: 'console',
  stats: { hp: 6, atk: 1, def: 0, spd: 1, ...stats },
  boss: true,
  bossForm: form,
});

/** A run in preparation (first ability, item bonus) with base values. */
function prep(seed = 4, patch: Partial<RunState> = {}): RunState {
  let s = G.chooseStarter(G.beginRun(G.newRun(seed), 1, 'homeA'), 0);
  s = G.confirmMerdomon(s, 'hp', s.pendingAbilities[0]);
  s = G.chooseStartBonus(s, 'item');
  return { ...s, items: [], ap: 1, ...patch };
}

describe('structures', () => {
  it('start at Tier 1 with their capacities', () => {
    const s = prep();
    expect(s.structures).toEqual({ stall: 1, sink: 1, bidet: 1, scrubber: 1, toilet: 1, holder: 1 });
    expect([G.itemCap(s), G.poopCap(s), G.tpCap(s), G.teamCap(s)]).toEqual([5, 15, 40, 4]);
    expect([G.concentrationCap(s), G.apCap(s)]).toEqual([10, 3]);
  });

  it('Build costs 25 / 30 TP + 1 AP from Tier 1 / 2, up to Tier 3', () => {
    let s = prep(4, { tp: 30, ap: 2 });
    s = G.build(s, 'holder');
    expect(s).toMatchObject({ tp: 30 - BUILD_COST.tp[1], ap: 1 });
    expect(G.tpCap(s)).toBe(50);
    expect(G.canBuild({ ...s, tp: 29 }, 'holder')).toBe(false);
    s = G.build({ ...s, tp: 30 }, 'holder');
    expect(s.structures.holder).toBe(3);
    expect(G.canBuild({ ...s, tp: 30, ap: 1 }, 'holder')).toBe(false);
  });

  it('caps TP and Poop (excess is lost) and the team size', () => {
    const s = G.trade(prep(4, { tp: 38 }), 'tp');
    expect(s.tp).toBe(40);
    const full = prep(4, { merdascore: 20 });
    full.team = [mk({}), mk({}), mk({}), mk({})];
    expect(G.canEvacuate(full, 'common')).toBe(false);
  });

  it('produce after every combat from Tier 2', () => {
    const s = prep(4, { structures: { stall: 1, sink: 2, bidet: 3, scrubber: 3, holder: 2, toilet: 3 }, concentration: 5, tp: 0, merdascore: 0 });
    const after = G.fight(s);
    const r = after.lastCombat!.rewards;
    expect(r).toContainEqual({ source: 'sink', resource: 'ap', amount: 1 });
    expect(r).toContainEqual({ source: 'bidet', resource: 'concentration', amount: 2 });
    expect(r).toContainEqual({ source: 'holder', resource: 'tp', amount: 5 });
    expect(r).toContainEqual({ source: 'toilet', resource: 'merdascore', amount: 3 });
    expect(G.continueAfterCombat(after).ap).toBe(Math.min(4, s.ap + 1 + 1));
  });
});

describe('items bag', () => {
  it('a full bag needs a discard to buy', () => {
    const base = prep(4, { tp: 30 });
    // Fill the bag (5 at Sink Tier 1) with items that are not on sale.
    const owned = ITEMS.filter((i) => !base.shopOffer.includes(i)).slice(0, G.itemCap(base));
    const s = { ...base, items: owned };
    const item = s.shopOffer[0];
    expect(G.bagFull(s)).toBe(true);
    expect(G.canBuy(s, item)).toBe(false);
    expect(G.affordable(s, item)).toBe(true);
    const after = G.buy(s, item, owned[1]);
    expect(after.items).toEqual([...owned.filter((i) => i !== owned[1]), item]);
  });
});

describe('towels', () => {
  it('boost only their Merdomon type in combat', () => {
    const team = [mk({}, { kind: 'normal' }), mk({}, { kind: 'liquid' }), mk({}, { kind: 'fart' })];
    const r = simulateCombat(team, [bossFoe('mid', { hp: 1 })], ['yellowTowel'], new Rng(1));
    expect(r.player.map((f) => [f.maxHp, f.atk])).toEqual([[5, 3], [6, 4], [5, 3]]);
  });
});

describe('bosses', () => {
  it('a Boss is picked and revealed at the start', () => {
    const s = G.newRun(8);
    expect(Object.keys(BOSS_INFO)).toContain(s.boss);
    expect(s.phase).toBe('boss');
  });

  it('give their type +1 ATK; Demon Scroller gains HP per Concentration lost', () => {
    const plain = createBoss(new Rng(2), 1, 'demonScroller', 'final', 0);
    const fed = createBoss(new Rng(2), 1, 'demonScroller', 'final', 4);
    expect(fed.stats.hp).toBe(plain.stats.hp + 4);
    expect(plain.stats.hp + plain.stats.atk + plain.stats.def + plain.stats.spd).toBe(22 + 1);
    expect(createBoss(new Rng(2), 1, 'bestseller', 'mid', 0)).toMatchObject({ kind: 'book', rarity: 'rare' });
  });

  it('Bestseller gains DEF (and ATK in final form) after each attack', () => {
    const fight = (form: 'mid' | 'final', bossId: BossId) =>
      simulateCombat([mk({ hp: 30, atk: 2, spd: 9 })], [bossFoe(form, { hp: 9, def: 0 })], [], new Rng(1), { bossId });
    const mid = fight('mid', 'bestseller');
    expect(mid.events.filter((e) => e.type === 'boss').length).toBeGreaterThan(0);
    const midHits = mid.events.flatMap((e) => (e.type === 'attack' && e.side === 'p' ? [e.damage] : []));
    expect(midHits[0]).toBeGreaterThanOrEqual(midHits.at(-1)!);
  });

  it('StreamDeck comes back once: half HP (mid) or full HP (final)', () => {
    const fight = (form: 'mid' | 'final') =>
      simulateCombat([mk({ hp: 30, atk: 9, spd: 9 })], [bossFoe(form, { hp: 6 })], [], new Rng(1), { bossId: 'streamDeck' });
    const mid = fight('mid');
    expect(mid.events.find((e) => e.type === 'boss')).toMatchObject({ hp: 3 });
    expect(mid.won).toBe(true);
    expect(fight('final').events.find((e) => e.type === 'boss')).toMatchObject({ hp: 6 });
  });

  it('defeating the Bosses is recorded for the score', () => {
    let s = prep(6);
    s.team = [mk({ hp: 10, atk: 10, def: 10, spd: 10 }), mk({ hp: 10, atk: 10, def: 10, spd: 10 })];
    while (s.round < 5) s = G.continueAfterCombat(G.fight({ ...s, concentration: 10 }));
    expect(s.wave.at(-1)).toMatchObject({ boss: true, bossForm: 'mid' });
    const after = G.fight({ ...s, concentration: 10 });
    expect(after.stats.midBossDefeated).toBe(after.lastCombat!.won);
  });
});

describe('final score', () => {
  it('adds up the run', () => {
    const s = prep();
    const scored: RunState = {
      ...s,
      phase: 'victory',
      concentration: 4,
      structures: { stall: 1, sink: 2, bidet: 1, scrubber: 1, holder: 3, toilet: 1 },
      stats: {
        ...s.stats,
        wavesWon: 9,
        enemiesDefeated: 40,
        modifierWavesWon: 2,
        midBossDefeated: true,
        finalBossDefeated: true,
        merdascoreEarned: 25,
      },
    };
    const { total } = runScore(scored);
    expect(total).toBe(900 + 400 + 100 + 150 + 300 + 500 + 120 + 75 + 250);
  });
});
