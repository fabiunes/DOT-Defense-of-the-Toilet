import type {
  AbilityId,
  BossId,
  EnemyKind,
  ItemId,
  MerdomonKind,
  ModifierId,
  Rarity,
  StatKey,
  Level,
  BathroomId,
  StructureId,
  TraitId,
} from './types';

export const ROUNDS = 10;
export const MAX_STAT = 10;
export const MAX_CONCENTRATION = 10;
export const BASE_AP = 1;
export const STARTER_CHOICES = 3;
export const SHOP_OFFER = 2;
export const EVACUATE_CHOICES = 2;
/** Shop items / Evacuate options with the Game Boy. */
export const GAMEBOY_CHOICES = 3;
export const REROLL_COST = 2;
export const ABILITY_CHOICES = 3;

/** Starting bonus "resources" pack (the AP is for round 1 only). */
export const START_PACK = { tp: 5, merdascore: 3, ap: 1 } as const;

export const STAT_KEYS: readonly StatKey[] = ['hp', 'atk', 'def', 'spd'];

// Sizes keep the internal ids common / rare / epic.
export const SIZE_NAME: Record<Rarity, string> = { common: 'Small', rare: 'Big', epic: 'Huge' };
/** Total stat points (all four stats together). Merdomon get 1 less and add the last point themselves. */
export const SIZE_TOTAL: Record<Rarity, number> = { common: 10, rare: 15, epic: 20 };
export const RARITY_TRAITS: Record<Rarity, number> = { common: 1, rare: 2, epic: 3 };
export const EVACUATE_COST: Record<Rarity, number> = { common: 5, rare: 10, epic: 20 };

export const MERDOMON_KINDS: readonly MerdomonKind[] = ['normal', 'liquid', 'fart'];
export const ENEMY_KINDS: readonly EnemyKind[] = ['phone', 'book', 'console'];

/** How a creature's total is split across its stats (in %), highest share first; shares go to random stats. */
export const KIND_CURVE: Record<MerdomonKind | EnemyKind, readonly number[]> = {
  normal: [25, 25, 25, 25],
  liquid: [40, 40, 10, 10],
  fart: [65, 25, 10, 0],
  phone: [25, 25, 25, 25],
  book: [40, 40, 10, 10],
  console: [65, 25, 10, 0],
};

export const KIND_NAME: Record<MerdomonKind | EnemyKind, string> = {
  normal: 'Normal',
  liquid: 'Liquid',
  fart: 'Fart',
  phone: 'Smartphone',
  book: 'Book',
  console: 'Console',
};

export const COSTS = {
  shop: 10,
  flush: 5,
  bonusAction: 15,
  /** Concentration spent by Concentrate. */
  concentrate: 2,
} as const;

export const CONCENTRATE_GAIN = 4;
export const FLUSH_CONCENTRATION = 1;

/** What 1 AP buys with the Trade action. */
export const TRADE = { merdascore: 2, tp: 5, stat: 1 } as const;

export const TRAITS: readonly TraitId[] = ['paper', 'merdon', 'healthy', 'haste', 'fighter', 'defender', 'action'];
export const TRAIT_THRESHOLDS = [2, 4, 6, 8] as const;
export const TRAIT_VALUES: Record<TraitId, readonly number[]> = {
  paper: [2, 5, 9, 15],
  merdon: [1, 2, 3, 4],
  healthy: [1, 2, 3, 4],
  haste: [1, 2, 3, 4],
  fighter: [1, 2, 3, 4],
  defender: [1, 2, 3, 4],
  action: [1, 1, 2, 2],
};

export const TRAIT_INFO: Record<TraitId, { name: string; desc: string }> = {
  paper: { name: 'Paper', desc: 'Toilet Paper after each wave' },
  merdon: { name: 'Stinky', desc: 'Poop after each wave' },
  healthy: { name: 'Healthy', desc: 'HP to all in combat' },
  haste: { name: 'Haste', desc: 'Speed to all in combat' },
  fighter: { name: 'Fighter', desc: 'Attack to all in combat' },
  defender: { name: 'Defender', desc: 'Defense to all in combat' },
  action: { name: 'Action', desc: 'Action Points each round' },
};

