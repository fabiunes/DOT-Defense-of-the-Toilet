import {
  BATHROOMS,
  HISTORY_MAX,
  LEVELS,
  LEVEL_REWARD,
  STARTING_TOILET_POINTS,
  STRUCTURES,
  TESTING_PASSWORD_SHA256,
  bathroomOf,
} from './data';
import { runScore, type ScoreLine } from './score';
import type {
  AbilityId,
  BathroomId,
  BossId,
  ItemId,
  LegacyBathroomId,
  Level,
  MerdomonKind,
  Rarity,
  RunState,
  StructureId,
} from './types';

const KEY = 'dot.save.v9';

export function saveRun(s: RunState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage unavailable (private mode, quota): the run just won't be resumable.
  }
}

export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as RunState;
    return s?.version === 9 && s.phase === 'preparation' ? s : null;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

// ---------- Records and history (finished runs only) ----------

// Records are per bathroom and level since v0.14. The per-level records of v0.9–v0.13 are kept and still count
// in the overall best; runs of the history scored with the v0.9 formula count for their bathroom.
const bestKey = (bathroom: BathroomId, level: Level) => `dot.best.v3.${bathroom}.${level}`;
const legacyBestKey = (level: Level) => `dot.best.v2.${level}`;
const HISTORY_KEY = 'dot.history';

const stored = (key: string) => {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
};

/** Runs scored with the current formula (v0.9+) have a "Merdomon created" line. */
const currentFormula = (r: RunRecord) => r.lines.some((l) => l.label === 'Merdomon created');

/**
 * Best final score on this device (0 if none): for a bathroom and level, or for a level across all bathrooms
 * (old per-level records included).
 */
export function loadBest(level: Level, bathroom?: BathroomId): number {
  const runs = loadHistory().filter((r) => r.level === level && currentFormula(r));
  if (bathroom) {
    const fromHistory = runs.filter((r) => bathroomOf(r.bathroom) === bathroom).map((r) => r.score);
    return Math.max(stored(bestKey(bathroom, level)), ...fromHistory, 0);
  }
  return Math.max(stored(legacyBestKey(level)), ...BATHROOMS.map((b) => loadBest(level, b)), 0);
}

/** One finished run, as shown in the Stats screen. */
export interface RunRecord {
  /** Unique per run (seed-based), so a run is never recorded twice. */
  id: string;
  date: string;
  level: Level;
  boss: BossId;
  /** Old runs (before v0.14) keep their A/B bathroom id. */
  bathroom: BathroomId | LegacyBathroomId;
  victory: boolean;
  round: number;
  score: number;
  /** The level's record before this run. */
  previousBest: number;
  lines: ScoreLine[];
  team: { kind: MerdomonKind; rarity: Rarity; ability: AbilityId | null }[];
  items: ItemId[];
  structures: Record<StructureId, number>;
  damageDealt: number;
  merdomonCreated: number;
  tpEarned: number;
  poopEarned: number;
}

export function loadHistory(): RunRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list = raw ? (JSON.parse(raw) as RunRecord[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Records a finished run (newest first, at most HISTORY_MAX) and its level record.
 * Returns the level's best score before this run. Safe to call twice for the same run.
 */
/** `recorded` is false when this run was already in the history (e.g. the end screen shown again). */
export function recordRun(s: RunState, runId: string): { previousBest: number; recorded: boolean } {
  const history = loadHistory();
  const existing = history.find((r) => r.id === runId);
  if (existing) return { previousBest: existing.previousBest, recorded: false };
  const previousBest = loadBest(s.level, s.bathroom);
  const { lines, total } = runScore(s);
  const record: RunRecord = {
    id: runId,
    date: new Date().toISOString(),
    level: s.level,
    boss: s.boss,
    bathroom: s.bathroom,
    victory: s.phase === 'victory',
    round: s.round,
    score: total,
    previousBest,
    lines,
    team: s.team.map((m) => ({ kind: m.kind, rarity: m.rarity, ability: m.ability })),
    items: [...s.items],
    structures: Object.fromEntries(STRUCTURES.map((id) => [id, s.structures[id]])) as Record<StructureId, number>,
    damageDealt: s.stats.damageDealt,
    merdomonCreated: s.stats.merdomonCreated,
    tpEarned: s.stats.tpEarned,
    poopEarned: s.stats.merdascoreEarned,
  };
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([record, ...history].slice(0, HISTORY_MAX)));
    if (total > previousBest) localStorage.setItem(bestKey(s.bathroom, s.level), String(total));
    // The final score is also earned as Toilet Points, multiplied by the level's reward.
    localStorage.setItem(POINTS_KEY, String(loadToiletPoints() + toiletPointsFor(total, s.level)));
    // Winning a level unlocks the next one for this bathroom.
    if (record.victory) addWin(s.bathroom, s.level);
  } catch {
    // Storage unavailable: nothing is recorded.
  }
  return { previousBest, recorded: true };
}

