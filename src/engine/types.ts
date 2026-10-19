export type Rarity = 'common' | 'rare' | 'epic';
export type StatKey = 'hp' | 'atk' | 'def' | 'spd';
export type TraitId = 'paper' | 'merdon' | 'healthy' | 'haste' | 'fighter' | 'defender' | 'action';
export type ItemId = 'brush' | 'magazine' | 'bidet' | 'shower' | 'window' | 'towel' | 'toothbrush' | 'flipflops' | 'gameboy';
export type MerdomonKind = 'normal' | 'runny' | 'fart';
export type EnemyKind = 'phone' | 'book' | 'console';
export type AbilityId = 'generic';

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface Merdomon {
  id: number;
  /** Size: common = Small, rare = Big, epic = Huge. */
  rarity: Rarity;
  kind: MerdomonKind;
  /** Base stats; `stats.hp` is the max HP. */
  stats: Stats;
  /** Current HP, persists between rounds. */
  hp: number;
  traits: TraitId[];
  ability: AbilityId;
}

export interface Enemy {
  id: number;
  rarity: Rarity;
  kind: EnemyKind;
  stats: Stats;
  ability: AbilityId;
  boss: boolean;
}

export type Side = 'p' | 'e';

/** Snapshot of a combatant with combat-time stats (trait bonuses applied). */
export interface Fighter {
  id: number;
  rarity: Rarity;
  kind: MerdomonKind | EnemyKind;
  boss: boolean;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export type CombatEvent =
  | { type: 'duel'; p: number; e: number; first: Side }
  /** `side` is the attacker; `hp` is the target's HP after the hit. */
  | { type: 'attack'; side: Side; damage: number; hp: number; double: boolean }
  | { type: 'death'; side: Side; index: number }
  | { type: 'revive'; index: number; hp: number }
  | { type: 'end'; won: boolean };

export type Resource = 'tp' | 'merdascore' | 'concentration';
export type RewardSource = 'survivors' | 'enemies' | 'damage' | TraitId | ItemId;

export interface Reward {
  source: RewardSource;
  resource: Resource;
  amount: number;
}

/** A combat-start modifier, shown before the fight. Items without a stat are passive effects. */
export interface CombatBonus {
  source: TraitId | ItemId;
  stat?: StatKey;
  amount?: number;
}

export interface CombatReport {
  round: number;
  bonuses: CombatBonus[];
  won: boolean;
  events: CombatEvent[];
  player: Fighter[];
  enemies: Fighter[];
  rewards: Reward[];
  survivors: number;
  enemySurvivors: number;
}

export interface RunStats {
  wavesWon: number;
  wavesLost: number;
  enemiesDefeated: number;
  damageDealt: number;
  merdomonCreated: number;
  merdomonFallen: number;
  tpEarned: number;
  merdascoreEarned: number;
  concentrationLost: number;
  itemsBought: number;
}

export type Phase = 'starter' | 'preparation' | 'combat' | 'gameover' | 'victory';

export interface RunState {
  version: 3;
  phase: Phase;
  round: number;
  concentration: number;
  tp: number;
  merdascore: number;
  ap: number;
  team: Merdomon[];
  items: ItemId[];
  /** Items on sale this round (random, never already owned). */
  shopOffer: ItemId[];
  /** Starter choices (only during the 'starter' phase). */
  starters: Merdomon[];
  /** Evacuate options to pick one from (empty when none is pending). */
  choices: Merdomon[];
  /** A freshly generated Merdomon waiting for its +1 bonus point. */
  pending: Merdomon | null;
  /** The upcoming wave, generated at the start of each preparation. */
  wave: Enemy[];
  lastCombat: CombatReport | null;
  rngState: number;
  nextId: number;
  stats: RunStats;
}
