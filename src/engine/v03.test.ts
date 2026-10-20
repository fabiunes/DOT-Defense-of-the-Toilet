import { describe, expect, it } from 'vitest';
import { simulateCombat } from './combat';
import { ABILITIES, MODIFIER_WAVES, START_PACK } from './data';
import * as G from './game';
import { Rng } from './rng';
import type { AbilityId, Enemy, Merdomon, RunState, Stats } from './types';

const mk = (stats: Partial<Stats>, ability: AbilityId | null = null, extra: Partial<Merdomon> = {}): Merdomon => {
  const s = { hp: 5, atk: 3, def: 1, spd: 1, ...stats };
  return { id: Math.random(), rarity: 'common', kind: 'normal', stats: s, hp: s.hp, traits: [], ability, ...extra };
};
const foe = (stats: Partial<Stats>, extra: Partial<Enemy> = {}): Enemy => ({
  id: Math.random(),
  rarity: 'common',
  kind: 'phone',
  stats: { hp: 5, atk: 3, def: 1, spd: 1, ...stats },
  boss: false,
  ...extra,
});
/** A run past the starter pick (first ability offered), at the starting-bonus choice. */
const start = (seed: number) => {
  const s = G.chooseStarter(G.beginRun(G.newRun(seed)), 0);
  return G.confirmMerdomon(s, 'hp', s.pendingAbilities[0]);
};
const fight = (team: Merdomon[], wave: Enemy[], modifier: Parameters<typeof simulateCombat>[4] = {}) =>
  simulateCombat(team, wave, [], new Rng(1), modifier);
const abilityEvents = (r: ReturnType<typeof fight>, a: AbilityId) =>
  r.events.filter((e) => e.type === 'ability' && e.ability === a);

describe('new Merdomon flow', () => {
  it('offers 3 distinct abilities and confirms ability + stat together', () => {
    let s = G.chooseStarter(G.beginRun(G.newRun(5)), 1);
    expect(new Set(s.pendingAbilities).size).toBe(3);
    expect(s.pendingAbilities.every((a) => ABILITIES.includes(a))).toBe(true);
    const notOffered = ABILITIES.find((a) => !s.pendingAbilities.includes(a))!;
    expect(G.canConfirm(s, 'hp', notOffered)).toBe(false);
    const atk = s.pending!.stats.atk;
    s = G.confirmMerdomon(s, 'atk', s.pendingAbilities[2]);
    expect(s.team[0].ability).toBe(s.team[0].ability);
    expect(s.team[0].stats.atk).toBe(atk + 1);
    expect(s.phase).toBe('startBonus');
  });
});

describe('starting bonus', () => {
  const atBonus = () => start(7);
  it('item: adds the offered item', () => {
    const s0 = atBonus();
    const s = G.chooseStartBonus(s0, 'item');
    expect(s.items).toEqual([s0.startOptions!.item]);
    expect(s).toMatchObject({ phase: 'preparation', ap: 1, tp: 2 });
  });
  it('merdomon: a Small one goes through the ability + stat screen, then preparation', () => {
    let s = G.chooseStartBonus(atBonus(), 'merdomon');
    expect(s.pending?.rarity).toBe('common');
    expect(s.phase).toBe('startBonus');
    s = G.confirmMerdomon(s, 'def', s.pendingAbilities[0]);
    expect(s.team).toHaveLength(2);
    expect(s.phase).toBe('preparation');
  });
  it('resources: +5 TP, +3 Poop, +1 AP in round 1', () => {
    let s = G.chooseStartBonus(atBonus(), 'resources');
    expect(s).toMatchObject({ tp: 2 + START_PACK.tp, merdascore: 5 + START_PACK.merdascore, ap: 2 });
    s = G.continueAfterCombat(G.fight(s));
    expect(s.ap).toBe(3); // the 2 unspent AP carry over, +1 base
  });
});

describe('waves', () => {
  it('waves 2–4 have one extra Small', () => {
    let s = G.chooseStartBonus(start(3), 'item');
    const counts: number[] = [];
    for (let round = 1; round <= 4; round++) {
      counts.push(s.wave.filter((e) => !e.extra).length);
      s = G.continueAfterCombat(G.fight({ ...s, concentration: 10 }));
    }
    expect(counts).toEqual([1, 3, 4, 5]);
  });
});

