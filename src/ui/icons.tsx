import type { ReactNode } from 'react';
import type { ItemId, Resource, StatKey, TraitId } from '../engine/types';

export type IconName =
  | 'tp' | 'poop' | 'focus' | 'ap' | 'heart' | 'fist' | 'shield' | 'bolt'
  | 'heal' | 'toilet' | 'shop' | 'swap' | 'flush' | 'bonus' | 'upgrade' | 'fight'
  | 'close' | 'check' | 'star' | 'ff' | 'skip' | 'home' | 'trophy' | 'skull' | 'crown' | 'question' | 'phone' | 'play'
  | 'trade' | 'eye'
  | 'brush' | 'magazine' | 'bidet' | 'shower' | 'window' | 'towel' | 'toothbrush' | 'flipflops' | 'gameboy' | 'dice';

export const TRAIT_COLOR: Record<TraitId, string> = {
  paper: '#4f8fe8',
  merdon: '#9a6233',
  healthy: '#e53950',
  haste: '#f2b705',
  fighter: '#f07a1a',
  defender: '#22a06b',
  action: '#8b5cf6',
};

export const TRAIT_ICON: Record<TraitId, IconName> = {
  paper: 'tp',
  merdon: 'poop',
  healthy: 'heart',
  haste: 'bolt',
  fighter: 'fist',
  defender: 'shield',
  action: 'ap',
};

export const STAT_ICON: Record<StatKey, IconName> = { hp: 'heart', atk: 'fist', def: 'shield', spd: 'bolt' };
export const RESOURCE_ICON: Record<Resource, IconName> = { tp: 'tp', merdascore: 'poop', concentration: 'focus', ap: 'ap' };