export const ITEMS: readonly ItemId[] = [
  'plunger',
  'magazine',
  'waterJet',
  'shower',
  'window',
  'towel',
  'toothbrush',
  'flipflops',
  'gameboy',
  'brownTowel',
  'yellowTowel',
  'whiteTowel',
  'hammer',
];

/** Each trait listed counts once towards the trait thresholds. */
export const ITEM_INFO: Record<ItemId, { name: string; traits: readonly TraitId[]; desc: string }> = {
  plunger: { name: 'Plunger', traits: ['merdon'], desc: '+2 Poop after each wave' },
  magazine: { name: 'Magazine', traits: ['healthy'], desc: 'First fallen Merdomon revives at full HP (once per fight)' },
  waterJet: { name: 'Water Jet', traits: ['defender'], desc: 'Evacuate also gives +1 Concentration' },
  shower: { name: 'Hand Shower', traits: ['paper'], desc: 'Shop, Flush and Bonus Action cost 2 less' },
  window: { name: 'Window', traits: ['haste'], desc: 'Front Merdomon strikes twice on its first attack' },
  towel: { name: 'Paper Towel', traits: ['fighter'], desc: '+5 Toilet Paper after each wave' },
  toothbrush: { name: 'Toothbrush', traits: ['action'], desc: '+1 HP to all in combat for each unspent Action Point' },
  flipflops: { name: 'Flip-Flops', traits: ['action', 'haste'], desc: 'A Merdomon twice as fast as its foe strikes twice each turn' },
  gameboy: { name: 'Game Boy', traits: ['paper', 'merdon'], desc: 'Choose among 3 options (instead of 2) in Shop and Evacuate' },
  brownTowel: { name: 'Brown Towel', traits: ['merdon'], desc: 'Normal Merdomon +1 HP and +1 ATK in combat' },
  yellowTowel: { name: 'Yellow Towel', traits: ['healthy'], desc: 'Liquid Merdomon +1 HP and +1 ATK in combat' },
  whiteTowel: { name: 'White Towel', traits: ['haste'], desc: 'Fart Merdomon +1 HP and +1 ATK in combat' },
  hammer: { name: 'Hammer', traits: ['fighter'], desc: 'Every Build costs 15 TP, even from Tier 0' },
};

/** Towels boost one Merdomon type in combat. */
export const TOWEL_KIND: Partial<Record<ItemId, MerdomonKind>> = {
  brownTowel: 'normal',
  yellowTowel: 'liquid',
  whiteTowel: 'fart',
};
export const TOWEL_BONUS = { hp: 1, atk: 1 } as const;

// ---------- Abilities (flat values, same for every size) ----------

export const ABILITIES: readonly AbilityId[] = [
  'cheerleader',
  'frontliner',
  'rearGuard',
  'thickSkin',
  'spiky',
  'splash',
  'giantSlayer',
  'snowball',
  'leech',
  'secondWind',
  'lastGasp',
  'legacy',
  'collector',
  'fertilizer',
  'stinkyAura',
];

export const ABILITY = {
  cheerleaderAtk: 1,
  frontlinerHp: 2,
  frontlinerDef: 1,
  rearGuardDef: 2,
  thickSkin: 1,
  spiky: 1,
  splash: 1,
  giantSlayerAtk: 2,
  snowballAtk: 1,
  leech: 1,
  secondWindHp: 1,
  lastGasp: 3,
  legacyAtk: 2,
  collectorTp: 2,
  fertilizerMerdascore: 1,
  stinkySpd: 1,
} as const;

