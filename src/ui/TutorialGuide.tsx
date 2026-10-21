import { useEffect, useRef, useState, type ReactNode } from 'react';
import { STRUCTURES } from '../engine/data';
import type { RunState } from '../engine/types';

// The guided Tutorial Game: a fixed path of steps. Each step highlights one element and blocks the rest of the
// screen; "info" steps wait for Next, "action" steps wait for the player to use the highlighted element.

interface Ctx {
  run: RunState;
  has: (selector: string) => boolean;
  acked: Set<string>;
  starterId: number;
}

interface Step {
  id: string;
  /** info: read and tap Next. action: do it on the highlighted element. wait: everything blocked (the fight). */
  kind: 'info' | 'action' | 'wait';
  when: (c: Ctx) => boolean;
  target?: string;
  text: ReactNode;
}

const prep = (c: Ctx, round: number) => c.run.phase === 'preparation' && c.run.round === round && !c.run.pending;
const noModal = (c: Ctx) => !c.has('.overlay');
const built = (c: Ctx) => STRUCTURES.some((id) => c.run.structures[id] > c.run.startStructures[id]);
const reordered = (c: Ctx) => c.run.team.length >= 2 && c.run.team[0].id !== c.starterId;
const readyToFight = (c: Ctx) =>
  c.run.round === 1 ? reordered(c) : built(c) && c.run.items.length > 0 && c.acked.has('bonusPanel');
const PREP_BTN = '.main-buttons > :first-child';

