import { beforeEach, describe, expect, it } from 'vitest';
import { simulateCombat } from './combat';
import { ABILITY, BATHROOM_ACTION_POOP, EVACUATE_COST, HOTEL_ENTRY_FEE, bathroomOf } from './data';
import * as G from './game';
import { Rng } from './rng';
import { hasWon, isLevelUnlocked, loadBest, loadLastSetup, recordRun, saveLastSetup } from './save';
import type { BathroomId, Enemy, Merdomon, RunState } from './types';

function prep(bathroom: BathroomId = 'home', patch: Partial<RunState> = {}): RunState {
  let s = G.chooseStarter(G.beginRun(G.newRun(61), 1, bathroom), 0);
  s = G.confirmMerdomon(s, 'hp', s.pendingAbilities[0]);
  s = G.chooseStartBonus(s, 'resources');
  return { ...s, ...patch };
}

const mk = (id: number, patch: Partial<Merdomon> = {}): Merdomon => ({
  id,
  rarity: 'common',
  kind: 'normal',
  stats: { hp: 20, atk: 1, def: 1, spd: 1 },
  hp: 20,
  traits: [],
  ability: null,
  ...patch,
});
const foe = (stats: Partial<Enemy['stats']> = {}): Enemy => ({
  id: 99,
  rarity: 'common',
  kind: 'phone',
  stats: { hp: 30, atk: 1, def: 0, spd: 1, ...stats },
  boss: false,
});

describe('Merdomon', () => {
  it('a Huge Evacuate costs 15 Poop', () => {
    expect(EVACUATE_COST.epic).toBe(15);
  });

  it('new Merdomon pick 1 of 2 abilities (3 for the starter and with the Game Boy), with Re-Roll', () => {
    const start = G.chooseStarter(G.beginRun(G.newRun(61), 1, 'home'), 0);
    expect(start.pendingAbilities).toHaveLength(3);
    const s = prep('home', { merdascore: 20, ap: 2, tp: 10 });
    const evac = G.chooseEvacuated(G.evacuate(s, 'common'), 0);
    expect(evac.pendingAbilities).toHaveLength(2);
    const rolled = G.rerollAbilities({ ...evac, freeRerolls: 0 });
    expect(rolled.pendingAbilities).toHaveLength(2);
    expect(rolled.tp).toBe(evac.tp - G.rerollTp(evac));
    const gb = G.chooseEvacuated(G.evacuate({ ...s, items: ['gameboy'] }, 'common'), 0);
    expect(gb.pendingAbilities).toHaveLength(3);
  });
});

describe('abilities', () => {
  it('Leech heals at most twice against each enemy', () => {
    const r = simulateCombat([mk(1, { hp: 5, ability: 'leech' })], [foe({ atk: 2 })], [], new Rng(1));
    const heals = r.events.filter((e) => e.type === 'ability' && e.ability === 'leech');
    expect(heals.length).toBe(ABILITY.leechPerEnemy);
  });

  it('Cheerleader is shown again when the cheered Merdomon starts its first duel', () => {
    const r = simulateCombat(
      [mk(1, { stats: { hp: 1, atk: 1, def: 1, spd: 1 }, hp: 1, ability: 'cheerleader' }), mk(2)],
      [foe({ atk: 5, spd: 9 })],
      [],
      new Rng(1),
    );
    const cheers = r.events.filter((e) => e.type === 'ability' && e.ability === 'cheerleader');
    expect(cheers.map((e) => e.type === 'ability' && e.p)).toEqual([0, 1]);
  });
});

describe('items', () => {
  it('Razor: +1 TP per active trait', () => {
    const s = prep('home', { items: ['razor'], team: [mk(1, { traits: ['paper', 'fighter'] }), mk(2, { traits: ['fighter'] })] });
    // Paper 2 (Merdomon + Razor) and Fighter 2: two active traits.
    expect(G.previewRewards(s).sure).toContainEqual({ source: 'razor', resource: 'tp', amount: 2 });
  });
});

