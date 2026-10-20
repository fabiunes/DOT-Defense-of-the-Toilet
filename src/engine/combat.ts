import { ABILITY, JACKPOT, TOWEL_BONUS, TOWEL_KIND } from './data';
import type { Rng } from './rng';
import { combatBonus } from './traits';
import type { AbilityId, BossId, CombatEvent, Enemy, Fighter, ItemId, Merdomon, ModifierId, Side } from './types';

export interface CombatResult {
  won: boolean;
  events: CombatEvent[];
  /** Start-of-combat snapshots (after trait, item and start-of-fight ability bonuses). */
  player: Fighter[];
  enemies: Fighter[];
  /** Combat HP of each Merdomon at the end (0 = fallen). */
  hpAfter: number[];
  /** HP of each enemy at the end (0 = defeated). */
  enemyHpAfter: number[];
  /** Enemies defeated by each Merdomon (any of its damage). */
  kills: number[];
  survivors: number;
  enemySurvivors: number;
  damageDealt: number;
  enemiesDefeated: number;
  merdomonFallen: number;
}

export interface CombatOptions {
  /** Added to every Merdomon's HP for this combat only (Toothbrush). */
  extraHp?: number;
  modifier?: ModifierId | null;
  /** The run's Boss, for its in-fight ability. */
  bossId?: BossId;
}

/** Defense blocks half its value (rounded down); at least 1 damage always goes through. */
export function damage(atk: number, def: number, reduction = 0): number {
  return Math.max(1, atk - Math.floor(def / 2) - reduction);
}

/** With Flip-Flops, a Merdomon at least twice as fast as its opponent hits twice per turn. */
export function hitsPerTurn(spd: number, opponentSpd: number, flipFlops: boolean): number {
  return flipFlops && spd >= opponentSpd * 2 ? 2 : 1;
}

