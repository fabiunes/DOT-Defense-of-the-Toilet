import { MAX_TIER, STRUCTURE_INFO } from '../engine/data';
import type { RunState, StructureId } from '../engine/types';
import { PlayerArt } from './art';

// Sketch art for the bathroom structures. Higher tiers add details: blue accents at Tier 2, gold at Tier 3.

const INK = '#1b1b1b';
const ACCENT = ['#fff', '#cfe3f7', '#f2c94c'];

function SinkArt({ tier }: { tier: number }) {
  const accent = ACCENT[tier - 1];
  return (
    <>
      {tier >= 2 && <rect x="16" y="2" width="28" height="18" rx="4" fill={accent} />}
      {tier >= 3 && <path d="M50 30v-6M47 24h6" />}
      <path fill={tier >= 3 ? accent : '#fff'} d="M30 26v-6h8" />
      <path fill="#fff" d="M6 30h48a24 14 0 0 1-48 0z" />
      <path d="M22 44v12M38 44v12" />
    </>
  );
}

function BidetArt({ tier }: { tier: number }) {
  const accent = ACCENT[tier - 1];
  return (
    <>
      <path fill="#fff" d="M10 26h40a20 22 0 0 1-40 0z" />
      <ellipse cx="30" cy="27" rx="13" ry="5" fill={tier >= 2 ? accent : '#fff'} strokeWidth="2.5" />
      <path d="M30 20v-8" />
      <path fill="none" d="M24 10c3-5 9-5 12 0" />
      {tier >= 2 && <path d="M14 22v-5M46 22v-5" />}
      {tier >= 3 && <path fill={accent} d="M8 26h44" strokeWidth="5" />}
    </>
  );
}

function HolderArt({ tier }: { tier: number }) {
  const accent = ACCENT[tier - 1];
  const roll = (x: number, y: number) => (
    <>
      <rect x={x} y={y} width="22" height="16" rx="7" fill="#fff" />
      <ellipse cx={x + 6} cy={y + 8} rx="3" ry="5" fill="#fff" strokeWidth="2" />
    </>
  );
  return (
    <>
      <path d="M8 6v20h44V6" fill="none" strokeWidth="3" stroke={tier >= 3 ? '#c99a14' : INK} />
      {roll(19, 10)}
      <path d="M41 26v10" strokeWidth="2.5" />
      {tier >= 2 && roll(8, 36)}
      {tier >= 3 && roll(30, 36)}
      {tier >= 2 && <circle cx="30" cy="6" r="3" fill={accent} />}
    </>
  );
}

export function StructureArt({ id, tier, size = 56 }: { id: Exclude<StructureId, 'toilet'>; tier: number; size?: number }) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden>
      <g filter="url(#rough)" stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        {id === 'sink' && <SinkArt tier={tier} />}
        {id === 'bidet' && <BidetArt tier={tier} />}
        {id === 'holder' && <HolderArt tier={tier} />}
      </g>
    </svg>
  );
}

/** Small toilet drawing, for icons. */
export function ToiletIcon({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden>
      <g stroke={INK} strokeWidth="4" strokeLinejoin="round" fill="#fff">
        <rect x="14" y="4" width="32" height="14" rx="3" />
        <path d="M6 24h48a24 18 0 0 1-16 17v13H22V41A24 18 0 0 1 6 24z" />
      </g>
    </svg>
  );
}

export function StructureIcon({ id, tier, size = 24 }: { id: StructureId; tier: number; size?: number }) {
  return id === 'toilet' ? <ToiletIcon size={size} /> : <StructureArt id={id} tier={tier} size={size} />;
}

function TierBadge({ tier }: { tier: number }) {
  return <span className={`tier-badge t${tier}`}>{tier >= MAX_TIER ? 'MAX' : `T${tier}`}</span>;
}

/** The bottom of the main screen: the player on the toilet and the structures in front of it. All tappable. */
export function Bathroom({ run, onOpen }: { run: RunState; onOpen: (id: StructureId) => void }) {
  const item = (id: Exclude<StructureId, 'toilet'>) => (
    <button className={`struct ${id}`} onClick={() => onOpen(id)} aria-label={STRUCTURE_INFO[id].name}>
      <StructureArt id={id} tier={run.structures[id]} />
      <TierBadge tier={run.structures[id]} />
    </button>
  );
  return (
    <div className="bathroom">
      <div className="bathroom-row">
        {item('sink')}
        {item('holder')}
        {item('bidet')}
      </div>
      <button className="struct toilet" onClick={() => onOpen('toilet')} aria-label={STRUCTURE_INFO.toilet.name}>
        <PlayerArt />
        <TierBadge tier={run.structures.toilet} />
      </button>
    </div>
  );
}
