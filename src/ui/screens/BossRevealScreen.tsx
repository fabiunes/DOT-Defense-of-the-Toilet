import { useState } from 'react';
import { BOSS_INFO, LEVELS, LEVEL_BOSS, LEVEL_ENEMY_BONUS } from '../../engine/data';
import { beginRun } from '../../engine/game';
import { loadBest } from '../../engine/save';
import type { Level, RunState } from '../../engine/types';
import { EnemyArt } from '../art';
import { Icon } from '../icons';
import type { Update } from '../update';

/** First screen of a run: pick the difficulty level, i.e. the Boss you will face on waves 5 and 10. */
export function BossRevealScreen({ run, update }: { run: RunState; update: Update }) {
  const [level, setLevel] = useState<Level>(run.level);
  return (
    <div className="screen boss-reveal">
      <h2 className="screen-title">Choose your nemesis</h2>
      <div className="level-list">
        {LEVELS.map((l) => {
          const info = BOSS_INFO[LEVEL_BOSS[l]];
          const best = loadBest(l);
          return (
            <button key={l} className={`level-option sk ${level === l ? 'on' : ''}`} onClick={() => setLevel(l)}>
              <EnemyArt size={58} kind={info.kind} rarity="epic" boss />
              <span className="level-text">
                <span className="level-head">
                  <b>Level {l}</b>
                  <span className="level-skulls">{'💀'.repeat(l)}</span>
                </span>
                <b className="level-name">{info.name}</b>
                <small>
                  {info.runDesc}
                  {LEVEL_ENEMY_BONUS[l] > 0 && ` · enemies +${LEVEL_ENEMY_BONUS[l]} stat`}
                </small>
                <small>
                  <b>{info.ability}</b>: {info.finalDesc}
                </small>
                {best > 0 && <small className="level-best">Best: {best}</small>}
              </span>
            </button>
          );
        })}
      </div>
      <button className="big-btn shadow" onClick={() => update((s) => beginRun(s, level))}>
        <Icon name="play" size={22} fill="#1b1b1b" /> Start
      </button>
    </div>
  );
}