// ---------- Toilet Points (kept between runs, no use for now) ----------

const POINTS_KEY = 'dot.toiletPoints';

export function loadToiletPoints(): number {
  try {
    const raw = localStorage.getItem(POINTS_KEY);
    return raw === null ? STARTING_TOILET_POINTS : Number(raw) || 0;
  } catch {
    return STARTING_TOILET_POINTS;
  }
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Testing Privilege: the right password unlocks every level of every bathroom. Returns whether it was right. */
export async function unlockAllWithPassword(password: string): Promise<boolean> {
  if ((await sha256(password)) !== TESTING_PASSWORD_SHA256) return false;
  try {
    localStorage.setItem(ALL_KEY, '1');
  } catch {
    return false;
  }
  return true;
}

// ---------- Tutorial Game ----------

const TUTORIAL_KEY = 'dot.tutorialDone';

/** Gives the tutorial's Toilet Points the first time only. Returns the points given (0 if already claimed). */
export function claimTutorialReward(points: number): number {
  try {
    if (localStorage.getItem(TUTORIAL_KEY)) return 0;
    localStorage.setItem(TUTORIAL_KEY, '1');
    localStorage.setItem(POINTS_KEY, String(loadToiletPoints() + points));
    return points;
  } catch {
    return 0;
  }
}

// ---------- Journey: each bathroom's levels, unlocked by winning the previous one ----------

const WINS_KEY = 'dot.journeyWins';
const ALL_KEY = 'dot.journeyAll';
const LAST_KEY = 'dot.lastSetup';

function storedWins(): Partial<Record<BathroomId, Level[]>> {
  try {
    return JSON.parse(localStorage.getItem(WINS_KEY) ?? '{}') as Partial<Record<BathroomId, Level[]>>;
  } catch {
    return {};
  }
}

function addWin(bathroom: BathroomId, level: Level) {
  const wins = storedWins();
  const list = wins[bathroom] ?? [];
  if (list.includes(level)) return;
  localStorage.setItem(WINS_KEY, JSON.stringify({ ...wins, [bathroom]: [...list, level] }));
}

/** A level won at least once with this bathroom (wins before v0.14 count for their bathroom type). */
export function hasWon(bathroom: BathroomId, level: Level): boolean {
  if (storedWins()[bathroom]?.includes(level)) return true;
  return loadHistory().some((r) => r.victory && r.level === level && bathroomOf(r.bathroom) === bathroom);
}

/** Level 1 is always open; the others need a win on the previous level with the same bathroom. */
export function isLevelUnlocked(level: Level, bathroom: BathroomId): boolean {
  if (level === 1 || hasWon(bathroom, (level - 1) as Level)) return true;
  try {
    return localStorage.getItem(ALL_KEY) === '1';
  } catch {
    return false;
  }
}

/** The setup screen reopens on the last bathroom and level picked. */
export function loadLastSetup(): { bathroom: BathroomId; level: Level } {
  try {
    const last = JSON.parse(localStorage.getItem(LAST_KEY) ?? 'null') as { bathroom: BathroomId; level: Level } | null;
    if (last && BATHROOMS.includes(last.bathroom) && LEVELS.includes(last.level)) return last;
  } catch {
    // fall through to the default
  }
  return { bathroom: BATHROOMS[0], level: 1 };
}

export function saveLastSetup(bathroom: BathroomId, level: Level): void {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ bathroom, level }));
  } catch {
    // ignore
  }
}

/** Toilet Points earned by a run: its score times the level's reward (rounded). */
export function toiletPointsFor(score: number, level: Level): number {
  return Math.round(score * LEVEL_REWARD[level]);
}
