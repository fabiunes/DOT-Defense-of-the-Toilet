import type { EnemyKind, MerdomonKind, Rarity } from '../engine/types';

// Placeholder sketch art: one drawing per kind, scaled by size (Small / Big / Huge).

const INK = '#1b1b1b';

/** Drawing scale per size, anchored at the bottom so bigger creatures grow upwards. */
const SIZE_SCALE: Record<Rarity, number> = { common: 0.72, rare: 0.86, epic: 1 };

function scaled(rarity: Rarity) {
  const k = SIZE_SCALE[rarity];
  return `translate(50 94) scale(${k}) translate(-50 -94)`;
}

/** Shared SVG filter that gives drawings a wobbly, hand-drawn edge. */
export function SketchDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

export const MERDOMON_COLOR: Record<MerdomonKind, string> = {
  normal: '#a8703f',
  liquid: '#ecd36f',
  fart: 'rgba(196, 214, 160, 0.35)',
};

export const ENEMY_COLOR: Record<EnemyKind, string> = {
  phone: '#1b1b1b',
  book: '#3f9b57',
  console: '#e4362f',
};

/** Friendly cartoon face; (x, y) is the point between the eyes. */
function Face({ x, y, sad = false }: { x: number; y: number; sad?: boolean }) {
  return (
    <>
      <circle cx={x - 10} cy={y} r="6" fill="#fff" strokeWidth="3" />
      <circle cx={x + 10} cy={y} r="6" fill="#fff" strokeWidth="3" />
      <circle cx={x - 9} cy={y + 1} r="2.2" fill={INK} stroke="none" />
      <circle cx={x + 11} cy={y + 1} r="2.2" fill={INK} stroke="none" />
      <path fill="none" strokeWidth="3" d={sad ? `M${x - 7} ${y + 18}q7-5 14 0` : `M${x - 8} ${y + 14}q8 6 16 0`} />
    </>
  );
}

/** Angry face for distractions; (x, y) is the point between the eyes. */
function AngryFace({ x, y, light = false }: { x: number; y: number; light?: boolean }) {
  const c = light ? '#fff' : INK;
  return (
    <>
      <path fill="none" stroke={c} strokeWidth="3.5" d={`M${x - 12} ${y - 9}l9 4M${x + 12} ${y - 9}l-9 4`} />
      <circle cx={x - 7} cy={y} r="3.4" fill={c} stroke="none" />
      <circle cx={x + 7} cy={y} r="3.4" fill={c} stroke="none" />
      <path fill="none" stroke={c} strokeWidth="3" d={`M${x - 8} ${y + 15}q8-6 16 0`} />
    </>
  );
}

export function MerdomonArt({
  size = 56,
  kind = 'normal',
  rarity = 'epic',
  sad = false,
}: {
  size?: number;
  kind?: MerdomonKind;
  rarity?: Rarity;
  sad?: boolean;
}) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <g transform={scaled(rarity)}>
        <g filter="url(#rough)" stroke={INK} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
          {kind === 'normal' && (
            <>
              <path
                fill={MERDOMON_COLOR.normal}
                d="M16 90h68c9 0 13-8 9-14-2-3-5-5-9-5 5-4 5-11 0-15-3-2-7-2-10-1 2-6-1-12-8-14-3-1-6-1-8 0 2-6-1-12-8-16 1 6-3 10-8 11-7 2-11 8-10 15-6 0-11 5-10 11 0 3 2 6 5 8-7 1-11 7-9 12 1 5 6 8 10 8z"
              />
              <path fill="none" strokeWidth="3" d="M30 71q20 6 40 0" opacity=".35" />
              <Face x={50} y={62} sad={sad} />
            </>
          )}
          {kind === 'liquid' && (
            <>
              <path
                fill={MERDOMON_COLOR.liquid}
                d="M10 90c-4 0-5-6-1-8 5-2 7-6 7-12 0-16 15-30 34-30s34 14 34 30c0 6 2 10 7 12 4 2 3 8-1 8z"
              />
              <path fill={MERDOMON_COLOR.liquid} d="M28 90c0 5 6 5 6 0M64 90c0 7 7 7 7 0" />
              <path fill="none" strokeWidth="3" d="M30 52q8-6 14-2" opacity=".4" />
              <Face x={50} y={64} sad={sad} />
            </>
          )}
          {kind === 'fart' && (
            <>
              <path
                fill={MERDOMON_COLOR.fart}
                strokeDasharray="7 5"
                d="M22 88a15 15 0 0 1-2-30 18 18 0 0 1 28-18 17 17 0 0 1 30 8 15 15 0 0 1 2 40z"
              />
              <path fill="none" strokeWidth="3" d="M8 50h8M6 62h7M86 30l6-4M90 42h6" opacity=".5" />
              <Face x={50} y={62} sad={sad} />
            </>
          )}
        </g>
      </g>
    </svg>
  );
}

