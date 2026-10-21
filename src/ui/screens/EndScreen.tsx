import { useState } from 'react';
import { BATHROOM_INFO, BOSS_INFO, LEVEL_REWARD } from '../../engine/data';
import { recordRun, toiletPointsFor } from '../../engine/save';
import { runScore } from '../../engine/score';
import type { RunState } from '../../engine/types';
import { analytics } from '../analytics';
import { Icon } from '../icons';

/** Unique id of a finished run, so it is recorded only once. */
const runId = (s: RunState) => `${s.rngState}-${s.nextId}-${s.level}`;

export function EndScreen({ run, onHome, onNew }: { run: RunState; onHome: () => void; onNew: () => void }) {
  const victory = run.phase === 'victory';
  const { lines, total } = runScore(run);
  // Records the run in the history (idempotent) and reads the level's previous record.
  const [{ previousBest }] = useState(() => {
    const result = recordRun(run, runId(run));
    if (result.recorded) analytics.runEnd(run.level, run.bathroom, run.phase === 'victory', run.round, total);
    return result;
  });
  const newRecord = total > previousBest;
  const boss = BOSS_INFO[run.boss];

  return (
    <div className="screen end">
      <div className={`end-title ${victory ? 'win' : 'lose'}`}>
        <Icon name={victory ? 'trophy' : 'skull'} size={52} fill="#fff" />
        <h1>{victory ? 'Victory!' : 'Game Over'}</h1>
        <p className="muted">
          {BATHROOM_INFO[run.bathroom].name} · Level {run.level} · {boss.icon} {boss.name} · {victory ? 'Break completed in peace.' : `wave ${run.round}`}
        </p>
      </div>
      <div className="end-stats sk">
        {lines
          .filter((l) => l.points > 0)
          .map((l) => (
            <div key={l.label} className="score-row">
              <span>{l.label}</span>
              <span className="muted">×{l.count}</span>
              <b>{l.points}</b>
            </div>
          ))}
        <div className="score-total">
          <span>Score</span>
          <b>{total}</b>
        </div>
        <div className={`score-best ${newRecord ? 'new' : ''}`}>
          <span className="points-earned">
            +{toiletPointsFor(total, run.level).toLocaleString('en')} <Icon name="toilet" size={15} fill="#f2c94c" /> Toilet
            Points{LEVEL_REWARD[run.level] !== 1 && ` (×${LEVEL_REWARD[run.level]})`}
          </span>
          {newRecord ? `★ New Level ${run.level} record!` : `Level ${run.level} best: ${previousBest}`}
        </div>
      </div>
      <div className="end-buttons">
        <button className="big-btn shadow" onClick={onNew}>
          <Icon name="play" size={22} fill="#1b1b1b" /> New Game
        </button>
        <button className="big-btn" onClick={onHome}>
          <Icon name="home" size={22} /> Home
        </button>
      </div>
    </div>
  );
}
