import type {
  AbilityId,
  BossId,
  EnemyKind,
  ItemId,
  MerdomonKind,
  ModifierId,
  Rarity,
  StatKey,
  StructureId,
  TraitId,
} from './types';

export const ROUNDS = 10;
export const MAX_STAT = 10;
export const MAX_CONCENTRATION = 10;
export const BASE_AP = 1;
/** Unspent Action Points carry over, up to this. */
export const MAX_AP = 5;
export const STARTER_CHOICES = 3;
export const STARTING_TP = 2;
export const STARTING_MERDASCORE = 5;
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
  'brush',
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
];

/** Each trait listed counts once towards the trait thresholds. */
export const ITEM_INFO: Record<ItemId, { name: string; traits: readonly TraitId[]; desc: string }> = {
  brush: { name: 'Toilet Brush', traits: ['merdon'], desc: '+2 Poop after each wave' },
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

export const STRUCTURES: readonly StructureId[] = ['sink', 'bidet', 'holder', 'toilet'];
export const MAX_TIER = 3;
export const BUILD_COST = { tp: 20, ap: 1 } as const;

export const STRUCTURE_INFO: Record<
  StructureId,
  { name: string; capacity: string; capacities: readonly number[]; produce: string; production: readonly number[] }
> = {
  sink: { name: 'Sink', capacity: 'Items', capacities: [3, 6, 9], produce: 'Action Points', production: [0, 1, 2] },
  bidet: { name: 'Bidet', capacity: 'Poop', capacities: [15, 20, 30], produce: 'Concentration', production: [0, 1, 2] },
  holder: { name: 'Paper Holder', capacity: 'Toilet Paper', capacities: [30, 50, 70], produce: 'Toilet Paper', production: [0, 5, 10] },
  toilet: { name: 'Toilet', capacity: 'Merdomon', capacities: [4, 5, 6], produce: 'Poop', production: [0, 2, 3] },
};

// ---------- Bosses ----------

export const BOSSES: readonly BossId[] = ['demonScroller', 'bestseller', 'streamDeck'];
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
  { common: 3, rare: 0 },
  { common: 3, rare: 1 },
  { common: 4, rare: 1 },
  { common: 4, rare: 0, boss: 'mid' },
  { common: 3, rare: 2 },
  { common: 3, rare: 3 },
  { common: 2, rare: 4 },
  { common: 0, rare: 6 },
  { common: 0, rare: 5, boss: 'final' },
];