export function simulateCombat(
  team: readonly Merdomon[],
  wave: readonly Enemy[],
  items: readonly ItemId[],
  rng: Rng,
  { extraHp = 0, modifier = null, bossId }: CombatOptions = {},
): CombatResult {
  const events: CombatEvent[] = [];
  const silent = modifier === 'silentMode';
  const has = (i: number, a: AbilityId) => !silent && team[i]?.ability === a;

  const bonus =
    modifier === 'wifiDown' ? { hp: 0, atk: 0, def: 0, spd: 0 } : combatBonus(team, items);
  bonus.hp += extraHp;
  const towel = (m: Merdomon) => items.some((i) => TOWEL_KIND[i] === m.kind);
  const ps: Fighter[] = team.map((m) => {
    const t = towel(m);
    return {
      id: m.id,
      rarity: m.rarity,
      kind: m.kind,
      boss: false,
      ability: m.ability,
      maxHp: m.stats.hp + bonus.hp + (t ? TOWEL_BONUS.hp : 0),
      hp: m.hp + bonus.hp + (t ? TOWEL_BONUS.hp : 0),
      atk: m.stats.atk + bonus.atk + (t ? TOWEL_BONUS.atk : 0),
      def: m.stats.def + bonus.def,
      spd: m.stats.spd + bonus.spd,
    };
  });
  const jackpot = modifier === 'jackpot';
  const es: Fighter[] = wave.map((e) => ({
    id: e.id,
    rarity: e.rarity,
    kind: e.kind,
    boss: e.boss,
    bossForm: e.bossForm,
    ability: null,
    hp: e.stats.hp + (jackpot ? JACKPOT.hp : 0),
    maxHp: e.stats.hp + (jackpot ? JACKPOT.hp : 0),
    atk: e.stats.atk + (jackpot ? JACKPOT.atk : 0),
    def: e.stats.def,
    spd: e.stats.spd,
  }));

  // Start-of-fight abilities (part of the snapshot shown before the fight).
  ps.forEach((p, i) => {
    if (has(i, 'frontliner') && i === 0) {
      p.maxHp += ABILITY.frontlinerHp;
      p.hp += ABILITY.frontlinerHp;
      p.def += ABILITY.frontlinerDef;
      events.push({ type: 'ability', ability: 'frontliner', p: i });
    }
    if (has(i, 'rearGuard') && i === ps.length - 1) {
      p.def += ABILITY.rearGuardDef;
      events.push({ type: 'ability', ability: 'rearGuard', p: i });
    }
    if (has(i, 'cheerleader') && ps[i + 1]) {
      ps[i + 1].atk += ABILITY.cheerleaderAtk;
      events.push({ type: 'ability', ability: 'cheerleader', p: i });
    }
  });
  const player = ps.map((f) => ({ ...f }));
  const enemies = es.map((f) => ({ ...f }));

  let magazineReady = items.includes('magazine');
  let windowReady = items.includes('window');
  const flipFlops = items.includes('flipflops');
  const secondWindUsed = ps.map(() => false);
  let extraLifeUsed = false;
  const kills = ps.map(() => 0);
  let damageDealt = 0;
  let merdomonFallen = 0;
  let pi = 0;
  let ei = 0;
  const teamSpeed = (fs: Fighter[]) => fs.reduce((sum, f) => sum + (f.hp > 0 ? f.spd : 0), 0);

  /** Deals damage to enemy `idx` (capped at its HP) and counts it for the wave's Toilet Paper. */
  const hitEnemy = (idx: number, amount: number): number => {
    const target = es[idx];
    const dealt = Math.min(amount, target.hp);
    target.hp -= dealt;
    damageDealt += dealt;
    return dealt;
  };
  /** Enemy `idx` is at 0 HP: the StreamDeck may come back (Extra Life), otherwise it falls. */
  const enemyDown = (idx: number, from: number) => {
    const x = es[idx];
    if (x.boss && bossId === 'streamDeck' && !extraLifeUsed) {
      extraLifeUsed = true;
      x.hp = x.bossForm === 'final' ? x.maxHp : Math.ceil(x.maxHp / 2);
      events.push({ type: 'boss', boss: bossId, index: idx, hp: x.hp });
      return;
    }
    enemyFalls(idx, from);
  };
  /** Enemy `idx` falls to Merdomon `from`: counts the kill and triggers Snowball. */
  const enemyFalls = (idx: number, from: number) => {
    events.push({ type: 'death', side: 'e', index: idx });
    kills[from]++;
    if (has(from, 'snowball')) {
      ps[from].atk += ABILITY.snowballAtk;
      events.push({ type: 'ability', ability: 'snowball', p: from });
    }
  };

  while (pi < ps.length) {
    while (ei < es.length && es[ei].hp <= 0) ei++;
    if (ei >= es.length) break;
    const p = ps[pi];
    const e = es[ei];
    const eSpd = has(pi, 'stinkyAura') ? Math.max(0, e.spd - ABILITY.stinkySpd) : e.spd;

    let first: Side;
    if (modifier === 'rushHour') first = 'e';
    else if (p.spd !== eSpd) first = p.spd > eSpd ? 'p' : 'e';
    else {
      const a = teamSpeed(ps);
      const b = teamSpeed(es);
      first = a !== b ? (a > b ? 'p' : 'e') : rng.next() < 0.5 ? 'p' : 'e';
    }
    events.push({ type: 'duel', p: pi, e: ei, first });
    if (has(pi, 'stinkyAura')) events.push({ type: 'ability', ability: 'stinkyAura', p: pi });

    let turn = first;
    while (p.hp > 0 && e.hp > 0) {
      if (turn === 'p') {
        const hits = hitsPerTurn(p.spd, eSpd, flipFlops) + (windowReady && pi === 0 ? 1 : 0);
        if (pi === 0) windowReady = false;
        const atk = p.atk + (has(pi, 'giantSlayer') && e.rarity !== 'common' ? ABILITY.giantSlayerAtk : 0);
        for (let h = 0; h < hits && e.hp > 0; h++) {
          const dealt = hitEnemy(ei, damage(atk, e.def));
          events.push({ type: 'attack', side: 'p', damage: dealt, hp: e.hp, double: h > 0 });
          if (e.hp <= 0) enemyDown(ei, pi);
          if (has(pi, 'leech') && dealt > 0 && p.hp < p.maxHp) {
            p.hp = Math.min(p.maxHp, p.hp + ABILITY.leech);
            events.push({ type: 'ability', ability: 'leech', p: pi, target: { side: 'p', index: pi, hp: p.hp } });
          }
          if (has(pi, 'splash')) {
            const next = es.findIndex((x, j) => j > ei && x.hp > 0);
            if (next >= 0) {
              hitEnemy(next, ABILITY.splash);
              events.push({ type: 'ability', ability: 'splash', p: pi, target: { side: 'e', index: next, hp: es[next].hp } });
              if (es[next].hp <= 0) enemyDown(next, pi);
            }
          }
        }
      } else {
        const reduction = has(pi, 'thickSkin') ? ABILITY.thickSkin : 0;
        const dealt = Math.min(damage(e.atk, p.def, reduction), p.hp);
        p.hp -= dealt;
        events.push({ type: 'attack', side: 'e', damage: dealt, hp: p.hp, double: false });
        if (e.boss && bossId === 'bestseller') {
          e.def += 1;
          if (e.bossForm === 'final') e.atk += 1;
          events.push({ type: 'boss', boss: bossId, index: ei });
        }
        if (has(pi, 'spiky')) {
          hitEnemy(ei, ABILITY.spiky);
          events.push({ type: 'ability', ability: 'spiky', p: pi, target: { side: 'e', index: ei, hp: e.hp } });
          if (e.hp <= 0) enemyDown(ei, pi);
        }
      }
      turn = turn === 'p' ? 'e' : 'p';
    }

    if (p.hp <= 0 && has(pi, 'secondWind') && !secondWindUsed[pi]) {
      secondWindUsed[pi] = true;
      p.hp = ABILITY.secondWindHp;
      events.push({ type: 'ability', ability: 'secondWind', p: pi, target: { side: 'p', index: pi, hp: p.hp } });
    }
    if (p.hp <= 0) {
      events.push({ type: 'death', side: 'p', index: pi });
      if (has(pi, 'lastGasp') && e.hp > 0) {
        hitEnemy(ei, ABILITY.lastGasp);
        events.push({ type: 'ability', ability: 'lastGasp', p: pi, target: { side: 'e', index: ei, hp: e.hp } });
        if (e.hp <= 0) enemyDown(ei, pi);
      }
      if (magazineReady) {
        magazineReady = false;
        p.hp = p.maxHp;
        events.push({ type: 'revive', index: pi, hp: p.hp });
      } else {
        merdomonFallen++;
        if (has(pi, 'legacy') && ps[pi + 1]) {
          ps[pi + 1].atk += ABILITY.legacyAtk;
          events.push({ type: 'ability', ability: 'legacy', p: pi });
        }
        if (modifier === 'doomscrolling') {
          for (const x of es) x.atk += 1;
          events.push({ type: 'modifier', modifier });
        }
        pi++;
      }
    }
  }

  const enemySurvivors = es.filter((f) => f.hp > 0).length;
  const won = enemySurvivors === 0;
  events.push({ type: 'end', won });

  return {
    won,
    events,
    player,
    enemies,
    hpAfter: ps.map((f) => Math.max(0, f.hp)),
    enemyHpAfter: es.map((f) => Math.max(0, f.hp)),
    kills,
    survivors: ps.filter((f) => f.hp > 0).length,
    enemySurvivors,
    damageDealt,
    enemiesDefeated: es.length - enemySurvivors,
    merdomonFallen,
  };
}
