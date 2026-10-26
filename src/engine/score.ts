import { SCORE, STRUCTURES } from './data';
import type { Rarity, RunState } from './types';

export interface ScoreLine {
  label: string;
  count: number;
  points: number;
}

const SIZES: readonly Rarity[] = ['common', 'rare', 'epic'];
const bySize = (counts: Record<Rarity, number>, points: Record<Rarity, number>) =>
  SIZES.reduce((t, r) => t + (counts[r] ?? 0) * points[r], 0);
const total = (counts: Record<Rarity, number>) => SIZES.reduce((t, r) => t + (counts[r] ?? 0), 0);

/** Final score of a run, with the breakdown shown on the end screen. Winning itself gives no points. */
export function runScore(s: RunState): { lines: ScoreLine[]; total: number } {
  const st = s.stats;
  // Only upgrades built during the run count.
  const tiers = STRUCTURES.reduce((t, id) => t + Math.max(0, s.structures[id] - s.startStructures[id]), 0);
  // Endless can beat many Bosses; older saves only have the two flags.
  const mid = st.bossesDefeated?.mid ?? (st.midBossDefeated ? 1 : 0);
  const final = st.bossesDefeated?.final ?? (st.finalBossDefeated ? 1 : 0);
  const bosses = mid + final;
  const bossPoints = mid * SCORE.midBoss + final * SCORE.finalBoss;
  const concentration = Math.max(0, s.concentration);
  const lines: ScoreLine[] = [
    {
      label: 'Distractions defeated',
      count: total(st.enemiesBySize) + bosses,
      points: bySize(st.enemiesBySize, SCORE.enemy) + bossPoints,
    },
    { label: 'Merdomon created', count: total(st.merdomonBySize), points: bySize(st.merdomonBySize, SCORE.merdomon) },
    { label: 'Items obtained', count: st.itemsObtained, points: st.itemsObtained * SCORE.item },
    { label: 'Structure upgrades', count: tiers, points: tiers * SCORE.structureTier },
    { label: 'Poop produced', count: st.merdascoreEarned, points: st.merdascoreEarned * SCORE.poop },
    { label: 'Toilet Paper earned', count: st.tpEarned, points: st.tpEarned * SCORE.tp },
    { label: 'Concentration left', count: concentration, points: concentration * SCORE.concentration },
  ];
  return { lines, total: lines.reduce((t, l) => t + l.points, 0) };
}
