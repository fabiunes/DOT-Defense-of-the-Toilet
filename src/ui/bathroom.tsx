import { BATHROOM_INFO, MAX_TIER, STRUCTURES, STRUCTURE_INFO } from '../engine/data';
import type { RunState, StructureId } from '../engine/types';

// Sketch art for the bathroom structures. Higher tiers add details: blue accents at Tier 2, gold at Tier 3.

const INK = '#1b1b1b';
const ACCENT = ['#fff', '#cfe3f7', '#f2c94c'];
const GOLD = '#c99a14';

function ShowerArt({ tier }: { tier: number }) {
  const accent = ACCENT[tier - 1];
  return (
    <>
      <rect x="6" y="48" width="48" height="8" rx="2" fill="#fff" />
      {tier >= 2 && <path fill="none" strokeWidth="2.5" d="M8 6q5 7 0 14q5 7 0 14q5 7 0 12" />}
      <path fill="none" d="M18 48V10h18" stroke={tier >= 3 ? GOLD : INK} />
      <path fill={accent} d="M30 10h16l5 7H25z" />
      <path strokeWidth="2.5" d="M30 23v4M37 23v4M44 23v4M33 31v4M40 31v4M36 39v3" />
    </>
  );
}

function SinkArt({ tier }: { tier: number }) {
  const accent = ACCENT[tier - 1];
  return (
    <>
      {tier >= 2 && <rect x="16" y="2" width="28" height="16" rx="4" fill={accent} />}
      {tier >= 3 && <path d="M50 28v-6M47 22h6" />}
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

function BrushArt({ tier }: { tier: number }) {
  return (
    <>
      <path d="M30 40V6" strokeWidth="5" stroke={tier >= 3 ? GOLD : INK} />
      <circle cx="30" cy="5" r="3.5" fill={tier >= 3 ? '#f2c94c' : '#fff'} />
      <path fill={ACCENT[tier - 1]} d="M16 34h28l-3 22H19z" />
      <path strokeWidth="2" d="M22 34l-3-5M30 34v-6M38 34l3-5" />
      {tier >= 2 && (
        <>
          <circle cx="47" cy="22" r="3" fill="#fff" strokeWidth="2" />
          <circle cx="52" cy="14" r="2" fill="#fff" strokeWidth="2" />
          <circle cx="12" cy="20" r="2.5" fill="#fff" strokeWidth="2" />
        </>
      )}
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
      <path d="M8 6v20h44V6" fill="none" strokeWidth="3" stroke={tier >= 3 ? GOLD : INK} />
      {roll(19, 10)}
      <path d="M41 26v10" strokeWidth="2.5" />
      {tier >= 2 && roll(8, 36)}
      {tier >= 3 && roll(30, 36)}
      {tier >= 2 && <circle cx="30" cy="6" r="3" fill={accent} />}
    </>
  );
}

/** The player sitting on the toilet, seen from above, drawn to fit a square block. */
function ToiletArt({ tier }: { tier: number }) {
  const accent = ACCENT[tier - 1];
  return (
    <>
      {/* tank and bowl */}
      <rect x="10" y="47" width="40" height="11" rx="2" fill={accent} />
      <ellipse cx="30" cy="33" rx="22" ry="16" fill="#fff" />
      <ellipse cx="30" cy="33" rx="16" ry="11" fill={tier >= 2 ? accent : '#fff'} strokeWidth="2" />
      {/* legs and feet, towards the top */}
      <rect x="23" y="13" width="6" height="21" rx="3" fill="#fff" strokeWidth="2" />
      <rect x="31" y="13" width="6" height="21" rx="3" fill="#fff" strokeWidth="2" />
      <rect x="22" y="16" width="16" height="3.5" rx="1.5" fill="#fff" strokeWidth="1.8" />
      <ellipse cx="26" cy="10" rx="3.5" ry="4" fill="#fff" strokeWidth="2" />
      <ellipse cx="34" cy="10" rx="3.5" ry="4" fill="#fff" strokeWidth="2" />
      {/* shoulders, arms resting on the knees, head */}
      <ellipse cx="30" cy="39" rx="13" ry="5" fill="#fff" strokeWidth="2" />
      <path fill="none" strokeWidth="2" d="M18 39q-1-9 7-13M42 39q1-9-7-13" />
      <circle cx="30" cy="38" r="5.5" fill="#fff" strokeWidth="2" />
      <path fill="none" strokeWidth="1.5" d="M26 35.5q2-3 4-1 2-3 4 1" />
    </>
  );
}

/** Tier 0 (not built yet) is drawn like Tier 1; the block greys it out. */
export function StructureArt({ id, tier: rawTier, size = 56 }: { id: StructureId; tier: number; size?: number | string }) {
  const tier = Math.max(1, rawTier);
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden>
      <g filter="url(#rough)" stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        {id === 'stall' && <ShowerArt tier={tier} />}
        {id === 'sink' && <SinkArt tier={tier} />}
        {id === 'bidet' && <BidetArt tier={tier} />}
        {id === 'scrubber' && <BrushArt tier={tier} />}
        {id === 'toilet' && <ToiletArt tier={tier} />}
        {id === 'holder' && <HolderArt tier={tier} />}
      </g>
    </svg>
  );
}

export function StructureIcon({ id, tier, size = 24 }: { id: StructureId; tier: number; size?: number }) {
  return <StructureArt id={id} tier={tier} size={size} />;
}

export function TierBadge({ tier }: { tier: number }) {
  return <span className={`tier-badge t${tier}`}>{tier >= MAX_TIER ? 'MAX' : `T${tier}`}</span>;
}

/** The bottom of the main screen: six blocks like the Merdomon slots, one structure each. All tappable. */
export function Bathroom({ run, onOpen }: { run: RunState; onOpen: (id: StructureId) => void }) {
  return (
    // Each bathroom type tints its blocks with its own colour.
    <div className="bathroom" style={{ ['--bathroom' as string]: BATHROOM_INFO[run.bathroom].color }}>
      {STRUCTURES.map((id) => (
        <button
          key={id}
          className={`struct-block sk ${id} ${run.structures[id] === 0 ? 't0' : ''}`}
          onClick={() => onOpen(id)}
          aria-label={STRUCTURE_INFO[id].name}
        >
          <span className="block-label">{STRUCTURE_INFO[id].name}</span>
          <StructureArt id={id} tier={run.structures[id]} size="100%" />
          <TierBadge tier={run.structures[id]} />
        </button>
      ))}
    </div>
  );
}