function shapes(name: IconName, fill: string): ReactNode {
  switch (name) {
    case 'tp':
      return (
        <>
          <path d="M6 6v11a6 2.5 0 0 0 12 0V6" fill={fill} />
          <ellipse cx="12" cy="6" rx="6" ry="2.5" fill={fill} />
          <ellipse cx="12" cy="6" rx="1.8" ry="0.8" />
        </>
      );
    case 'poop':
      return (
        <path
          fill={fill}
          d="M5 20.5h14c2 0 3-1.8 2-3.3-.6-.9-1.4-1.2-2.2-1.2 1.2-1 1.2-2.8 0-3.7-.8-.6-1.7-.6-2.5-.3.5-1.6-.3-3-1.9-3.4-.7-.2-1.4-.1-1.9.1.4-1.6-.2-3-1.9-4 .2 1.5-.8 2.5-2 2.8-1.7.4-2.6 2-2.4 3.6-1.5 0-2.6 1.2-2.5 2.6 0 .7.4 1.4 1.1 1.9-1.6.3-2.6 1.7-2.1 3 .3 1.2 1.4 1.9 2.3 1.9z"
        />
      );
    case 'focus':
      return (
        <>
          <circle cx="12" cy="12" r="9" fill={fill} />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" />
        </>
      );
    case 'ap':
      return <path d="M12 3 20 12 12 21 4 12z" fill={fill} />;
    case 'heart':
      return (
        <path
          fill={fill}
          d="M12 20.5s-7.5-4.6-9-9.6C2 7.4 4.3 4.5 7.3 4.5c2 0 3.4 1.1 4.7 2.8 1.3-1.7 2.7-2.8 4.7-2.8 3 0 5.3 2.9 4.3 6.4-1.5 5-9 9.6-9 9.6z"
        />
      );
    case 'fist':
      // Boxing glove.
      return (
        <>
          <path fill={fill} d="M7.5 16.5V8.5A5.5 5.5 0 0 1 13 3h1.5A5.5 5.5 0 0 1 20 8.5v3a5 5 0 0 1-5 5z" />
          <path fill={fill} d="M7.5 10.5H6a2.5 2.5 0 0 0 0 5h1.5" />
          <rect x="7" y="16.5" width="13" height="4.5" rx="1" fill={fill} />
          <path d="M11 7.5c1.5-1 4-1 5.5 0M10.5 18.75h6" />
        </>
      );
    case 'shield':
      return <path fill={fill} d="M12 2.5 4.5 5.5v5.5c0 4.8 3.2 8.6 7.5 10.5 4.3-1.9 7.5-5.7 7.5-10.5V5.5z" />;
    case 'bolt':
      return <path fill={fill} d="M13.5 2.5 5 13.5h6l-1.5 8 8.5-11h-6z" />;
    case 'heal':
      return <path fill={fill} d="M9 3.5h6v5.5h5.5v6H15v5.5H9V15H3.5V9H9z" />;
    case 'toilet':
      return (
        <>
          <rect x="6" y="2.5" width="12" height="5" rx="1" fill={fill} />
          <path fill={fill} d="M3.5 10h17a8.5 6 0 0 1-5.5 6v4.5H9V16a8.5 6 0 0 1-5.5-6z" />
        </>
      );
    case 'shop':
      return (
        <>
          <path fill={fill} d="M5 8h14l-1.2 12.5H6.2z" />
          <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
        </>
      );
    case 'swap':
      return <path d="M7 4v16M3.5 7.5 7 4l3.5 3.5M17 20V4M13.5 16.5 17 20l3.5-3.5" />;
    case 'flush':
      return (
        <>
          <path fill={fill} d="M12 3s6.5 6.5 6.5 11a6.5 6.5 0 0 1-13 0C5.5 9.5 12 3 12 3z" />
          <path d="M9.5 14.5a2.5 2.5 0 0 0 5 0" />
        </>
      );
    case 'bonus':
      return (
        <>
          <path fill={fill} d="M12 3 20 12 12 21 4 12z" />
          <path d="M12 9v6M9 12h6" />
        </>
      );
    case 'upgrade':
      return <path d="M12 18V5M6.5 10.5 12 5l5.5 5.5M6 21h12" />;
    case 'fight':
      return <path d="M4 4l11 11M20 4 9 15M13 17l4-4M7 13l4 4M15 15l4.5 4.5M9 15l-4.5 4.5" />;
    case 'close':
      return <path d="M6 6l12 12M18 6 6 18" />;
    case 'check':
      return <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />;
    case 'star':
      return <path fill={fill} d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />;
    case 'play':
      return <path fill={fill} d="M7 4.5 19 12 7 19.5z" />;
    case 'ff':
      return <path fill={fill} d="M3 6l8 6-8 6zM12 6l8 6-8 6z" />;
    case 'skip':
      return <path fill={fill} d="M3 6l7.5 6L3 18zM11 6l7.5 6-7.5 6zM20.5 5.5v13" />;
    case 'home':
      return <path fill={fill} d="M3.5 11 12 3.5l8.5 7.5M6 9.5v11h12v-11" />;
    case 'trophy':
      return (
        <>
          <path fill={fill} d="M7 3.5h10v6a5 5 0 0 1-10 0z" />
          <path d="M7 5.5H4a3 3 0 0 0 3 4.5M17 5.5h3a3 3 0 0 1-3 4.5M12 14.5v3.5M8 20.5h8M9.5 18h5" />
        </>
      );
    case 'skull':
      return (
        <>
          <path fill={fill} d="M12 3a8 8 0 0 0-5 14.3V20.5h10v-3.2A8 8 0 0 0 12 3z" />
          <circle cx="9" cy="11.5" r="1.8" fill="currentColor" />
          <circle cx="15" cy="11.5" r="1.8" fill="currentColor" />
          <path d="M10 20.5v-2.5M14 20.5v-2.5" />
        </>
      );
    case 'crown':
      return <path fill={fill} d="M3.5 18.5 2.5 7l5.5 4.5L12 4l4 7.5L21.5 7l-1 11.5z" />;
    case 'question':
      return (
        <>
          <circle cx="12" cy="12" r="9" fill={fill} />
          <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 1-1 1.7M12 16.5v.5" />
        </>
      );
    case 'phone':
      return (
        <>
          <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" fill={fill} />
          <path d="M10.5 18.5h3" />
        </>
      );
    case 'trade':
      return <path d="M4 8.5h14M14.5 5 18 8.5 14.5 12M20 15.5H6M9.5 12 6 15.5 9.5 19" />;
    case 'eye':
      return (
        <>
          <path fill={fill} d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </>
      );
    case 'toothbrush':
      return (
        <>
          <path d="M2.5 17h11" strokeWidth={3} />
          <rect x="13.5" y="14.5" width="8" height="4.5" rx="1.5" fill={fill} />
          <path d="M15 14.5V11M17.5 14.5V11M20 14.5V11" />
        </>
      );
    case 'flipflops':
      return (
        <>
          <path fill={fill} d="M8 2.5c-2.8 0-4 3-4 7 0 5.5 1.5 12 4 12s4-6.5 4-12c0-4-1.2-7-4-7z" />
          <path fill={fill} d="M16.5 4.5c-2.5 0-3.5 2.7-3.5 6.3 0 5 1.3 10.7 3.5 10.7s3.5-5.7 3.5-10.7c0-3.6-1-6.3-3.5-6.3z" />
          <path d="M5 11l3-3.5 3 3.5M14 12.5l2.5-3 2.5 3" />
        </>
      );
    case 'gameboy':
      return (
        <>
          <rect x="6" y="2.5" width="12" height="19" rx="2" fill={fill} />
          <rect x="8.5" y="5" width="7" height="6" rx="0.5" />
          <path d="M9 16h3M10.5 14.5v3" />
          <circle cx="15" cy="16.5" r="0.8" fill="currentColor" />
          <circle cx="16.3" cy="14.6" r="0.8" fill="currentColor" />
        </>
      );
    case 'dice':
      return (
        <>
          <rect x="3.5" y="3.5" width="17" height="17" rx="3" fill={fill} />
          <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
          <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" />
        </>
      );
    case 'brush':
      return (
        <>
          <path d="M16.5 2.5 11 13.5" />
          <path fill={fill} d="M6 13.5h9.5l-.7 3a4.1 4.1 0 0 1-8.1 0z" />
          <path d="M8 20.5l-.5 1.5M10.75 21v1.5M13.5 20.5l.5 1.5" />
        </>
      );
    case 'magazine':
      return (
        <>
          <rect x="5" y="3" width="14" height="18" rx="1.5" fill={fill} />
          <path d="M8 7.5h8M8 11h8M8 14.5h5" />
        </>
      );
    case 'bidet':
      return (
        <>
          <path fill={fill} d="M3.5 13h17a8.5 7 0 0 1-17 0z" />
          <path d="M12 13V8M9.5 7c1-2 4-2 5 0M8 4.5l-.5-1M16 4.5l.5-1M12 3.5V2.5" />
        </>
      );
    case 'shower':
      return (
        <>
          <path d="M5 21V7a3.5 3.5 0 0 1 3.5-3.5H14V6" />
          <path fill={fill} d="M9.5 10h9l-2-4h-5z" />
          <path d="M11 13v1.5M14 13v1.5M17 13v1.5M12.5 17v1.5M15.5 17v1.5" />
        </>
      );
    case 'window':
      return (
        <>
          <rect x="4" y="3.5" width="16" height="17" rx="1" fill={fill} />
          <path d="M12 3.5v17M4 12h16" />
        </>
      );
    case 'towel':
      return (
        <>
          <path d="M3.5 4.5h17" />
          <path fill={fill} d="M6 4.5h12v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" />
          <path d="M6 14h12M6 16.5h12" />
        </>
      );
  }
}

interface IconProps {
  name: IconName;
  size?: number;
  fill?: string;
  className?: string;
}

export function Icon({ name, size = 20, fill = 'none', className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {shapes(name, fill)}
    </svg>
  );
}

export function TraitIcon({ trait, size = 18 }: { trait: TraitId; size?: number }) {
  return <Icon name={TRAIT_ICON[trait]} fill={TRAIT_COLOR[trait]} size={size} className="trait-icon" />;
}

export function ItemIcon({ item, size = 20 }: { item: ItemId; size?: number }) {
  return <Icon name={item} fill="#fff" size={size} />;
}