/** In order: the first step that applies to the current screen is shown. */
const STEPS: Step[] = [
  // ---------- Start ----------
  {
    id: 'welcome',
    kind: 'info',
    when: (c) => c.run.phase === 'starter' && !c.run.pending,
    text: (
      <>
        <b>Welcome to D.o.t.T.!</b> Distractions want to ruin your toilet break: your <b>Merdomon</b> defend it.
        Let's play 2 rounds together.
      </>
    ),
  },
  {
    id: 'starter',
    kind: 'action',
    when: (c) => c.run.phase === 'starter' && !c.run.pending,
    target: '.starter-cards > :first-child',
    text: (
      <>
        Pick your first Merdomon. ★ is its size, the type is on the border, and the coloured numbers are{' '}
        <b>HP, Attack, Defense and Speed</b>.
      </>
    ),
  },
  {
    id: 'newMerdomon',
    kind: 'action',
    when: (c) => !!c.run.pending,
    target: '.bonus-modal',
    text: (
      <>
        Choose an <b>ability</b> (tap one to read it), give <b>+1</b> to a stat, then <b>Confirm</b>.
      </>
    ),
  },
  {
    id: 'startBonus',
    kind: 'action',
    when: (c) => c.run.phase === 'startBonus' && !c.run.pending,
    target: '.start-options > :last-child',
    text: (
      <>
        Pick a starting bonus. Take <b>Supplies</b>: Toilet Paper, Poop and one extra Action for round 1.
      </>
    ),
  },

  // ---------- Round 1 ----------
  {
    id: 'concentration',
    kind: 'info',
    when: (c) => prep(c, 1) && noModal(c),
    target: '.topbar .conc',
    text: (
      <>
        <b>Concentration</b> is your life. Distractions that survive a wave take it away: at 0 your break is over.
      </>
    ),
  },
  {
    id: 'resources',
    kind: 'info',
    when: (c) => prep(c, 1) && noModal(c),
    target: '.topbar',
    text: (
      <>
        Left: <b>Toilet Paper</b> (TP), your money. Right: <b>Poop</b>, used to create Merdomon. The small number is the
        limit.
      </>
    ),
  },
  {
    id: 'actions',
    kind: 'info',
    when: (c) => prep(c, 1) && noModal(c),
    target: '.ap-badge',
    text: (
      <>
        <b>Action Points</b>: the main actions cost 1. You get 1 every round and keep the unspent ones.
      </>
    ),
  },
  {
    id: 'openPrepEvacuate',
    kind: 'action',
    when: (c) => prep(c, 1) && c.run.team.length < 2 && noModal(c),
    target: PREP_BTN,
    text: <>Open <b>Preparation</b> to spend your actions.</>,
  },
  {
    id: 'evacuateTile',
    kind: 'action',
    when: (c) => prep(c, 1) && c.run.team.length < 2 && c.has('.action-panel'),
    target: '[data-tut=tile-evacuate]',
    text: (
      <>
        <b>Evacuate</b>: spend Poop to call a new Merdomon.
      </>
    ),
  },
  {
    id: 'evacuateSmall',
    kind: 'action',
    when: (c) => c.has('.evacuate-panel'),
    target: '.evacuate-panel .evac-options > :first-child',
    text: <>A Small one costs 5 Poop. Bigger ones are stronger and cost more.</>,
  },
  {
    id: 'choose',
    kind: 'action',
    when: (c) => c.run.choices.length > 0,
    target: '.choices-modal',
    text: <>Pick the one you like.</>,
  },
  {
    id: 'traits',
    kind: 'info',
    when: (c) => prep(c, 1) && c.run.team.length >= 2 && noModal(c),
    target: '.traitsrow',
    text: (
      <>
        <b>Traits</b>: the same trait on 2 or more Merdomon (or items) gives the whole team a bonus. Later, tap a trait
        to read it.
      </>
    ),
  },
  {
    id: 'drag',
    kind: 'action',
    when: (c) => prep(c, 1) && c.run.team.length >= 2 && !reordered(c) && noModal(c),
    target: '.slots',
    text: (
      <>
        Slot 1 fights first. <b>Drag</b> your first Merdomon onto the other one to swap them.
      </>
    ),
  },

  // ---------- Round 2 ----------
  {
    id: 'round2',
    kind: 'info',
    when: (c) => prep(c, 2) && noModal(c),
    target: '.bathroom',
    text: (
      <>
        Round 2! This is your <b>bathroom</b>: each block shows its limit and, in green, what it produces after every
        wave. You earned Toilet Paper: let's spend it.
      </>
    ),
  },
  {
    id: 'openPrepShop',
    kind: 'action',
    when: (c) => prep(c, 2) && c.run.items.length === 0 && noModal(c),
    target: PREP_BTN,
    text: <>Open <b>Preparation</b>.</>,
  },
  {
    id: 'shopTile',
    kind: 'action',
    when: (c) => prep(c, 2) && c.run.items.length === 0 && c.has('.action-panel'),
    target: '[data-tut=tile-shop]',
    text: (
      <>
        <b>Shop</b>: buy an item for 10 TP and 1 Action.
      </>
    ),
  },
  {
    id: 'buy',
    kind: 'action',
    when: (c) => c.run.items.length === 0 && c.has('.shop-panel'),
    target: '.shop-panel .shop-items',
    text: <>Items give bonuses and count for traits. Pick one.</>,
  },
  {
    id: 'openPrepBuild',
    kind: 'action',
    when: (c) => prep(c, 2) && c.run.items.length > 0 && !built(c) && noModal(c),
    target: PREP_BTN,
    text: <>Now let's improve the bathroom. Open <b>Preparation</b> again.</>,
  },
  {
    id: 'buildTile',
    kind: 'action',
    when: (c) => prep(c, 2) && !built(c) && c.has('.action-panel'),
    target: '[data-tut=tile-build]',
    text: (
      <>
        <b>Build</b>: upgrade a structure for Toilet Paper and 1 Action.
      </>
    ),
  },
  {
    id: 'buildPick',
    kind: 'action',
    when: (c) => !built(c) && c.has('.build-panel'),
    target: '.build-panel .build-list',
    text: <>Pick a structure to upgrade.</>,
  },
  {
    id: 'buildConfirm',
    kind: 'action',
    when: (c) => !built(c) && c.has('.structure-panel'),
    target: '.structure-panel',
    text: (
      <>
        Here you see what the next tier gives. Tap <b>Build</b>!
      </>
    ),
  },
  {
    id: 'bonusButton',
    kind: 'action',
    when: (c) => prep(c, 2) && built(c) && !c.acked.has('bonusPanel') && noModal(c),
    target: '.bonus-btn',
    text: (
      <>
        Tap <b>Bonus</b>.
      </>
    ),
  },
  {
    id: 'bonusPanel',
    kind: 'info',
    when: (c) => c.has('.bonus-panel'),
    target: '.bonus-panel',
    text: <>Everything you get after this wave, and where it comes from. Check it before every fight!</>,
  },

  // ---------- Both rounds: the fight ----------
  {
    id: 'nextWave',
    kind: 'action',
    when: (c) => c.run.phase === 'preparation' && !c.run.pending && readyToFight(c) && noModal(c),
    target: '.fight-btn',
    text: (
      <>
        Ready? Tap <b>Next Wave</b> to see who is coming.
      </>
    ),
  },
  {
    id: 'fight',
    kind: 'action',
    when: (c) => c.has('.scout-panel'),
    target: '.scout-panel .big-btn.shadow',
    text: (
      <>
        These are the incoming Distractions, in fighting order. <b>Fight!</b>
      </>
    ),
  },
  {
    id: 'watch',
    kind: 'wait',
    when: (c) => c.run.phase === 'combat' && !c.has('.modal.result'),
    text: <>The fight plays by itself: one Merdomon against one Distraction at a time.</>,
  },
  {
    id: 'result',
    kind: 'action',
    when: (c) => c.has('.modal.result'),
    target: '.modal.result',
    text: (
      <>
        Wave cleared! You get <b>TP</b> for the damage dealt, <b>Poop</b> for each survivor, and what your structures
        produce. Tap ▶ to go on.
      </>
    ),
  },

  // Any other panel left open: close it to go on.
  {
    id: 'close',
    kind: 'action',
    when: (c) => c.has('.modal-close'),
    target: '.modal-close',
    text: <>Close this panel to go on.</>,
  },
];

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 4;
const BUBBLE_GAP = 10;

