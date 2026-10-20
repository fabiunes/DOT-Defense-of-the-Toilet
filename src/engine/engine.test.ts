import { describe, expect, it } from 'vitest';
import { damage, hitsPerTurn, simulateCombat } from './combat';
import { ITEMS, KIND_CURVE, MAX_STAT, SIZE_TOTAL } from './data';
import * as G from './game';
import { createEnemy, createMerdomon, createWave, splitStats } from './generate';
import { Rng } from './rng';
import { countTraits, traitTier, traitValue } from './traits';
import type { Enemy, Merdomon, Rarity, RunState, Stats } from './types';

const mk = (stats: Partial<Stats>, extra: Partial<Merdomon> = {}): Merdomon => {
  const s = { hp: 5, atk: 3, def: 1, spd: 1, ...stats };
  return { id: Math.random(), rarity: 'common', kind: 'normal', stats: s, hp: s.hp, traits: [], ability: null, ...extra };
};
const foe = (stats: Partial<Stats>, boss = false): Enemy => ({
  id: Math.random(),
  rarity: 'common',
  kind: 'phone',
  stats: { hp: 5, atk: 3, def: 1, spd: 1, ...stats },
  boss,
});

/** Confirms the pending Merdomon with the given stat and its first ability option. */
const confirm = (s: RunState, stat: Parameters<typeof G.confirmMerdomon>[1] = 'hp') =>
  G.confirmMerdomon(s, stat, s.pendingAbilities[0]);

/** A run in preparation with a known team. */
function prepRun(patch: Partial<RunState> = {}): RunState {
  let s = G.beginRun(G.newRun(42));
  s = G.chooseStarter(s, 0);
  s = confirm(s, 'atk');
  s = G.chooseStartBonus(s, 'resources');
  // Neutralise the starting pack so tests start from the base values.
  return { ...s, ap: 1, items: [], ...patch };
}

describe('rng', () => {
  it('is deterministic', () => {
    const a = new Rng(7);
    const b = new Rng(7);
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });
});

describe('generation', () => {
  const sorted = (st: Stats) => Object.values(st).sort((x, y) => y - x);

  it('splits stats exactly by the kind curve, within 1..10', () => {
    const rng = new Rng(1);
    const cases: [keyof typeof KIND_CURVE, number, number[]][] = [
      ['normal', 9, [3, 2, 2, 2]],
      ['normal', 10, [3, 3, 2, 2]],
      ['normal', 15, [4, 4, 4, 3]],
      ['normal', 20, [5, 5, 5, 5]],
      ['liquid', 9, [4, 3, 1, 1]],
      ['liquid', 10, [4, 4, 1, 1]],
      ['liquid', 15, [6, 6, 2, 1]],
      ['liquid', 20, [8, 8, 2, 2]],
      ['fart', 9, [5, 2, 1, 1]],
      ['fart', 10, [6, 2, 1, 1]],
      ['fart', 15, [9, 4, 1, 1]],
      ['fart', 19, [10, 6, 2, 1]],
      ['fart', 20, [10, 7, 2, 1]],
    ];
    for (const [kind, total, expected] of cases) expect(sorted(splitStats(rng, total, KIND_CURVE[kind]))).toEqual(expected);
  });

  it('gives the biggest share to a random stat', () => {
    const rng = new Rng(2);
    const tops = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const st = splitStats(rng, 10, KIND_CURVE.fart);
      tops.add(Object.entries(st).find(([, v]) => v === 6)![0]);
    }
    expect(tops.size).toBe(4);
  });

  it('Merdomon are 1 point short of their size total, enemies match it', () => {
    const rng = new Rng(3);
    const sum = (st: Stats) => st.hp + st.atk + st.def + st.spd;
    for (const r of ['common', 'rare', 'epic'] as Rarity[]) {
      for (let i = 0; i < 30; i++) {
        const m = createMerdomon(rng, i, r);
        const e = createEnemy(rng, i, r);
        expect(sum(m.stats)).toBe(SIZE_TOTAL[r] - 1);
        expect(sum(e.stats)).toBe(SIZE_TOTAL[r]);
        for (const v of [...Object.values(m.stats), ...Object.values(e.stats)]) {
          expect(v).toBeGreaterThanOrEqual(1);
          expect(v).toBeLessThanOrEqual(MAX_STAT);
        }
      }
    }
  });

  it('builds waves with the boss always last', () => {
    const wave = createWave(new Rng(3), 10, 1, 'streamDeck');
    expect(wave).toHaveLength(6);
    expect(wave[5]).toMatchObject({ boss: true, rarity: 'epic', bossForm: 'final', kind: 'console' });
    expect(wave.slice(0, 5).every((e) => e.rarity === 'rare' && !e.boss)).toBe(true);
    expect(createWave(new Rng(3), 4, 1, 'streamDeck').map((e) => e.rarity).sort()).toEqual(['common', 'common', 'common', 'common', 'rare']);
    const w5 = createWave(new Rng(3), 5, 1, 'bestseller');
    expect(w5.at(-1)).toMatchObject({ boss: true, rarity: 'rare', bossForm: 'mid', kind: 'book' });
  });
});

