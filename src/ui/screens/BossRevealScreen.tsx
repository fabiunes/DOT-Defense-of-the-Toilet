import { useRef, useState, type ReactNode } from 'react';
import { BATHROOMS, BATHROOM_INFO, BOSS_INFO, LEVELS, LEVEL_BOSS, LEVEL_ENEMY_BONUS, LEVEL_REWARD, STRUCTURES, STRUCTURE_INFO } from '../../engine/data';
import { beginRun } from '../../engine/game';
import { hasWon, isLevelUnlocked, loadBest, loadLastSetup, saveLastSetup } from '../../engine/save';
import type { BathroomId, Level, RunState } from '../../engine/types';
import { analytics } from '../analytics';
import { EnemyArt } from '../art';
import { StructureIcon } from '../bathroom';
import { ToiletPoints } from '../components';
import { Icon } from '../icons';
import type { Update } from '../update';

/**
 * First screen of a run. Each bathroom is a campaign: pick it at the top, the level (Boss) in the middle,
 * and see its journey at the bottom. Opens on the last choice.
 */
export function BossRevealScreen({ update }: { run: RunState; update: Update }) {
  const [last] = useState(loadLastSetup);
  const [bathroomIdx, setBathroomIdx] = useState(Math.max(0, BATHROOMS.indexOf(last.bathroom)));
  const [level, setLevel] = useState<Level>(last.level);
  const bathroom = BATHROOMS[bathroomIdx];
  const open = isLevelUnlocked(level, bathroom);

  return (
    <div className="screen setup">
      <div className="setup-head">
        <h2>New run</h2>
        <ToiletPoints />
      </div>

      <Carousel label="Bathroom" index={bathroomIdx} count={BATHROOMS.length} onChange={setBathroomIdx}>
        <BathroomCard id={bathroom} />
      </Carousel>

      <Carousel label="Level" index={level - 1} count={LEVELS.length} onChange={(i) => setLevel(LEVELS[i])}>
        <LevelCard level={level} bathroom={bathroom} />
      </Carousel>

      <Journey bathroom={bathroom} selected={level} onSelect={setLevel} />

      {open ? (
        <button
          className="big-btn shadow"
          onClick={() => {
            saveLastSetup(bathroom, level);
            analytics.runStart(level, bathroom);
            update((s) => beginRun(s, level, bathroom));
          }}
        >
          <Icon name="play" size={22} fill="#1b1b1b" /> Start
        </button>
      ) : (
        <button className="big-btn shadow" disabled>
          🔒 Win Level {level - 1} to unlock
        </button>
      )}
    </div>
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

function LevelCard({ level, bathroom }: { level: Level; bathroom: BathroomId }) {
  const info = BOSS_INFO[LEVEL_BOSS[level]];
  const best = loadBest(level, bathroom);
  const open = isLevelUnlocked(level, bathroom);
  return (
    <div className={`level-card ${open ? '' : 'level-locked'}`}>
      <EnemyArt size={60} kind={info.kind} rarity="epic" boss bossId={LEVEL_BOSS[level]} />
      <span className="level-text">
        <span className="level-head">
          <b>Level {level}</b>
          <span className="level-skulls">{level > 3 ? '💀 ×' + level : '💀'.repeat(level)}</span>
        </span>
        <b className="level-name">{info.name}</b>
        <small>
          {info.runDesc}
          {LEVEL_ENEMY_BONUS[level] > 0 && ` · enemies +${LEVEL_ENEMY_BONUS[level]} stat`}
        </small>
        <small className="level-best">
          {open ? (best > 0 ? `Best: ${best} · ` : '') : `🔒 Win Level ${level - 1} · `}
          Toilet Points ×{LEVEL_REWARD[level]}
        </small>
      </span>
    </div>
  );
}

/** The bathroom's campaign: its 7 levels, ✓ when won at least once, 🔒 until the previous one is won. */
function Journey({ bathroom, selected, onSelect }: { bathroom: BathroomId; selected: Level; onSelect: (l: Level) => void }) {
  const won = LEVELS.filter((l) => hasWon(bathroom, l)).length;
  return (
    <div className="journey">
      <div className="carousel-label">
        Journey
        <small className="muted">
          {won}/{LEVELS.length} won
        </small>
      </div>
      <div className="journey-path">
        {LEVELS.map((l) => {
          const state = hasWon(bathroom, l) ? 'won' : isLevelUnlocked(l, bathroom) ? 'open' : 'locked';
          return (
            <button
              key={l}
              className={`journey-node ${state} ${l === selected ? 'selected' : ''}`}
              onClick={() => onSelect(l)}
              aria-label={`Level ${l}`}
            >
              <EnemyArt size={30} kind={BOSS_INFO[LEVEL_BOSS[l]].kind} rarity="epic" boss bossId={LEVEL_BOSS[l]} />
              <small>{state === 'won' ? '✓' : state === 'locked' ? '🔒' : l}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BathroomCard({ id }: { id: BathroomId }) {
  const b = BATHROOM_INFO[id];
  return (
    <div className="bathroom-card" style={{ background: b.color }}>
      <div className="bathroom-card-head">
        <b>
          <span className="bathroom-icon">{b.icon}</span> {b.name}
        </b>
        <span className="bathroom-start">
          <span>
            <Icon name="tp" size={15} fill="#fff" />
            {b.tp}
          </span>
          <span>
            <Icon name="focus" size={15} fill="#fff" />
            {b.concentration}
          </span>
          <span>
            <Icon name="poop" size={15} fill="#fff" />
            {b.poop}
          </span>
        </span>
      </div>
      <div className="bathroom-mini">
        {STRUCTURES.map((s) => (
          <span key={s} className={`mini-struct ${b.structures[s] === 0 ? 't0' : ''}`} title={STRUCTURE_INFO[s].name}>
            <StructureIcon id={s} tier={Math.max(1, b.structures[s])} size={26} />
            <small>T{b.structures[s]}</small>
          </span>
        ))}
      </div>
      <small className="bathroom-special">
        <b>{b.special.name}</b>: {b.special.desc}
      </small>
    </div>
  );
}
