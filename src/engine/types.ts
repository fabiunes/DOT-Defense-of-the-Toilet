export type Rarity = 'common' | 'rare' | 'epic';
export type StatKey = 'hp' | 'atk' | 'def' | 'spd';
export type TraitId = 'paper' | 'merdon' | 'healthy' | 'haste' | 'fighter' | 'defender' | 'action';
export type ItemId =
  | 'plunger'
  | 'magazine'
  | 'waterJet'
  | 'shower'
  | 'window'
  | 'towel'
  | 'toothbrush'
  | 'flipflops'
  | 'gameboy'
  | 'brownTowel'
  | 'yellowTowel'
  | 'whiteTowel'
  | 'hammer';
export type MerdomonKind = 'normal' | 'liquid' | 'fart';
export type EnemyKind = 'phone' | 'book' | 'console';
export type AbilityId =
  | 'cheerleader'
  | 'frontliner'
  | 'rearGuard'
  | 'thickSkin'
  | 'spiky'
  | 'splash'
  | 'giantSlayer'
  | 'snowball'
  | 'leech'
  | 'secondWind'
  | 'lastGasp'
  | 'legacy'
  | 'collector'
  | 'fertilizer'
  | 'stinkyAura';
export type ModifierId = 'groupChat' | 'wifiDown' | 'rushHour' | 'doomscrolling' | 'silentMode' | 'jackpot';
export type StartBonusId = 'item' | 'merdomon' | 'resources';
export type StructureId = 'stall' | 'sink' | 'bidet' | 'scrubber' | 'toilet' | 'holder';
/** Difficulty level, chosen at the start: it picks the Boss and toughens normal enemies. */
export type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7;
/** Starting bathroom setup, chosen together with the level. */
export type BathroomId = 'homeA' | 'homeB' | 'officeA' | 'officeB' | 'publicA' | 'publicB' | 'hotelA' | 'hotelB';
export type BossId = 'demonScroller' | 'bestseller' | 'streamDeck' | 'plumber' | 'groupAdmin' | 'robotVacuum' | 'cat';
/** Bosses show up twice: a medium form on wave 5 and the final form on wave 10. */
export type BossForm = 'mid' | 'final';

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
  /** Chosen together with the +1 point; null until then. */
  ability: AbilityId | null;
}

export interface Enemy {
  id: number;
  rarity: Rarity;
  kind: EnemyKind;
  stats: Stats;
  boss: boolean;
  /** Set on the run's Boss (both forms). */
  bossForm?: BossForm;
  /** Added by the Group Chat modifier (removed if the modifier is disabled). */
  extra?: boolean;
}

export type Side = 'p' | 'e';

/** Snapshot of a combatant with combat-time stats (trait and start-of-fight bonuses applied). */
export interface Fighter {
  id: number;
  rarity: Rarity;
  kind: MerdomonKind | EnemyKind;
  boss: boolean;
  bossForm?: BossForm;
  ability: AbilityId | null;
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
  /** Merdomon `p` triggers its ability; `target` (if any) is who it changed, with the HP after. */
  | { type: 'ability'; ability: AbilityId; p: number; target?: { side: Side; index: number; hp: number } }
  | { type: 'modifier'; modifier: ModifierId }
  /** The Boss uses its ability; `hp` is its HP afterwards (Extra Life). */
  | { type: 'boss'; boss: BossId; index: number; hp?: number }
  | { type: 'end'; won: boolean };

export type Resource = 'tp' | 'merdascore' | 'concentration' | 'ap' | 'hp';
export type RewardSource = 'survivors' | 'enemies' | 'damage' | TraitId | ItemId | AbilityId | ModifierId | StructureId | BossId;

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
  /** The run's Boss, to draw it (absent in reports saved before v0.11). */
  bossId?: BossId;
  /** Items sucked up by the Robot Vacuum in this fight. */
  stolen?: ItemId[];
  bonuses: CombatBonus[];
  modifier: ModifierId | null;
  won: boolean;
  events: CombatEvent[];
  player: Fighter[];
  enemies: Fighter[];
  rewards: Reward[];
  survivors: number;
  enemySurvivors: number;
}

/** A wave already fought: who was faced, the outcome and what it gave or cost. */
export interface WaveLogEntry {
  round: number;
  won: boolean;
  /** The modifier that was active (null if none or Corrupted). */
  modifier: ModifierId | null;
  enemies: { kind: EnemyKind; rarity: Rarity; boss: boolean; defeated: boolean }[];
  concentrationLost: number;
  /** Positive rewards collected after the wave, by resource. */
  gains: Partial<Record<Resource, number>>;
  /** Items sucked up by the Robot Vacuum. */
  stolen?: ItemId[];
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
  /** Shop, gift and starting bonus (discarded items count too). */
  itemsObtained: number;
  /** Created Merdomon by size (starter, starting bonus, Evacuate), flushed ones too. */
  merdomonBySize: Record<Rarity, number>;
  /** Defeated normal enemies by size (the Boss is counted by the two flags below). */
  enemiesBySize: Record<Rarity, number>;
  modifierWavesWon: number;
  midBossDefeated: boolean;
  finalBossDefeated: boolean;
}

export type Phase = 'boss' | 'starter' | 'startBonus' | 'preparation' | 'combat' | 'gameover' | 'victory';

export interface RunState {
  version: 8;
  phase: Phase;
  round: number;
  concentration: number;
  tp: number;
  merdascore: number;
  ap: number;
  /** AP added at the next preparation (modifier reward, Sink, starting pack). Unspent AP carry over (max 5). */
  bonusAp: number;
  /** Difficulty level chosen at the start. */
  level: Level;
  /** Starting bathroom setup chosen at the start. */
  bathroom: BathroomId;
  /** Structure tiers at the start (upgrades built during the run count for the score). */
  startStructures: Record<StructureId, number>;
  /** Gift after wave 5: items to pick one from (empty when none is pending). */
  giftOffer: ItemId[];
  /** This run's Boss (set by the level): a run-wide modifier, then a medium form on wave 5 and the final form on wave 10. */
  boss: BossId;
  /** Free Re-Rolls left this round (Toilet Brush structure). */
  freeRerolls: number;
  /** Bathroom structures' tiers (0..3). */
  structures: Record<StructureId, number>;
  team: Merdomon[];
  items: ItemId[];
  /** Items on sale this round (random, never already owned). */
  shopOffer: ItemId[];
  /** Starter choices (only during the 'starter' phase). */
  starters: Merdomon[];
  /** Starting bonus options (only during the 'startBonus' phase). */
  startOptions: { item: ItemId; merdomon: Merdomon } | null;
  /** Evacuate options to pick one from (empty when none is pending). */
  choices: Merdomon[];
  /** A freshly generated Merdomon waiting for its ability and +1 point. */
  pending: Merdomon | null;
  /** The 3 abilities offered to the pending Merdomon. */
  pendingAbilities: AbilityId[];
  /** Wave modifiers planned for this run, by round. */
  modifiers: Partial<Record<number, ModifierId>>;
  /** The current round's modifier was paid off. */
  modifierDisabled: boolean;
  /** The upcoming wave, generated at the start of each preparation. */
  wave: Enemy[];
  lastCombat: CombatReport | null;
  /** One entry per wave fought, for the Round recap (absent in runs saved before v0.12). */
  waveLog?: WaveLogEntry[];
  rngState: number;
  nextId: number;
  stats: RunStats;
}