describe('abilities', () => {
  it('Cheerleader, Frontliner and Rear Guard apply at the start', () => {
    const r = fight([mk({}, 'cheerleader'), mk({}, 'frontliner'), mk({}, 'rearGuard')], [foe({})]);
    expect(r.player[1].atk).toBe(4); // cheered
    expect(r.player[1].def).toBe(1); // frontliner is not first
    expect(r.player[2].def).toBe(3);
    const f = fight([mk({}, 'frontliner')], [foe({})]);
    expect(f.player[0]).toMatchObject({ maxHp: 7, def: 2 });
  });

  it('Thick Skin reduces damage (min 1) and Spiky hurts the attacker', () => {
    const thick = fight([mk({ hp: 10, def: 0 }, 'thickSkin')], [foe({ atk: 3, spd: 9, hp: 99 })]);
    expect(thick.events.find((e) => e.type === 'attack' && e.side === 'e')).toMatchObject({ damage: 2 });
    const spiky = fight([mk({ hp: 10, atk: 1 }, 'spiky')], [foe({ hp: 2, atk: 1, spd: 9, def: 0 })]);
    expect(abilityEvents(spiky, 'spiky').length).toBeGreaterThan(0);
    expect(spiky.won).toBe(true);
  });

  it('Splash damages the next enemy, which may fall before its turn', () => {
    const r = fight([mk({ atk: 5, spd: 9 }, 'splash')], [foe({ hp: 10 }), foe({ hp: 1 }), foe({ hp: 1 })]);
    expect(r.events.filter((e) => e.type === 'death' && e.side === 'e').length).toBe(3);
    expect(r.events.filter((e) => e.type === 'duel').length).toBe(1); // both splashed enemies fall before their turn
    expect(r.won).toBe(true);
  });

  it('Giant Slayer hits Big enemies harder; Snowball grows with kills', () => {
    const gs = fight([mk({ atk: 3, spd: 9 }, 'giantSlayer')], [foe({ hp: 30, def: 0 }, { rarity: 'rare' })]);
    expect(gs.events.find((e) => e.type === 'attack' && e.side === 'p')).toMatchObject({ damage: 5 });
    const sb = fight([mk({ atk: 2, spd: 9, hp: 30 }, 'snowball')], [foe({ hp: 2, def: 0 }), foe({ hp: 9, def: 0 })]);
    expect(abilityEvents(sb, 'snowball').length).toBe(2);
  });

  it('Leech heals, Second Wind saves once', () => {
    const lc = fight([mk({ hp: 5, atk: 1, spd: 9 }, 'leech', { hp: 3 })], [foe({ hp: 3, def: 0, atk: 1 })]);
    expect(abilityEvents(lc, 'leech').length).toBeGreaterThan(0);
    const sw = fight([mk({ hp: 1, atk: 1 }, 'secondWind')], [foe({ hp: 99, atk: 9, spd: 9 })]);
    expect(abilityEvents(sw, 'secondWind')).toHaveLength(1);
    expect(sw.merdomonFallen).toBe(1);
  });

  it('Last Gasp hits the killer, Legacy boosts the next one', () => {
    const lg = fight([mk({ hp: 1, atk: 1 }, 'lastGasp')], [foe({ hp: 3, atk: 9, spd: 9 })]);
    expect(lg.won).toBe(true);
    const le = fight([mk({ hp: 1 }, 'legacy'), mk({ atk: 1 })], [foe({ hp: 99, atk: 9, spd: 9, def: 0 })]);
    expect(abilityEvents(le, 'legacy')).toHaveLength(1);
  });

  it('Stinky Aura slows the enemy it faces', () => {
    const r = fight([mk({ spd: 2 }, 'stinkyAura')], [foe({ spd: 2 })]);
    expect(r.events[0]).toMatchObject({ type: 'duel', first: 'p' });
  });

  it('Collector and Fertilizer pay out after the wave', () => {
    let s = G.chooseStartBonus(start(9), 'item');
    s = { ...s, items: [], tp: 0, merdascore: 0 };
    s.team = [mk({ atk: 9, spd: 9, hp: 9 }, 'collector'), mk({}, 'fertilizer')];
    const after = G.fight(s);
    const rewards = after.lastCombat!.rewards;
    expect(rewards).toContainEqual({ source: 'collector', resource: 'tp', amount: 2 * s.wave.length });
    expect(rewards).toContainEqual({ source: 'fertilizer', resource: 'merdascore', amount: 1 });
  });
});