export const ABILITY_INFO: Record<AbilityId, { name: string; icon: string; desc: string }> = {
  cheerleader: { name: 'Cheerleader', icon: '📣', desc: 'The Merdomon behind it gets +1 ATK' },
  frontliner: { name: 'Frontliner', icon: '🧱', desc: 'If first in line: +2 HP and +1 DEF' },
  rearGuard: { name: 'Rear Guard', icon: '🛡️', desc: 'If last in line: +2 DEF' },
  thickSkin: { name: 'Thick Skin', icon: '🦏', desc: 'Takes 1 less damage from every hit (min 1)' },
  spiky: { name: 'Spiky', icon: '🌵', desc: 'Whoever hits it takes 1 damage' },
  splash: { name: 'Splash', icon: '💦', desc: 'Its hits also deal 1 damage to the next enemy' },
  giantSlayer: { name: 'Giant Slayer', icon: '🎯', desc: '+2 ATK against Big and Huge enemies' },
  snowball: { name: 'Snowball', icon: '⛄', desc: '+1 ATK for each enemy it defeats' },
  leech: { name: 'Leech', icon: '🩸', desc: 'Heals 1 HP when it deals damage' },
  secondWind: { name: 'Second Wind', icon: '💨', desc: 'Once per fight, survives a deadly hit with 1 HP' },
  lastGasp: { name: 'Last Gasp', icon: '💥', desc: 'When it falls, deals 3 damage to its killer' },
  legacy: { name: 'Legacy', icon: '🎁', desc: 'When it falls, the next Merdomon gets +2 ATK' },
  collector: { name: 'Collector', icon: '🪙', desc: '+2 Toilet Paper for each enemy it defeats' },
  fertilizer: { name: 'Fertilizer', icon: '🌱', desc: '+1 Merdascore after the wave if it survived' },
  stinkyAura: { name: 'Stinky Aura', icon: '🤢', desc: 'The enemy it faces has −1 SPD' },
};

// ---------- Wave modifiers ----------

export const MODIFIERS: readonly ModifierId[] = ['groupChat', 'wifiDown', 'rushHour', 'doomscrolling', 'silentMode', 'jackpot'];
export const MODIFIER_WAVES: readonly number[] = [3, 6, 9];
export const MODIFIER_DISABLE_COST = 3;
/** AP added next round when a wave with an active modifier is won. */
export const MODIFIER_AP_REWARD = 1;
export const JACKPOT = { atk: 1, hp: 1 } as const;

export const MODIFIER_INFO: Record<ModifierId, { name: string; icon: string; desc: string }> = {
  groupChat: { name: 'Group Chat', icon: '💬', desc: 'One extra Small enemy joins at the front' },
  wifiDown: { name: 'Wi-Fi Down', icon: '📵', desc: 'Your trait combat bonuses do not work' },
  rushHour: { name: 'Rush Hour', icon: '⏰', desc: 'Enemies always strike first' },
  doomscrolling: { name: 'Doomscrolling', icon: '📱', desc: 'Each time a Merdomon falls, all enemies get +1 ATK' },
  silentMode: { name: 'Silent Mode', icon: '🔕', desc: 'Your Merdomon abilities do not trigger' },
  jackpot: { name: 'Jackpot', icon: '🎰', desc: 'Enemies +1 ATK and +1 HP, but this wave\'s TP and Poop are doubled' },
};

// ---------- Bathroom structures (in-run upgrades) ----------

/** In screen order: top row Shower, Sink, Bidet; bottom row Toilet Brush, Toilet, Paper Holder. */
export const STRUCTURES: readonly StructureId[] = ['stall', 'sink', 'bidet', 'scrubber', 'toilet', 'holder'];
export const MAX_TIER = 3;
/** Build: TP by current tier (0→1, 1→2, 2→3), 15 TP for any tier with the Hammer, always + 1 AP. */
export const BUILD_COST = { tp: [20, 25, 30], hammerTp: 15, ap: 1 } as const;

