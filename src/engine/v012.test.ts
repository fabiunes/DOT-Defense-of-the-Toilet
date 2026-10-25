import { describe, expect, it } from 'vitest';
import { WAVES } from './data';
import * as G from './game';
import type { RunState } from './types';

function prep(patch: Partial<RunState> = {}): RunState {
  let s = G.chooseStarter(G.beginRun(G.newRun(41), 1, 'home'), 0);
  s = G.confirmMerdomon(s, 'hp', s.pendingAbilities[0]);
  s = G.chooseStartBonus(s, 'resources');
  return { ...s, ...patch };
}

describe('Round recap', () => {
  it('logs every wave fought: enemies, outcome, Concentration lost and gains', () => {
    const s = prep();
    expect(s.waveLog).toEqual([]);
    const strong = { ...s, team: s.team.map((m) => ({ ...m, stats: { hp: 30, atk: 30, def: 30, spd: 30 }, hp: 30 })) };
    const won = G.fight(strong);
    const entry = won.waveLog![0];
    expect(entry).toMatchObject({ round: 1, won: true, concentrationLost: 0 });
    expect(entry.enemies).toHaveLength(s.wave.length);
    expect(entry.enemies.every((e) => e.defeated)).toBe(true);
    expect(entry.gains.tp).toBeGreaterThan(0);

    const weak = { ...s, team: s.team.map((m) => ({ ...m, stats: { hp: 1, atk: 1, def: 1, spd: 1 }, hp: 1, ability: null })) };
    const lost = G.fight(weak).waveLog![0];
    expect(lost.won).toBe(false);
    expect(lost.concentrationLost).toBe(s.concentration - G.fight(weak).concentration);
  });

  it('keeps logging in runs saved before v0.12 (no log yet)', () => {
    const s = prep();
    const old = { ...s } as RunState;
    delete old.waveLog;
    expect(G.fight(old).waveLog).toHaveLength(1);
  });

  it('plans coming waves by size, with the Boss and the modifier', () => {
    const s = prep({ modifiers: { 3: 'groupChat', 6: 'jackpot' } });
    expect(G.wavePlan(s, 3)).toEqual({ small: WAVES[2].common + 1, big: WAVES[2].rare, boss: null, modifier: 'groupChat' });
    expect(G.wavePlan(s, 5).boss).toBe('mid');
    expect(G.wavePlan(s, 10).boss).toBe('final');
    expect(G.wavePlan(s, 6).modifier).toBe('jackpot');
    expect(G.wavePlan({ ...s, boss: 'groupAdmin' }, 10).small).toBe(WAVES[9].common + 1);
  });
});
