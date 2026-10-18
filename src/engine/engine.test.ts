import { describe, expect, it } from 'vitest';
import { damage, hitsPerTurn, simulateCombat } from './combat';
import { ITEMS, MAX_STAT, RARITY_POINTS } from './data';
import * as G from './game';
import { createWave, rollStats } from './generate';
import { Rng } from './rng';
import { countTraits, traitTier, traitValue } from './traits';
import type { Enemy, Merdomon, RunState, Stats } from './types';

const mk = (stats: Partial<Stats>, extra: Partial<Merdomon> = {}): Merdomon => {
  const s = { hp: 5, atk: 3, def: 1, spd: 1, ...stats };
  return { id: Math.random(), rarity: 'common', stats: s, hp: s.hp, traits: [], ability: 'generic', ...extra };
};
const foe = (stats: Partial<Stats>, boss = false): Enemy => ({
  id: Math.random(),
  rarity: 'common',
  stats: { hp: 5, atk: 3, def: 1, spd: 1, ...stats },
  ability: 'generic',
  boss,
});

/** A run in preparation with a known team. */
function prepRun(patch: Partial<RunState> = {}): RunState {
  let s = G.newRun(42);
  s = G.chooseStarter(s, 0);
  s = G.assignBonusPoint(s, 'atk');
  return { ...s, ...patch };
}

describe('rng', () => {
  it('is deterministic', () => {
    const a = new Rng(7);
    const b = new Rng(7);
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });
});

describe('generation', () => {
  it('rolls stats from base 1 with exactly the rarity points, capped at 10', () => {
    const rng = new Rng(1);
    for (const points of Object.values(RARITY_POINTS)) {
      for (let i = 0; i < 200; i++) {
        const s = rollStats(rng, points);
        expect(s.hp + s.atk + s.def + s.spd).toBe(4 + points);
        for (const v of Object.values(s)) expect(v).toBeGreaterThanOrEqual(1), expect(v).toBeLessThanOrEqual(MAX_STAT);
      }
    }
  });

  it('builds waves with the boss always last', () => {
    const wave = createWave(new Rng(3), 10, 1);
    expect(wave).toHaveLength(6);
    expect(wave[5].boss).toBe(true);
    expect(wave[5].rarity).toBe('epic');
    expect(wave.slice(0, 5).every((e) => e.rarity === 'rare' && !e.boss)).toBe(true);
    expect(createWave(new Rng(3), 4, 1).map((e) => e.rarity).sort()).toEqual(['common', 'common', 'common', 'rare']);
  });
});

describe('traits', () => {
  it('uses 2/4/6/8 thresholds', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 12].map(traitTier)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
    expect(traitValue('paper', 6)).toBe(9);
  });

  it('counts duplicates and item traits', () => {
    const c = countTraits([mk({}, { traits: ['haste', 'haste'] })], ['window']);
    expect(c.haste).toBe(3);
  });
});

