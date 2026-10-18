import type { RunState } from './types';

const KEY = 'dot.save.v1';

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
    return s?.version === 1 && s.phase === 'preparation' ? s : null;
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
