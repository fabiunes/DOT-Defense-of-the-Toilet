// Placeholder sketch art. Every Merdomon / Distraction-mon shares one drawing for now.

const INK = '#1b1b1b';

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

export function MerdomonArt({ size = 56, sad = false }: { size?: number; sad?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <g filter="url(#rough)" stroke={INK} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        <path
          fill="#fff"
          d="M16 90h68c9 0 13-8 9-14-2-3-5-5-9-5 5-4 5-11 0-15-3-2-7-2-10-1 2-6-1-12-8-14-3-1-6-1-8 0 2-6-1-12-8-16 1 6-3 10-8 11-7 2-11 8-10 15-6 0-11 5-10 11 0 3 2 6 5 8-7 1-11 7-9 12 1 5 6 8 10 8z"
        />
        <path fill="none" strokeWidth="3" d="M30 71q20 6 40 0M38 55q12 4 24 0" opacity=".35" />
        <circle cx="40" cy="62" r="6" fill="#fff" strokeWidth="3" />
        <circle cx="60" cy="62" r="6" fill="#fff" strokeWidth="3" />
        <circle cx="41" cy="63" r="2.2" fill={INK} stroke="none" />
        <circle cx="61" cy="63" r="2.2" fill={INK} stroke="none" />
        <path fill="none" strokeWidth="3" d={sad ? 'M43 80q7-5 14 0' : 'M42 76q8 6 16 0'} />
      </g>
    </svg>
  );
}

export function EnemyArt({ size = 56, boss = false }: { size?: number; boss?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <g filter="url(#rough)" stroke={INK} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        {boss && <path fill="#fff" d="M30 22 26 4l12 9 12-12 12 12 12-9-4 18z" />}
        <rect x="28" y={boss ? 20 : 12} width="44" height={boss ? 74 : 78} rx="8" fill="#fff" />
        <rect x="34" y={boss ? 28 : 21} width="32" height={boss ? 52 : 56} rx="3" fill="#fff" strokeWidth="2.5" />
        <path fill="none" strokeWidth="3.5" d={boss ? 'M37 41l11 6M63 41l-11 6' : 'M38 38l10 4M62 38l-10 4'} />
        <circle cx="43" cy={boss ? 52 : 48} r="3.4" fill={INK} stroke="none" />
        <circle cx="57" cy={boss ? 52 : 48} r="3.4" fill={INK} stroke="none" />
        <path fill="none" strokeWidth="3" d={boss ? 'M40 68l5-4 5 4 5-4 5 4' : 'M42 64q8-6 16 0'} />
        {!boss && (
          <>
            <circle cx="72" cy="14" r="9" fill="#fff" strokeWidth="3" />
            <path d="M72 9.5v5M72 18.5v.5" strokeWidth="3" />
          </>
        )}
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
