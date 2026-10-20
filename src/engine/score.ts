import { SCORE, STRUCTURES } from './data';
import type { RunState } from './types';

export interface ScoreLine {
  label: string;
  count: number;
  points: number;
}

/** Final score of a run, with the breakdown shown on the end screen. */
export function runScore(s: RunState): { lines: ScoreLine[]; total: number } {
  const st = s.stats;
  const tiers = STRUCTURES.reduce((t, id) => t + (s.structures[id] - 1), 0);
  const victory = s.phase === 'victory';
  const lines: ScoreLine[] = [
    { label: 'Waves won', count: st.wavesWon, points: st.wavesWon * SCORE.waveWon },
    { label: 'Distractions defeated', count: st.enemiesDefeated, points: st.enemiesDefeated * SCORE.enemy },
    { label: 'Modifier waves won', count: st.modifierWavesWon, points: st.modifierWavesWon * SCORE.modifierWave },
    { label: 'Mid Boss defeated', count: st.midBossDefeated ? 1 : 0, points: st.midBossDefeated ? SCORE.midBoss : 0 },
    { label: 'Final Boss defeated', count: st.finalBossDefeated ? 1 : 0, points: st.finalBossDefeated ? SCORE.finalBoss : 0 },
    { label: 'Victory', count: victory ? 1 : 0, points: victory ? SCORE.victory : 0 },
    { label: 'Concentration left', count: s.concentration, points: s.concentration * SCORE.concentration },
    { label: 'Structure upgrades', count: tiers, points: tiers * SCORE.structureTier },
    { label: 'Poop produced', count: st.merdascoreEarned, points: st.merdascoreEarned * SCORE.poop },
  ];
  return { lines, total: lines.reduce((t, l) => t + l.points, 0) };
}