function Crown({ top }: { top: number }) {
  return <path fill="#f2c94c" d={`M32 ${top + 2} 28 ${top - 16}l11 8 11-12 11 12 11-8-4 18z`} />;
}

export function EnemyArt({
  size = 56,
  kind = 'phone',
  rarity = 'common',
  boss = false,
}: {
  size?: number;
  kind?: EnemyKind;
  rarity?: Rarity;
  boss?: boolean;
}) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <g transform={scaled(boss ? 'epic' : rarity)}>
        <g filter="url(#rough)" stroke={INK} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
          {kind === 'phone' && (
            <>
              {boss && <Crown top={20} />}
              <rect x="28" y="20" width="44" height="72" rx="8" fill={ENEMY_COLOR.phone} />
              <rect x="33" y="28" width="34" height="54" rx="3" fill="#fff" strokeWidth="2.5" />
              <AngryFace x={50} y={50} />
              {!boss && (
                <>
                  <circle cx="72" cy="20" r="9" fill="#fff" strokeWidth="3" />
                  <path d="M72 15.5v5M72 24.5v.5" strokeWidth="3" />
                </>
              )}
            </>
          )}
          {kind === 'book' && (
            <>
              {boss && <Crown top={26} />}
              <rect x="70" y="30" width="10" height="60" rx="2" fill="#fff" strokeWidth="3" />
              <rect x="20" y="26" width="56" height="66" rx="4" fill={ENEMY_COLOR.book} />
              <rect x="20" y="26" width="10" height="66" rx="3" fill="#2f7a43" strokeWidth="3" />
              <path d="M74 36h4M74 46h4M74 56h4M74 66h4M74 76h4" strokeWidth="1.5" />
              <AngryFace x={53} y={54} light />
            </>
          )}
          {kind === 'console' && (
            <>
              {boss && <Crown top={34} />}
              <rect x="10" y="38" width="20" height="44" rx="10" fill={ENEMY_COLOR.console} />
              <rect x="70" y="38" width="20" height="44" rx="10" fill={ENEMY_COLOR.console} />
              <rect x="28" y="36" width="44" height="48" rx="3" fill="#333" />
              <rect x="32" y="40" width="36" height="40" rx="2" fill="#fff" strokeWidth="2.5" />
              <circle cx="20" cy="52" r="3" fill={INK} stroke="none" />
              <circle cx="80" cy="64" r="3" fill={INK} stroke="none" />
              <AngryFace x={50} y={58} />
            </>
          )}
        </g>
      </g>
    </svg>
  );
}

/** The player on the toilet, seen from above (tank at the bottom, feet towards the slots). */
export function PlayerArt() {
  return (
    <svg viewBox="0 0 200 150" className="player-art" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <g filter="url(#rough)" stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" fill="#fff">
        <path fill="none" strokeWidth="1.5" opacity=".25" d="M0 30h200M0 75h200M0 120h200M40 0v150M100 0v150M160 0v150" />
        <rect x="62" y="118" width="76" height="30" rx="6" />
        <ellipse cx="100" cy="95" rx="40" ry="30" />
        <ellipse cx="100" cy="92" rx="28" ry="20" strokeWidth="2" />
        <rect x="76" y="32" width="20" height="56" rx="10" />
        <rect x="104" y="32" width="20" height="56" rx="10" />
        <rect x="74" y="34" width="52" height="10" rx="4" strokeWidth="2.5" />
        <ellipse cx="84" cy="24" rx="10" ry="12" />
        <ellipse cx="116" cy="24" rx="10" ry="12" />
        <ellipse cx="100" cy="104" rx="42" ry="16" />
        <path d="M62 100q-6-26 18-40M138 100q6-26-18-40" fill="none" strokeWidth="9" stroke={INK} />
        <path d="M62 100q-6-26 18-40M138 100q6-26-18-40" fill="none" strokeWidth="4" stroke="#fff" />
        <circle cx="100" cy="98" r="15" />
        <path fill="none" d="M88 92q6-8 12-2 6-8 12 2M90 99q10 6 20 0" strokeWidth="2.5" />
      </g>
    </svg>
  );
}