describe('combat', () => {
  it('defense blocks half its value, at least 1 damage', () => {
    expect(damage(2, 9)).toBe(1);
    expect(damage(7, 3)).toBe(6);
    expect(damage(5, 2)).toBe(4);
  });

  it('twice the speed means two hits per turn', () => {
    expect(hitsPerTurn(4, 2)).toBe(2);
    expect(hitsPerTurn(3, 2)).toBe(1);
    const r = simulateCombat([mk({ atk: 2, spd: 4 })], [foe({ hp: 10, def: 0, atk: 1, spd: 2 })], [], new Rng(1));
    expect(r.events.slice(1, 4).map((e) => e.type === 'attack' && e.side)).toEqual(['p', 'p', 'e']);
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
    const r = simulateCombat(team, [foe({ hp: 10, def: 0 })], [], new Rng(1), 2);
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
  it('starts with 5 TP, 5 Merdascore and 3 common starters', () => {
    const s = G.newRun(1);
    expect(s).toMatchObject({ phase: 'starter', concentration: 10, tp: 5, merdascore: 5, ap: 1 });
    expect(s.starters).toHaveLength(3);
    expect(s.starters.every((m) => m.rarity === 'common' && m.traits.length === 1)).toBe(true);
  });

  it('starter pick + bonus point enters preparation with wave 1 and a shop offer', () => {
    const s = prepRun();
    expect(s.phase).toBe('preparation');
    expect(s.team).toHaveLength(1);
    expect(s.wave).toHaveLength(1);
    expect(s.shopOffer).toHaveLength(3);
    const st = s.team[0].stats;
    expect(st.hp + st.atk + st.def + st.spd).toBe(10);
  });

  it('rare enemies get 8 extra points', () => {
    const wave = createWave(new Rng(9), 9, 1);
    for (const e of wave) expect(e.stats.hp + e.stats.atk + e.stats.def + e.stats.spd).toBe(4 + 8);
  });

  it('Concentrate needs more than 2 concentration and caps Merdascore', () => {
    expect(G.canConcentrate(prepRun({ concentration: 2 }))).toBe(false);
    const s = G.concentrate(prepRun({ merdascore: 18 }));
    expect(s).toMatchObject({ concentration: 8, merdascore: 20, ap: 0 });
  });

  it('Evacuate spends merdascore and AP, blocked when the team is full', () => {
    let s = G.evacuate(prepRun({ merdascore: 12 }), 'rare');
    expect(s).toMatchObject({ merdascore: 2, ap: 0 });
    expect(s.pending?.rarity).toBe('rare');
    s = G.assignBonusPoint(s, 'hp');
    expect(s.team).toHaveLength(2);
    const full = prepRun({ merdascore: 20 });
    full.team = Array.from({ length: 6 }, () => mk({}));
    expect(G.canEvacuate(full, 'common')).toBe(false);
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
    let s = prepRun({ items: ['brush', 'magazine', 'bidet', 'shower', 'window'] });
    s = G.continueAfterCombat(G.fight(s));
    expect([...s.shopOffer].sort()).toEqual(['toothbrush', 'towel']);
  });

  it('Hand Shower discounts Shop, Flush and Bonus Action by 2', () => {
    const s = prepRun({ tp: 30, items: ['shower'] });
    expect(G.tpCost(s, 'flush')).toBe(3);
    expect(G.tpCost(s, 'shop')).toBe(8);
    expect(G.tpCost(s, 'bonusAction')).toBe(18);
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

  it('the Action trait adds AP each round, and unspent AP do not carry over', () => {
    let s = prepRun();
    s.team[0].traits = ['action', 'action'];
    s = G.bonusAction({ ...s, tp: 20 });
    expect(s.ap).toBe(2);
    s = G.fight(s);
    expect(s.ap).toBe(0);
    s = G.continueAfterCombat(s);
    expect(s.ap).toBe(2); // 1 base + 1 from Action (2 traits)
  });

  it('Toothbrush adds unspent AP as combat HP', () => {
    const s = prepRun({ items: ['toothbrush'] });
    const after = G.fight(G.bonusAction({ ...s, tp: 20 }));
    expect(after.lastCombat!.player[0].maxHp).toBe(s.team[0].stats.hp + 2);
  });

  it('a lost wave costs at most 3 concentration and fallen Merdomon return at half HP', () => {
    const s = prepRun();
    s.team = [mk({ hp: 6, atk: 1, def: 1, spd: 1 })];
    s.wave = [foe({ hp: 10, atk: 9, spd: 9 }), foe({}), foe({}), foe({}), foe({})];
    const after = G.fight(s);
    expect(after.phase).toBe('combat');
    expect(after.lastCombat?.won).toBe(false);
    expect(after.concentration).toBe(7);
    expect(after.team[0].hp).toBe(3);
    expect(after.tp).toBe(5); // only the starting TP: the faster enemy kills before the Merdomon can strike
  });
});
