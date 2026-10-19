import type { Rng } from './rng';
import { combatBonus } from './traits';
import type { CombatEvent, Enemy, Fighter, ItemId, Merdomon, Side } from './types';

export interface CombatResult {
  won: boolean;
  events: CombatEvent[];
  /** Start-of-combat snapshots. */
  player: Fighter[];
  enemies: Fighter[];
  /** Combat HP of each Merdomon at the end (0 = fallen). */
  hpAfter: number[];
  survivors: number;
  enemySurvivors: number;
  damageDealt: number;
  enemiesDefeated: number;
  merdomonFallen: number;
}

/** Defense blocks half its value (rounded down); at least 1 damage always goes through. */
export function damage(atk: number, def: number): number {
  return Math.max(1, atk - Math.floor(def / 2));
}

/** With Flip-Flops, a Merdomon at least twice as fast as its opponent hits twice per turn. */
export function hitsPerTurn(spd: number, opponentSpd: number, flipFlops: boolean): number {
  return flipFlops && spd >= opponentSpd * 2 ? 2 : 1;
}

/** `extraHp` is added to every Merdomon for this combat only (Toothbrush). */
export function simulateCombat(
  team: readonly Merdomon[],
  wave: readonly Enemy[],
  items: readonly ItemId[],
  rng: Rng,
  extraHp = 0,
): CombatResult {
  const bonus = combatBonus(team, items);
  bonus.hp += extraHp;
  const player: Fighter[] = team.map((m) => ({
    id: m.id,
    rarity: m.rarity,
    kind: m.kind,
    boss: false,
    maxHp: m.stats.hp + bonus.hp,
    hp: m.hp + bonus.hp,
    atk: m.stats.atk + bonus.atk,
    def: m.stats.def + bonus.def,
    spd: m.stats.spd + bonus.spd,
  }));
  const enemies: Fighter[] = wave.map((e) => ({
    id: e.id,
    rarity: e.rarity,
    kind: e.kind,
    boss: e.boss,
    ...e.stats,
    maxHp: e.stats.hp,
  }));
  const ps = player.map((f) => ({ ...f }));
  const es = enemies.map((f) => ({ ...f }));

  const events: CombatEvent[] = [];
  let magazineReady = items.includes('magazine');
  let windowReady = items.includes('window');
  const flipFlops = items.includes('flipflops');
  let damageDealt = 0;
  let merdomonFallen = 0;
  let pi = 0;
  let ei = 0;
  const teamSpeed = (fs: Fighter[]) => fs.reduce((sum, f) => sum + (f.hp > 0 ? f.spd : 0), 0);

  while (pi < ps.length && ei < es.length) {
    const p = ps[pi];
    const e = es[ei];

    let first: Side;
    if (p.spd !== e.spd) first = p.spd > e.spd ? 'p' : 'e';
    else {
      const a = teamSpeed(ps);
      const b = teamSpeed(es);
      first = a !== b ? (a > b ? 'p' : 'e') : rng.next() < 0.5 ? 'p' : 'e';
    }
    events.push({ type: 'duel', p: pi, e: ei, first });

    let turn = first;
    while (p.hp > 0 && e.hp > 0) {
      if (turn === 'p') {
        const hits = hitsPerTurn(p.spd, e.spd, flipFlops) + (windowReady && pi === 0 ? 1 : 0);
        if (pi === 0) windowReady = false;
        for (let h = 0; h < hits && e.hp > 0; h++) {
          const dealt = Math.min(damage(p.atk, e.def), e.hp);
          e.hp -= dealt;
          damageDealt += dealt;
          events.push({ type: 'attack', side: 'p', damage: dealt, hp: e.hp, double: h > 0 });
        }
      } else {
        const dealt = Math.min(damage(e.atk, p.def), p.hp);
        p.hp -= dealt;
        events.push({ type: 'attack', side: 'e', damage: dealt, hp: p.hp, double: false });
      }
      turn = turn === 'p' ? 'e' : 'p';
    }

    if (e.hp <= 0) {
      events.push({ type: 'death', side: 'e', index: ei });
      ei++;
    }
    if (p.hp <= 0) {
      events.push({ type: 'death', side: 'p', index: pi });
      if (magazineReady) {
        magazineReady = false;
        p.hp = p.maxHp;
        events.push({ type: 'revive', index: pi, hp: p.hp });
      } else {
        merdomonFallen++;
        pi++;
      }
    }
  }

  const won = ei >= es.length;
  events.push({ type: 'end', won });

  return {
    won,
    events,
    player,
    enemies,
    hpAfter: ps.map((f) => Math.max(0, f.hp)),
    survivors: ps.filter((f) => f.hp > 0).length,
    enemySurvivors: es.filter((f) => f.hp > 0).length,
    damageDealt,
    enemiesDefeated: ei,
    merdomonFallen,
  };
}
