import { useEffect } from 'react';
import { loadBest, saveBest } from '../../engine/save';
import { runScore } from '../../engine/score';
import type { RunState } from '../../engine/types';
import { Icon } from '../icons';

/** Record before this run ended, read once per finished run (keyed by its RNG state). */
const previousBest = new Map<number, number>();

export function EndScreen({ run, onHome, onNew }: { run: RunState; onHome: () => void; onNew: () => void }) {
  const victory = run.phase === 'victory';
  const { lines, total } = runScore(run);
  if (!previousBest.has(run.rngState)) previousBest.set(run.rngState, loadBest());
  const prev = previousBest.get(run.rngState)!;
  const newRecord = total > prev;

  useEffect(() => {
    saveBest(total);
  }, [total]);

  return (
    <div className="screen end">
      <div className={`end-title ${victory ? 'win' : 'lose'}`}>
        <Icon name={victory ? 'trophy' : 'skull'} size={52} fill="#fff" />
        <h1>{victory ? 'Victory!' : 'Game Over'}</h1>
        <p className="muted">{victory ? 'Break completed in peace.' : `Distracted at wave ${run.round}`}</p>
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
          {newRecord ? '★ New record!' : `Best: ${prev}`}
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
