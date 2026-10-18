import type { RunState } from '../engine/types';

export type Update = (fn: (s: RunState) => RunState) => void;