describe('traits', () => {
  it('uses 2/4/6/8 thresholds', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 12].map(traitTier)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
    expect(traitValue('paper', 6)).toBe(9);
  });

  it('counts duplicates and item traits (some items have two)', () => {
    const c = countTraits([mk({}, { traits: ['haste', 'haste'] })], ['window', 'flipflops']);
    expect(c.haste).toBe(4);
    expect(c.action).toBe(1);
  });
});

describe('combat', () => {
  it('defense blocks half its value, at least 1 damage', () => {
    expect(damage(2, 9)).toBe(1);
    expect(damage(7, 3)).toBe(6);
    expect(damage(5, 2)).toBe(4);
  });

  it('speed only decides who starts, unless Flip-Flops give double hits at twice the speed', () => {
    expect(hitsPerTurn(4, 2, false)).toBe(1);
    expect(hitsPerTurn(4, 2, true)).toBe(2);
    expect(hitsPerTurn(3, 2, true)).toBe(1);
    const team = [mk({ atk: 2, spd: 4 })];
    const wave = [foe({ hp: 10, def: 0, atk: 1, spd: 2 })];
    const sides = (items: Parameters<typeof simulateCombat>[2]) =>
      simulateCombat(team, wave, items, new Rng(1)).events.slice(1, 4).map((e) => e.type === 'attack' && e.side);
    expect(sides([])).toEqual(['p', 'e', 'p']);
    expect(sides(['flipflops'])).toEqual(['p', 'p', 'e']);
    // Enemies never double-hit.
    const r = simulateCombat([mk({ hp: 9, spd: 1 })], [foe({ hp: 9, spd: 9, atk: 1 })], ['flipflops'], new Rng(1));
    expect(r.events.slice(1, 3).map((e) => e.type === 'attack' && e.side)).toEqual(['e', 'p']);
  });

  it('faster fighter strikes first and a win reports survivors', () => {
    const r = simulateCombat([mk({ spd: 5, atk: 6 })], [foe({ hp: 5, def: 1 })], [], new Rng(1));
    expect(r.events[0]).toEqual({ type: 'duel', p: 0, e: 0, first: 'p' });
    expect(r.won).toBe(true);
    expect(r.survivors).toBe(1);
    expect(r.damageDealt).toBe(5); // overkill not counted
    expect(r.hpAfter[0]).toBe(5);
  });

  it('breaks speed ties with total team speed', () => {
    const r = simulateCombat([mk({ spd: 2 }), mk({ spd: 4 })], [foe({ spd: 2 })], [], new Rng(1));
    expect(r.events[0]).toMatchObject({ type: 'duel', first: 'p' });
  });

  it('sends the next Merdomon in after one falls', () => {
    const r = simulateCombat(
      [mk({ hp: 1, atk: 1 }), mk({ hp: 10, atk: 10, spd: 5 })],
      [foe({ hp: 8, atk: 5, def: 1, spd: 9 })],
      [],
      new Rng(1),
    );
    expect(r.won).toBe(true);
    expect(r.hpAfter[0]).toBe(0);
    expect(r.merdomonFallen).toBe(1);
    expect(r.events.filter((e) => e.type === 'duel')).toHaveLength(2);
  });

  it('applies trait bonuses and Toothbrush HP for combat only', () => {
    const team = [mk({ hp: 3, atk: 1 }, { traits: ['fighter', 'fighter'] })];
    const r = simulateCombat(team, [foe({ hp: 10, def: 0 })], [], new Rng(1), { extraHp: 2 });
    expect(r.player[0].atk).toBe(2);
    expect(r.player[0].maxHp).toBe(5);
    expect(team[0].stats.atk).toBe(1);
  });

  it('Magazine revives the first fallen Merdomon once', () => {
    const r = simulateCombat([mk({ hp: 1, atk: 1, spd: 1 })], [foe({ hp: 3, atk: 9, spd: 9, def: 0 })], ['magazine'], new Rng(1));
    expect(r.events.some((e) => e.type === 'revive')).toBe(true);
  });

  it('Window gives the front Merdomon a double strike on its first attack only', () => {
    const r = simulateCombat([mk({ atk: 2, spd: 9 })], [foe({ hp: 10, def: 1, atk: 1, spd: 6 })], ['window'], new Rng(1));
    const playerHits = r.events.filter((e) => e.type === 'attack' && e.side === 'p');
    expect(playerHits[1]).toMatchObject({ double: true });
    expect(r.events[3]).toMatchObject({ type: 'attack', side: 'e' });
    expect(r.events[4]).toMatchObject({ type: 'attack', side: 'p', double: false });
  });

  it('loses with an empty team', () => {
    const r = simulateCombat([], [foe({}), foe({})], [], new Rng(1));
    expect(r.won).toBe(false);
    expect(r.enemySurvivors).toBe(2);
  });
});