export const STRUCTURE_INFO: Record<
  StructureId,
  { name: string; capacity: string; capacities: readonly number[]; produce: string; production: readonly number[] }
> = {
  // Values by tier: index 0 = Tier 0 (not built yet) … index 3 = Tier 3.
  stall: { name: 'Shower', capacity: 'Max Concentration', capacities: [8, 10, 12, 14], produce: 'HP to all Merdomon', production: [0, 0, 1, 2] },
  scrubber: { name: 'Toilet Brush', capacity: 'Max Action Points', capacities: [2, 3, 4, 5], produce: 'free Re-Rolls', production: [0, 1, 2, 3] },
  sink: { name: 'Sink', capacity: 'Items', capacities: [3, 5, 7, 9], produce: 'Action Points', production: [0, 0, 1, 2] },
  bidet: { name: 'Bidet', capacity: 'Poop', capacities: [10, 15, 20, 25], produce: 'Concentration', production: [0, 0, 1, 2] },
  holder: { name: 'Paper Holder', capacity: 'Toilet Paper', capacities: [30, 40, 50, 60], produce: 'Toilet Paper', production: [0, 2, 5, 8] },
  toilet: { name: 'Toilet', capacity: 'Merdomon', capacities: [3, 4, 5, 6], produce: 'Poop', production: [0, 1, 2, 3] },
};

// ---------- Bosses ----------

export const BOSSES: readonly BossId[] = ['bestseller', 'streamDeck', 'demonScroller'];

// ---------- Difficulty levels ----------

export const LEVELS: readonly Level[] = [1, 2, 3];
export const LEVEL_BOSS: Record<Level, BossId> = { 1: 'bestseller', 2: 'streamDeck', 3: 'demonScroller' };
/** Extra stat points for every normal enemy. */
export const LEVEL_ENEMY_BONUS: Record<Level, number> = { 1: 0, 2: 1, 3: 2 };
/** Finished runs kept in the Stats history. */
export const HISTORY_MAX = 50;

// ---------- Bathroom types (starting setups, unlocked with Toilet Points) ----------

/** From the weakest to the strongest. The first one is free and the default. */
export const BATHROOMS: readonly BathroomId[] = ['officeA', 'officeB', 'publicA', 'publicB', 'homeA', 'homeB', 'hotelA', 'hotelB'];

const tiers = (stall: number, sink: number, bidet: number, scrubber: number, toilet: number, holder: number) => ({
  stall,
  sink,
  bidet,
  scrubber,
  toilet,
  holder,
});

export const BATHROOM_INFO: Record<
  BathroomId,
  {
    name: string;
    color: string;
    /** Toilet Points to unlock (0 = unlocked from the start). */
    cost: number;
    structures: Record<StructureId, number>;
    tp: number;
    concentration: number;
    poop: number;
  }
> = {
  officeA: { name: 'Office Bathroom A', color: '#eeeeea', cost: 0, structures: tiers(0, 1, 0, 1, 1, 1), tp: 5, concentration: 8, poop: 5 },
  officeB: { name: 'Office Bathroom B', color: '#e0e0da', cost: 5000, structures: tiers(0, 0, 0, 0, 1, 3), tp: 5, concentration: 6, poop: 10 },
  publicA: { name: 'Public Toilet A', color: '#eef6e6', cost: 5000, structures: tiers(0, 0, 0, 0, 3, 3), tp: 0, concentration: 5, poop: 10 },
  publicB: { name: 'Public Toilet B', color: '#dfeed3', cost: 10000, structures: tiers(0, 1, 1, 0, 2, 0), tp: 10, concentration: 6, poop: 12 },
  homeA: { name: 'Home Bathroom A', color: '#e8f1fb', cost: 15000, structures: tiers(1, 1, 1, 1, 1, 1), tp: 3, concentration: 10, poop: 5 },
  // Concentration capped by the Shower at Tier 0.
  homeB: { name: 'Home Bathroom B', color: '#d6e6f8', cost: 30000, structures: tiers(0, 1, 2, 1, 2, 0), tp: 0, concentration: 8, poop: 3 },
  hotelA: { name: 'Hotel Bathroom A', color: '#fbf1dc', cost: 40000, structures: tiers(2, 2, 2, 2, 2, 2), tp: 0, concentration: 4, poop: 0 },
  hotelB: { name: 'Hotel Bathroom B', color: '#f6e2b8', cost: 100000, structures: tiers(3, 3, 3, 3, 3, 3), tp: 0, concentration: 1, poop: 0 },
};

