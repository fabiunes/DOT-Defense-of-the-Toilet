import { useRef, useState, type ReactNode } from 'react';
import { BATHROOMS, BATHROOM_INFO, BOSS_INFO, LEVELS, LEVEL_BOSS, LEVEL_ENEMY_BONUS, STRUCTURES, STRUCTURE_INFO } from '../../engine/data';
import { beginRun } from '../../engine/game';
import { isUnlocked, loadBest, loadToiletPoints, unlockBathroom } from '../../engine/save';
import type { BathroomId, Level, RunState } from '../../engine/types';
import { EnemyArt } from '../art';
import { StructureIcon } from '../bathroom';
import { Icon } from '../icons';
import type { Update } from '../update';
import { ToiletPoints } from './ToiletsScreen';

/** First screen of a run: pick the level (the Boss) at the top and the starting bathroom at the bottom. */
export function BossRevealScreen({ run, update }: { run: RunState; update: Update }) {
  const [level, setLevel] = useState<Level>(run.level);
  const [bathroomIdx, setBathroomIdx] = useState(0);
  const [, refresh] = useState(0);
  const bathroom = BATHROOMS[bathroomIdx];
  const unlocked = isUnlocked(bathroom);

  return (
    <div className="screen setup">
      <div className="setup-head">
        <h2>New run</h2>
        <ToiletPoints />
      </div>

      <Carousel
        label="Level"
        index={level - 1}
        count={LEVELS.length}
        onChange={(i) => setLevel(LEVELS[i])}
      >
        <LevelCard level={level} />
      </Carousel>

      <Carousel label="Bathroom" index={bathroomIdx} count={BATHROOMS.length} onChange={setBathroomIdx}>
        <BathroomCard id={bathroom} />
      </Carousel>

      {unlocked ? (
        <button className="big-btn shadow" onClick={() => update((s) => beginRun(s, level, bathroom))}>
          <Icon name="play" size={22} fill="#1b1b1b" /> Start
        </button>
      ) : (
        <button
          className="big-btn shadow unlock-btn"
          disabled={loadToiletPoints() < BATHROOM_INFO[bathroom].cost}
          onClick={() => {
            unlockBathroom(bathroom);
            refresh((n) => n + 1);
          }}
        >
          🔒 Unlock <ToiletPointsCost cost={BATHROOM_INFO[bathroom].cost} />
        </button>
      )}
    </div>
  );
}

export function ToiletPointsCost({ cost }: { cost: number }) {
  return (
    <span className="cost tp-cost">
      <Icon name="toilet" size={13} fill="#f2c94c" />
      {cost.toLocaleString('en')}
    </span>
  );
}

/** One item at a time with arrows and swipe (no page scrolling). */
function Carousel({
  label,
  index,
  count,
  onChange,
  children,
}: {
  label: string;
  index: number;
  count: number;
  onChange: (i: number) => void;
  children: ReactNode;
}) {
  const touchX = useRef<number | null>(null);
  const go = (d: number) => onChange((index + d + count) % count);
  return (
    <div
      className="carousel"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="carousel-label">
        {label}
        <span className="tut-dots">
          {Array.from({ length: count }, (_, i) => (
            <button key={i} className={`tut-dot ${i === index ? 'on' : ''}`} onClick={() => onChange(i)} aria-label={`${label} ${i + 1}`} />
          ))}
        </span>
      </div>
      <div className="carousel-body">
        <button className="icon-btn carousel-arrow" onClick={() => go(-1)} aria-label={`Previous ${label}`}>
          <Icon name="play" size={18} fill="#fff" className="flip" />
        </button>
        <div className="carousel-item sk">{children}</div>
        <button className="icon-btn carousel-arrow" onClick={() => go(1)} aria-label={`Next ${label}`}>
          <Icon name="play" size={18} fill="#fff" />
        </button>
      </div>
    </div>
  );
}

function LevelCard({ level }: { level: Level }) {
  const info = BOSS_INFO[LEVEL_BOSS[level]];
  const best = loadBest(level);
  return (
    <div className="level-card">
      <EnemyArt size={64} kind={info.kind} rarity="epic" boss />
      <span className="level-text">
        <span className="level-head">
          <b>Level {level}</b>
          <span className="level-skulls">{'💀'.repeat(level)}</span>
        </span>
        <b className="level-name">{info.name}</b>
        <small>
          {info.runDesc}
          {LEVEL_ENEMY_BONUS[level] > 0 && ` · enemies +${LEVEL_ENEMY_BONUS[level]} stat`}
        </small>
        <small>
          <b>{info.ability}</b>: {info.finalDesc}
        </small>
        {best > 0 && <small className="level-best">Best: {best}</small>}
      </span>
    </div>
  );
}

export function BathroomCard({ id }: { id: BathroomId }) {
  const b = BATHROOM_INFO[id];
  const unlocked = isUnlocked(id);
  return (
    <div className={`bathroom-card ${unlocked ? '' : 'locked'}`} style={{ background: b.color }}>
      <div className="bathroom-card-head">
        <b>{b.name}</b>
        {!unlocked && <ToiletPointsCost cost={b.cost} />}
      </div>
      <div className="bathroom-mini">
        {STRUCTURES.map((s) => (
          <span key={s} className={`mini-struct ${b.structures[s] === 0 ? 't0' : ''}`} title={STRUCTURE_INFO[s].name}>
            <StructureIcon id={s} tier={Math.max(1, b.structures[s])} size={30} />
            <small>T{b.structures[s]}</small>
          </span>
        ))}
      </div>
      <div className="bathroom-start">
        <span>
          <Icon name="tp" size={16} fill="#fff" />
          {b.tp}
        </span>
        <span>
          <Icon name="focus" size={16} fill="#fff" />
          {b.concentration}
        </span>
        <span>
          <Icon name="poop" size={16} fill="#fff" />
          {b.poop}
        </span>
      </div>
    </div>
  );
}