describe('wave modifiers', () => {
  const runAt = (round: number, patch: Partial<RunState> = {}): RunState => {
    let s = G.chooseStartBonus(start(11), 'item');
    while (s.round < round) s = G.continueAfterCombat(G.fight({ ...s, concentration: 10 }));
    return { ...s, ...patch };
  };

  it('plans one distinct modifier on waves 3, 6 and 9', () => {
    for (let seed = 1; seed < 60; seed++) {
      const m = G.newRun(seed).modifiers;
      expect(Object.keys(m).map(Number)).toEqual([3, 6, 9]);
      expect(Object.keys(m).map(Number)).toEqual([...MODIFIER_WAVES]);
      expect(new Set(Object.values(m)).size).toBe(3);
    }
  });

  it('Group Chat adds a Small enemy at the front; disabling removes it and costs 3 TP', () => {
    const base = runAt(3);
    const s = { ...base, modifiers: { ...base.modifiers, 3: 'groupChat' as const } };
    // Re-enter round 3 with the forced modifier.
    const prev = runAt(2);
    const r3 = G.continueAfterCombat(G.fight({ ...prev, concentration: 10, modifiers: s.modifiers }));
    expect(r3.wave[0].extra).toBe(true);
    expect(r3.wave).toHaveLength(5);
    const off = G.disableModifier({ ...r3, tp: 5 });
    expect(off.tp).toBe(2);
    expect(off.wave).toHaveLength(4);
    expect(G.activeModifier(off)).toBeNull();
  });

  it('cannot be disabled on wave 10', () => {
    const s = runAt(3, { round: 10, tp: 20 });
    expect(G.canDisableModifier(s)).toBe(false);
  });

  it('winning a modifier wave gives +1 AP next round; disabling loses it', () => {
    const s = runAt(3, { tp: 10 });
    const strong = [mk({ hp: 10, atk: 10, def: 10, spd: 10 }), mk({ hp: 10, atk: 10, def: 10, spd: 10 })];
    const modded = { ...s, team: strong, modifiers: { ...s.modifiers, 3: 'rushHour' as const } };
    const won = G.continueAfterCombat(G.fight(modded));
    expect(won.ap).toBe(Math.min(5, s.ap + 2)); // kept + base + reward
    const paid = G.continueAfterCombat(G.fight(G.disableModifier(modded)));
    expect(paid.ap).toBe(Math.min(5, s.ap + 1));
  });

  it('Rush Hour, Wi-Fi Down, Silent Mode, Doomscrolling, Jackpot change the fight', () => {
    expect(fight([mk({ spd: 9 })], [foe({ spd: 1 })], { modifier: 'rushHour' }).events[0]).toMatchObject({ first: 'e' });
    const traitTeam = [mk({}, null, { traits: ['fighter', 'fighter'] })];
    expect(fight(traitTeam, [foe({})], { modifier: 'wifiDown' }).player[0].atk).toBe(3);
    expect(abilityEvents(fight([mk({}, 'frontliner')], [foe({})], { modifier: 'silentMode' }), 'frontliner')).toHaveLength(0);
    const doom = fight([mk({ hp: 1 }), mk({ hp: 1 })], [foe({ hp: 99, spd: 9 })], { modifier: 'doomscrolling' });
    expect(doom.events.filter((e) => e.type === 'modifier')).toHaveLength(2);
    expect(fight([mk({})], [foe({})], { modifier: 'jackpot' }).enemies[0]).toMatchObject({ atk: 4, maxHp: 6 });
  });

  it('Jackpot doubles the wave TP and Merdascore', () => {
    const s = runAt(3);
    const strong = [mk({ hp: 10, atk: 10, def: 10, spd: 10 })];
    const after = G.fight({ ...s, team: strong, modifiers: { ...s.modifiers, 3: 'jackpot' as const } });
    const sum = (res: string, src?: string) =>
      after.lastCombat!.rewards.filter((r) => r.resource === res && (src ? r.source === src : r.source !== 'jackpot')).reduce((t, r) => t + r.amount, 0);
    expect(sum('tp', 'jackpot')).toBe(sum('tp'));
    expect(sum('merdascore', 'jackpot')).toBe(sum('merdascore'));
  });
});