/** Overlay guiding the Tutorial Game, on top of the normal screens. */
export function TutorialGuide({ run, onSkip }: { run: RunState; onSkip: () => void }) {
  const [acked, setAcked] = useState<Set<string>>(() => new Set());
  const [, setTick] = useState(0);
  // The first Merdomon picked (always the first starter): the drag step checks it moved.
  const starterId = useRef(run.starters[0]?.id ?? -1);

  // The highlighted element can move or appear (panels, animations): follow it.
  useEffect(() => {
    const timer = window.setInterval(() => setTick((t) => t + 1), 120);
    return () => window.clearInterval(timer);
  }, []);

  const ctx: Ctx = {
    run,
    has: (sel) => document.querySelector(sel) !== null,
    acked,
    starterId: starterId.current,
  };
  const step = STEPS.find((s) => s.when(ctx) && !(s.kind === 'info' && acked.has(s.id)));
  if (!step) return null;

  const el = step.target ? document.querySelector(step.target) : null;
  const r = el?.getBoundingClientRect();
  const hole: Box | null = r
    ? { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 }
    : null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const block = (style: React.CSSProperties) => <div className="tut-block" style={style} onClick={(e) => e.stopPropagation()} />;

  // Bubble on the side of the hole with more room (centered when nothing is highlighted).
  const bubbleStyle: React.CSSProperties = {};
  if (!hole) {
    bubbleStyle.top = '50%';
    bubbleStyle.transform = 'translateY(-50%)';
  } else if (hole.top > vh - (hole.top + hole.height)) {
    bubbleStyle.bottom = Math.max(6, vh - hole.top + BUBBLE_GAP);
  } else {
    bubbleStyle.top = Math.min(vh - 120, hole.top + hole.height + BUBBLE_GAP);
  }

  return (
    <div className="tut-guide">
      {hole ? (
        <>
          {block({ top: 0, left: 0, width: vw, height: Math.max(0, hole.top) })}
          {block({ top: hole.top + hole.height, left: 0, width: vw, height: Math.max(0, vh - hole.top - hole.height) })}
          {block({ top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height })}
          {block({ top: hole.top, left: hole.left + hole.width, width: Math.max(0, vw - hole.left - hole.width), height: hole.height })}
          <div className={`tut-hole ${step.kind === 'action' ? 'act' : ''}`} style={hole} />
        </>
      ) : (
        block({ inset: 0, background: step.kind === 'wait' ? 'transparent' : undefined })
      )}
      <div className="tut-bubble sk" style={bubbleStyle}>
        <p>{step.text}</p>
        <div className="tut-bubble-foot">
          <button className="tut-skip" onClick={onSkip}>
            Skip tutorial
          </button>
          {step.kind === 'info' && (
            <button className="big-btn shadow tut-next" onClick={() => setAcked(new Set(acked).add(step.id))}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