describe('bathroom rules', () => {
  it('Hotel: without the Entry Fee every enemy gets +1 to a random stat', () => {
    const s = prep('hotel', { tp: 20 });
    const total = (e: Enemy | { atk: number; hp: number; def: number; spd: number }) =>
      'stats' in e ? e.stats.hp + e.stats.atk + e.stats.def + e.stats.spd : 0;
    const skipped = G.fight(s);
    expect(skipped.lastCombat!.entryFeeSkipped).toBe(true);
    expect(skipped.lastCombat!.enemies[0].maxHp + skipped.lastCombat!.enemies[0].atk).toBeGreaterThanOrEqual(0);
    const paid = G.payEntryFee(s);
    expect(paid.tp).toBe(20 - HOTEL_ENTRY_FEE);
    expect(G.canPayEntryFee(paid)).toBe(false);
    expect(G.fight(paid).lastCombat!.entryFeeSkipped).toBe(false);
    const before = s.wave.reduce((t, e) => t + total(e), 0);
    const after = skipped.lastCombat!.enemies.reduce((t, e) => t + e.maxHp + e.atk + e.def + e.spd, 0);
    expect(after).toBe(before + s.wave.length);
  });

  it('Office: Coffee Break, +1 AP for 8 Poop once per round', () => {
    const s = prep('office', { merdascore: 10, ap: 1 });
    const after = G.bathroomAction(s);
    expect(after).toMatchObject({ ap: 2, merdascore: 10 - BATHROOM_ACTION_POOP, bathroomActionUsed: true });
    expect(G.canBathroomAction({ ...after, merdascore: 20 })).toBe(false);
  });

  it('Public: Wall Graffiti gives a Merdomon a trait the team does not have (any one if it has them all)', () => {
    const s = prep('public', { merdascore: 10, items: [], team: [mk(1, { traits: ['paper'] }), mk(2, { traits: [] })] });
    const after = G.bathroomAction(s);
    const traits = after.team.flatMap((m) => m.traits);
    expect(traits).toHaveLength(2);
    expect(traits.filter((t) => t === 'paper')).toHaveLength(1);
    const all = ['paper', 'merdon', 'healthy', 'haste', 'fighter', 'defender', 'action'] as const;
    const full = G.bathroomAction({ ...s, team: [mk(1, { traits: [...all] })] });
    expect(full.team[0].traits).toHaveLength(8);
  });

  it('Home: Comfort gives +1 HP to everyone in the next fight only', () => {
    const s = prep('home', { merdascore: 10 });
    const comfy = G.bathroomAction(s);
    expect(comfy.comfortHp).toBe(1);
    const fought = G.fight(comfy);
    expect(fought.lastCombat!.player[0].maxHp).toBe(fought.team[0].stats.hp + 1);
    expect(fought.comfortHp).toBe(0);
  });

  it('Hotel has no bathroom action', () => {
    expect(G.canBathroomAction(prep('hotel', { merdascore: 20 }))).toBe(false);
  });
});

describe('journeys', () => {
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

  it('old A/B bathrooms count as their type', () => {
    expect(['publicA', 'publicB', 'home', 'nope'].map(bathroomOf)).toEqual(['public', 'public', 'home', null]);
  });

  it('old wins and records count for their bathroom', () => {
    const run = { lines: [{ label: 'Merdomon created', count: 1, points: 10 }] };
    localStorage.setItem(
      'dot.history',
      JSON.stringify([
        { ...run, id: 'a', level: 2, bathroom: 'publicB', victory: true, score: 900 },
        { ...run, id: 'b', level: 2, bathroom: 'homeA', victory: false, score: 1200 },
      ]),
    );
    expect(hasWon('public', 2)).toBe(true);
    expect(isLevelUnlocked(3, 'public')).toBe(true);
    expect(isLevelUnlocked(3, 'home')).toBe(false);
    expect(loadBest(2, 'public')).toBe(900);
    expect(loadBest(2)).toBe(1200);
  });

  it('a win unlocks the next level of that bathroom only, and the last choice is remembered', () => {
    recordRun({ ...prep('hotel'), phase: 'victory' }, 'w');
    expect(isLevelUnlocked(2, 'hotel')).toBe(true);
    expect(isLevelUnlocked(2, 'office')).toBe(false);
    expect(loadLastSetup()).toEqual({ bathroom: 'office', level: 1 });
    saveLastSetup('hotel', 2);
    expect(loadLastSetup()).toEqual({ bathroom: 'hotel', level: 2 });
  });
});
