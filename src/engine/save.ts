import { BATHROOM_INFO, HISTORY_MAX, STARTING_TOILET_POINTS, STRUCTURES } from './data';
import { runScore, type ScoreLine } from './score';
import type { AbilityId, BathroomId, BossId, ItemId, Level, MerdomonKind, Rarity, RunState, StructureId } from './types';

const KEY = 'dot.save.v7';

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
    return s?.version === 7 && s.phase === 'preparation' ? s : null;
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

const bestKey = (level: Level) => `dot.best.${level}`;
const HISTORY_KEY = 'dot.history';

/** Best final score for a difficulty level on this device (0 if none). */
export function loadBest(level: Level): number {
  try {
    return Number(localStorage.getItem(bestKey(level))) || 0;
  } catch {
    return 0;
  }
}

/** One finished run, as shown in the Stats screen. */
export interface RunRecord {
  /** Unique per run (seed-based), so a run is never recorded twice. */
  id: string;
  date: string;
  level: Level;
  boss: BossId;
  bathroom: BathroomId;
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
export function recordRun(s: RunState, runId: string): { previousBest: number } {
  const history = loadHistory();
  const existing = history.find((r) => r.id === runId);
  if (existing) return { previousBest: existing.previousBest };
  const previousBest = loadBest(s.level);
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
    if (total > previousBest) localStorage.setItem(bestKey(s.level), String(total));
    // The final score is also earned as Toilet Points.
    localStorage.setItem(POINTS_KEY, String(loadToiletPoints() + total));
  } catch {
    // Storage unavailable: nothing is recorded.
  }
  return { previousBest };
}

// ---------- Toilet Points and unlocked bathrooms (kept between runs) ----------

const POINTS_KEY = 'dot.toiletPoints';
const UNLOCKED_KEY = 'dot.unlockedBathrooms';

export function loadToiletPoints(): number {
  try {
    const raw = localStorage.getItem(POINTS_KEY);
    return raw === null ? STARTING_TOILET_POINTS : Number(raw) || 0;
  } catch {
    return STARTING_TOILET_POINTS;
  }
}

export function isUnlocked(id: BathroomId): boolean {
  if (BATHROOM_INFO[id].cost === 0) return true;
  try {
    const list = JSON.parse(localStorage.getItem(UNLOCKED_KEY) ?? '[]') as BathroomId[];
    return list.includes(id);
  } catch {
    return false;
  }
}

/** Spends Toilet Points to unlock a bathroom type. Returns false if it can't be afforded. */
export function unlockBathroom(id: BathroomId): boolean {
  if (isUnlocked(id)) return true;
  const points = loadToiletPoints();
  if (points < BATHROOM_INFO[id].cost) return false;
  try {
    const list = JSON.parse(localStorage.getItem(UNLOCKED_KEY) ?? '[]') as BathroomId[];
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify([...list, id]));
    localStorage.setItem(POINTS_KEY, String(points - BATHROOM_INFO[id].cost));
    return true;
  } catch {
    return false;
  }
}
