import type { RunState } from './types';

const KEY = 'dot.save.v5';

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
    return s?.version === 5 && s.phase === 'preparation' ? s : null;
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

const BEST_KEY = 'dot.best';

/** Best final score on this device (0 if none). */
export function loadBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

/** Stores `score` if it beats the record; returns true for a new record. */
export function saveBest(score: number): boolean {
  if (score <= loadBest()) return false;
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // ignore
  }
  return true;
}