describe('run flow', () => {
  it('starts with 2 TP, 5 Poop and 3 small starters, after the Boss reveal', () => {
    expect(G.newRun(1).phase).toBe('boss');
    const s = G.beginRun(G.newRun(1));
    expect(s).toMatchObject({ phase: 'starter', concentration: 10, tp: 2, merdascore: 5, ap: 0 });
    expect(s.starters).toHaveLength(3);
    expect(s.starters.every((m) => m.rarity === 'common' && m.traits.length === 1)).toBe(true);
  });

  it('starter pick + bonus point enters preparation with wave 1 and a shop offer', () => {
    const s = prepRun();
    expect(s.phase).toBe('preparation');
    expect(s.team).toHaveLength(1);
    expect(s.wave).toHaveLength(1);
    expect(s.shopOffer).toHaveLength(2);
    const st = s.team[0].stats;
    expect(st.hp + st.atk + st.def + st.spd).toBe(10);
  });

  it('Big enemies have 15 stat points', () => {
    const wave = createWave(new Rng(9), 9, 1, 'bestseller');
    // Books get +1 ATK from the Bestseller's run-wide modifier.
    for (const e of wave) expect(e.stats.hp + e.stats.atk + e.stats.def + e.stats.spd).toBe(e.kind === 'book' ? 16 : 15);
  });

  it('Concentrate needs more than 2 concentration; Poop is capped by the Bidet', () => {
    expect(G.canConcentrate(prepRun({ concentration: 2 }))).toBe(false);
    const s = G.concentrate(prepRun({ merdascore: 13 }));
    expect(s).toMatchObject({ concentration: 8, merdascore: 15, ap: 0 });
  });

  it('Evacuate spends merdascore and AP, offers 2 options, blocked when the team is full', () => {
    let s = G.evacuate(prepRun({ merdascore: 12 }), 'rare');
    expect(s).toMatchObject({ merdascore: 2, ap: 0 });
    expect(s.choices).toHaveLength(2);
    expect(s.choices.every((m) => m.rarity === 'rare')).toBe(true);
    expect(G.canFight(s)).toBe(false); // must pick first
    const picked = s.choices[1];
    s = G.chooseEvacuated(s, 1);
    expect(s.pending?.id).toBe(picked.id);
    expect(s.choices).toEqual([]);
    s = confirm(s, 'hp');
    expect(s.team).toHaveLength(2);
    const full = prepRun({ merdascore: 20 });
    full.team = Array.from({ length: 6 }, () => mk({}));
    expect(G.canEvacuate(full, 'common')).toBe(false);
  });

  it('Game Boy gives 3 options in Evacuate and Shop', () => {
    let s = prepRun({ merdascore: 5, items: ['gameboy'] });
    s = G.evacuate(s, 'common');
    expect(s.choices).toHaveLength(3);
    s = G.continueAfterCombat(G.fight(confirm(G.chooseEvacuated(s, 0))));
    expect(s.shopOffer).toHaveLength(3);
  });

  it('Re-Roll costs 2 TP and redraws Evacuate options or the shop', () => {
    let s = G.evacuate(prepRun({ merdascore: 5, tp: 4 }), 'common');
    const before = s.choices.map((m) => m.id);
    s = G.rerollChoices(s);
    expect(s.tp).toBe(2);
    expect(s.choices).toHaveLength(2);
    expect(s.choices.map((m) => m.id)).not.toEqual(before);
    s = G.rerollChoices(s);
    expect(s.tp).toBe(0);
    expect(G.canRerollChoices(s)).toBe(false);

    const shop = G.rerollShop(prepRun({ tp: 2 }));
    expect(shop.tp).toBe(0);
    expect(shop.shopOffer).toHaveLength(2);
  });

  it('Shop sells only the offered items, which then leave the offer', () => {
    const s = prepRun({ tp: 30 });
    const notOffered = ITEMS.find((i) => !s.shopOffer.includes(i))!;
    expect(G.canBuy(s, notOffered)).toBe(false);
    const item = s.shopOffer[0];
    const after = G.buy(s, item);
    expect(after.items).toEqual([item]);
    expect(after.shopOffer).not.toContain(item);
    expect(after.tp).toBe(20);
  });

  it('the next shop offer never contains owned items', () => {
    let s = prepRun({ items: ITEMS.filter((i) => i !== 'toothbrush' && i !== 'towel') });
    s = G.continueAfterCombat(G.fight(s));
    expect([...s.shopOffer].sort()).toEqual(['toothbrush', 'towel']);
  });

  it('Hand Shower discounts Shop, Flush and Bonus Action by 2', () => {
    const s = prepRun({ tp: 30, items: ['shower'] });
    expect(G.tpCost(s, 'flush')).toBe(3);
    expect(G.tpCost(s, 'shop')).toBe(8);
    expect(G.tpCost(s, 'bonusAction')).toBe(13);
  });

  it('Flush cannot remove the last Merdomon', () => {
    const s = prepRun({ tp: 10 });
    expect(G.canFlush(s)).toBe(false);
  });

  it('Trade turns 1 AP into 2 Merdascore, 5 TP or +1 stat (max 10)', () => {
    const s = prepRun({ tp: 0, merdascore: 0 });
    expect(G.trade(s, 'merdascore')).toMatchObject({ merdascore: 2, ap: 0 });
    expect(G.trade(s, 'tp')).toMatchObject({ tp: 5, ap: 0 });
    const m = s.team[0];
    const up = G.tradeStat(s, m.id, 'atk');
    expect(up.team[0].stats.atk).toBe(m.stats.atk + 1);
    expect(up.ap).toBe(0);
    expect(G.canTrade(up)).toBe(false);
    m.stats.spd = 10;
    expect(G.canTradeStat(s, m.id, 'spd')).toBe(false);
  });

  it('the Action trait adds AP each round; unspent AP carry over up to the Toilet Brush limit', () => {
    let s = prepRun();
    expect(G.apCap(s)).toBe(2);
    s.structures.scrubber = 3; // limit 4
    s.team[0].traits = ['action', 'action'];
    s = G.bonusAction({ ...s, tp: 20 });
    expect(s.ap).toBe(2);
    s = G.fight(s);
    expect(s.ap).toBe(2);
    s = G.continueAfterCombat(s);
    expect(s.ap).toBe(4); // 2 kept + 1 base + 1 from Action (2 traits)
    s = G.continueAfterCombat(G.fight(s));
    expect(s.ap).toBe(4);
    expect(G.canBonusAction({ ...s, tp: 50 })).toBe(false);
  });

  it('Toothbrush adds unspent AP as combat HP, listed in the combat bonuses', () => {
    const s = prepRun({ items: ['toothbrush', 'window'] });
    s.team[0].traits = ['fighter'];
    const after = G.fight(G.bonusAction({ ...s, tp: 20 }));
    expect(after.lastCombat!.player[0].maxHp).toBe(s.team[0].stats.hp + 2);
    expect(after.lastCombat!.bonuses).toEqual([{ source: 'toothbrush', stat: 'hp', amount: 2 }, { source: 'window' }]);
    s.team[0].traits = ['fighter', 'fighter'];
    expect(G.fight(s).lastCombat!.bonuses[0]).toEqual({ source: 'fighter', stat: 'atk', amount: 1 });
  });

  it('a lost wave costs 1 concentration per surviving enemy and fallen Merdomon return at half HP', () => {
    const s = prepRun();
    s.team = [mk({ hp: 6, atk: 1, def: 1, spd: 1 })];
    s.wave = [foe({ hp: 10, atk: 9, spd: 9 }), foe({}), foe({}), foe({}), foe({})];
    const after = G.fight(s);
    expect(after.phase).toBe('combat');
    expect(after.lastCombat?.won).toBe(false);
    expect(after.concentration).toBe(5);
    expect(after.team[0].hp).toBe(3);
    expect(after.tp).toBe(s.tp); // no damage: the faster enemy kills before the Merdomon can strike
  });
});