/** Toilet Points a new player starts with. */
export const STARTING_TOILET_POINTS = 0;
/** SHA-256 of the testers' password that unlocks every bathroom (the password itself is not in the code). */
export const TESTING_PASSWORD_SHA256 = 'aeb1e8036f581fa27e9e3c78e6061e8ca40072c97367ea88392ca5fc14580b0f';

// ---------- Extras ----------

/** Free action: heal one Merdomon. */
export const FARTING = { tp: 3, hp: 1 } as const;
/** After this wave (won or lost) you pick a free item. */
export const GIFT_WAVE = 5;
export const GIFT_CHOICES = 3;
/** The medium form joins wave 5 as a Big; the final form is a Huge with extra points. */
export const BOSS_TOTAL = { mid: 15, final: 22 } as const;
/** Run-wide modifier: every enemy of the Boss's type gets this much ATK. */
export const BOSS_TYPE_ATK = 1;

export const BOSS_INFO: Record<
  BossId,
  { name: string; icon: string; kind: EnemyKind; runDesc: string; ability: string; midDesc: string; finalDesc: string }
> = {
  demonScroller: {
    name: 'Demon Scroller',
    icon: '📱',
    kind: 'phone',
    runDesc: 'All Smartphones +1 ATK',
    ability: 'Endless Feed',
    midDesc: '+1 HP for every Concentration point you have lost',
    finalDesc: '+1 HP for every Concentration point you have lost',
  },
  bestseller: {
    name: 'The Bestseller',
    icon: '📚',
    kind: 'book',
    runDesc: 'All Books +1 ATK',
    ability: 'Plot Twist',
    midDesc: '+1 DEF after each of its attacks',
    finalDesc: '+1 DEF and +1 ATK after each of its attacks',
  },
  streamDeck: {
    name: 'The StreamDeck',
    icon: '🎮',
    kind: 'console',
    runDesc: 'All Consoles +1 ATK',
    ability: 'Extra Life',
    midDesc: 'Comes back once with half its HP',
    finalDesc: 'Comes back once with full HP',
  },
};

// ---------- Final score ----------

export const SCORE = {
  waveWon: 100,
  enemy: 10,
  modifierWave: 50,
  midBoss: 150,
  finalBoss: 300,
  victory: 500,
  concentration: 30,
  structureTier: 25,
  poop: 10,
} as const;

export const BRUSH_MERDASCORE = 2;
export const TOWEL_TP = 5;
export const BIDET_CONCENTRATION = 1;
export const SHOWER_DISCOUNT = 2;

export interface WaveDef {
  common: number;
  rare: number;
  /** The run's Boss joins last in this form. */
  boss?: 'mid' | 'final';
}

/** Level 1 – Home Bathroom. common = Small, rare = Big; the Boss is Big on wave 5 and Huge on wave 10. */
export const WAVES: readonly WaveDef[] = [
  { common: 1, rare: 0 },
  { common: 2, rare: 0 },
  { common: 3, rare: 1 },
  { common: 4, rare: 1 },
  { common: 4, rare: 0, boss: 'mid' },
  { common: 3, rare: 2 },
  { common: 3, rare: 3 },
  { common: 2, rare: 4 },
  { common: 0, rare: 6 },
  { common: 0, rare: 5, boss: 'final' },
];
