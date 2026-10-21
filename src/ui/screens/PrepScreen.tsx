import { useEffect, useRef, useState } from 'react';
import {
  ABILITY,
  BATHROOM_INFO,
  BOSS_INFO,
  BUILD_COST,
  COSTS,
  FARTING,
  GIFT_WAVE,
  EVACUATE_COST,
  ITEM_INFO,
  KIND_NAME,
  MAX_TIER,
  MODIFIER_AP_REWARD,
  MODIFIER_DISABLE_COST,
  MODIFIER_INFO,
  REROLL_COST,
  SIZE_NAME,
  STAT_KEYS,
  STRUCTURES,
  STRUCTURE_INFO,
  CONCENTRATE_GAIN,
  TRAIT_INFO,
  TRADE,
} from '../../engine/data';
import * as G from '../../engine/game';
import { countTraits } from '../../engine/traits';
import type { ItemId, ModifierId, Rarity, Reward, RunState, StructureId, TraitId } from '../../engine/types';
import { EnemyArt } from '../art';
import { Bathroom, StructureIcon } from '../bathroom';
import {
  BossCard,
  CostBadge,
  EmptySlot,
  InfoRow,
  MerdomonCard,
  MerdomonDetail,
  Modal,
  Stars,
  StatValue,
  TopBar,
  TraitDetail,
  TraitsRow,
} from '../components';
import { Icon, ItemIcon, RESOURCE_ICON, STAT_ICON, TraitIcon, type IconName } from '../icons';
import type { Update } from '../update';
import { SourceIcon } from './CombatScreen';
import { NewMerdomonModal } from './NewMerdomonModal';

type Panel =
  | { kind: 'actions' }
  | { kind: 'bonus' }
  | { kind: 'evacuate' }
  | { kind: 'shop' }
  | { kind: 'trade' }
  | { kind: 'scout'; fight?: boolean }
  | { kind: 'items' }
  | { kind: 'boss' }
  | { kind: 'build' }
  | { kind: 'structure'; id: StructureId }
  | { kind: 'detail'; id: number }
  | { kind: 'tradeStat'; id: number }
  | { kind: 'flush'; id: number }
  | { kind: 'item'; item: ItemId }
  | { kind: 'trait'; trait: TraitId };

type Mode = 'flush' | 'tradeStat' | 'fart' | null;

const MODE_ICON: Record<Exclude<Mode, null>, IconName> = { flush: 'flush', tradeStat: 'upgrade', fart: 'heart' };

/** A Merdomon being dragged to a new slot (pointer position and the card's size, for the floating copy). */
interface Drag {
  from: number;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  moving: boolean;
  over: number | null;
}

/** Movement (px) after which a press becomes a drag instead of a tap. */
const DRAG_THRESHOLD = 8;

const slotAt = (x: number, y: number) => {
  const el = document.elementFromPoint(x, y)?.closest('[data-slot]');
  return el ? Number(el.getAttribute('data-slot')) : null;
};

export function PrepScreen({ run, update }: { run: RunState; update: Update }) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  // The click that ends a drag must not open the Merdomon detail.
  const justDragged = useRef(false);
  const close = () => setPanel(null);

  const exitMode = () => setMode(null);

  const onPointerDown = (index: number, e: React.PointerEvent) => {
    justDragged.current = false;
    if (mode || !run.team[index] || !G.canOrganize(run)) return;
    const card = (e.target as Element).closest('.card')!.getBoundingClientRect();
    setDrag({
      from: index,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      width: card.width,
      height: card.height,
      moving: false,
      over: null,
    });
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      const moving = drag.moving || Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > DRAG_THRESHOLD;
      setDrag({ ...drag, x: e.clientX, y: e.clientY, moving, over: moving ? slotAt(e.clientX, e.clientY) : null });
    };
    const end = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      if (drag.moving) {
        justDragged.current = true;
        const to = slotAt(e.clientX, e.clientY);
        if (to !== null && canDropOn(to)) update((s) => G.moveMerdomon(s, drag.from, to));
      }
      setDrag(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [drag, run, update]);

  /** Open slots, or a benched Merdomon to swap with (to choose who sits out). */
  const canDropOn = (to: number) => to < G.teamCap(run) || !!run.team[to];

  const onSlot = (index: number) => {
    const m = run.team[index];
    if (!m) return;
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    if (mode === 'flush') {
      setPanel({ kind: 'flush', id: m.id });
    } else if (mode === 'tradeStat') {
      setPanel({ kind: 'tradeStat', id: m.id });
    } else if (mode === 'fart') {
      // Farting stays on: tap again to keep healing.
      update((s) => G.fart(s, m.id));
    } else {
      setPanel({ kind: 'detail', id: m.id });
    }
  };

  const findM = (id: number) => run.team.find((m) => m.id === id);

  return (
    <div className="screen prep">
      <TopBar run={run} />
      <InfoRow run={run} onItems={() => setPanel({ kind: 'items' })} onBoss={() => setPanel({ kind: 'boss' })} />
      <TraitsRow run={run} onTrait={(trait) => setPanel({ kind: 'trait', trait })} />

      <div className={`slots ${drag?.moving ? 'dragging' : ''}`}>
        {Array.from({ length: 6 }, (_, i) => {
          const m = run.team[i];
          const dropTarget = drag?.moving && drag.over === i && i !== drag.from && canDropOn(i);
          const benched = !!m && i >= G.teamCap(run);
          if (m)
            return (
              <div
                key={m.id}
                className={`slot-drag ${dropTarget ? 'drop-target' : ''} ${drag?.moving && drag.from === i ? 'drag-origin' : ''} ${benched ? 'benched' : ''}`}
                data-slot={i}
                onPointerDown={(e) => onPointerDown(i, e)}
              >
                <MerdomonCard m={m} onClick={() => onSlot(i)} />
              </div>
            );
          if (i >= G.teamCap(run) && i < G.capacity(run, 'toilet'))
            return (
              <button key={`pin-${i}`} className="card empty locked pinned" onClick={() => setPanel({ kind: 'boss' })}>
                <span>📲</span>
                <small>Pinned</small>
              </button>
            );
          if (i >= G.teamCap(run))
            return (
              <button key={`lock-${i}`} className="card empty locked" onClick={() => setPanel({ kind: 'structure', id: 'toilet' })}>
                <span>🔒</span>
                <small>Toilet T{i - 2}</small>
              </button>
            );
          return (
            <div key={`empty-${i}`} className={`slot-drag ${dropTarget ? 'drop-target' : ''}`} data-slot={i}>
              <EmptySlot index={i} />
            </div>
          );
        })}
      </div>
      {drag?.moving && run.team[drag.from] && (
        <div
          className="drag-ghost"
          style={{ left: drag.x - drag.width / 2, top: drag.y - drag.height / 2, width: drag.width, height: drag.height }}
        >
          <MerdomonCard m={run.team[drag.from]} />
        </div>
      )}

      {mode ? (
        <div className="mode-bar sk">
          <Icon name={MODE_ICON[mode]} size={22} />
          <span>{mode === 'fart' ? `Tap to heal +${FARTING.hp} (${FARTING.tp} TP)` : 'Tap a Merdomon'}</span>
          <button className="icon-btn" onClick={exitMode} aria-label="Done">
            <Icon name={mode === 'fart' ? 'check' : 'close'} size={20} />
          </button>
        </div>
      ) : (
        <div className="main-buttons">
          <button className="big-btn shadow" onClick={() => setPanel({ kind: 'actions' })}>
            <Icon name="bonus" size={22} fill="#fff" /> Preparation
          </button>
          <button
            className="big-btn shadow fight-btn"
            onClick={() => setPanel({ kind: 'scout', fight: true })}
            disabled={!G.canFight(run)}
          >
            <span className="fight-label">
              <Icon name="fight" size={22} /> Next Wave
            </span>
            <WavePreview run={run} />
          </button>
          <button className="big-btn shadow bonus-btn" onClick={() => setPanel({ kind: 'bonus' })}>
            <Icon name="star" size={20} fill="#f2c94c" />
            <small>Bonus</small>
          </button>
        </div>
      )}

      <Bathroom run={run} onOpen={(id) => setPanel({ kind: 'structure', id })} />

      {panel?.kind === 'actions' && (
        <ActionPanel
          run={run}
          update={update}
          onClose={close}
          onOpen={setPanel}
          onMode={(m) => {
            close();
            setMode(m);
          }}
        />
      )}
      {panel?.kind === 'bonus' && <BonusPanel run={run} onClose={close} />}
      {panel?.kind === 'evacuate' &&<EvacuatePanel run={run} update={update} onClose={close} />}
      {panel?.kind === 'shop' && <ShopPanel run={run} update={update} onClose={close} />}
      {panel?.kind === 'scout' && <ScoutPanel run={run} update={update} onClose={close} fight={panel.fight} />}
      {panel?.kind === 'items' && (
        <Modal onClose={close}>
          <div className="panel-head">
            <Icon name="shop" size={26} fill="#fff" />
            <b>
              {run.items.length}/{G.itemCap(run)}
            </b>
          </div>
          {run.items.length === 0 ? (
            <p className="muted center">No items yet – visit the Shop</p>
          ) : (
            <div className="item-list">
              {run.items.map((it) => (
                <ItemRow key={it} item={it} />
              ))}
            </div>
          )}
          <p className="muted center small">Upgrade the Sink to carry more</p>
        </Modal>
      )}
      {panel?.kind === 'boss' && (
        <Modal onClose={close}>
          <p className="run-bathroom center">
            {BATHROOM_INFO[run.bathroom].name} · Level {run.level}
          </p>
          <BossCard boss={run.boss} />
        </Modal>
      )}
      {panel?.kind === 'structure' && <StructurePanel run={run} id={panel.id} update={update} onClose={close} />}
      {panel?.kind === 'build' && (
        <Modal onClose={close} className="build-panel">
          <div className="panel-head">
            <Icon name="upgrade" size={26} />
            <b>Build</b>
          </div>
          <div className="build-list">
            {STRUCTURES.map((id) => (
              <button
                key={id}
                className={`build-row sk ${run.structures[id] === 0 ? 't0' : ''}`}
                onClick={() => setPanel({ kind: 'structure', id })}
              >
                <StructureIcon id={id} tier={run.structures[id]} size={34} />
                <span>
                  <b>{STRUCTURE_INFO[id].name}</b>
                  <small>
                    {STRUCTURE_INFO[id].capacity} {G.capacity(run, id)}
                  </small>
                </span>
                {run.structures[id] >= MAX_TIER ? (
                  <span className="tier-badge t3">MAX</span>
                ) : (
                  <span className="build-row-cost">
                    <span className={`tier-badge t${run.structures[id]}`}>T{run.structures[id]}</span>
                    <CostBadge ap={BUILD_COST.ap} tp={G.buildTp(run, id)} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </Modal>
      )}
      {panel?.kind === 'trade' && (
        <TradePanel
          run={run}
          update={update}
          onClose={close}
          onStat={() => {
            close();
            setMode('tradeStat');
          }}
        />
      )}
      {panel?.kind === 'detail' && findM(panel.id) && (
        <Modal onClose={close}>
          <MerdomonDetail m={findM(panel.id)!} />
        </Modal>
      )}
      {panel?.kind === 'tradeStat' && findM(panel.id) && (
        <Modal onClose={close}>
          <MerdomonDetail m={findM(panel.id)!}>
            <div className="upgrade-row">
              {STAT_KEYS.map((k) => (
                <button
                  key={k}
                  className="stat-btn sk"
                  disabled={!G.canTradeStat(run, panel.id, k)}
                  onClick={() => {
                    update((s) => G.tradeStat(s, panel.id, k));
                    close();
                    exitMode();
                  }}
                >
                  <Icon name={STAT_ICON[k]} size={20} />
                  <b>+{TRADE.stat}</b>
                </button>
              ))}
            </div>
            <div className="center">
              <CostBadge ap={1} />
            </div>
          </MerdomonDetail>
        </Modal>
      )}
      {panel?.kind === 'flush' && findM(panel.id) && (
        <Modal onClose={close}>
          <MerdomonDetail m={findM(panel.id)!}>
            <button
              className="big-btn shadow danger"
              disabled={!G.canFlush(run)}
              onClick={() => {
                update((s) => G.flush(s, panel.id));
                close();
                exitMode();
              }}
            >
              <Icon name="flush" size={22} fill="#fff" /> Flush
              <CostBadge tp={G.tpCost(run, 'flush')} />
              <span className="gain">
                +1 <Icon name="focus" size={14} fill="#fff" />
              </span>
            </button>
          </MerdomonDetail>
        </Modal>
      )}
      {panel?.kind === 'item' && (
        <Modal onClose={close}>
          <div className="detail">
            <div className="detail-title">
              <ItemIcon item={panel.item} size={40} />
              <h2>{ITEM_INFO[panel.item].name}</h2>
              {ITEM_INFO[panel.item].traits.map((t) => (
                <TraitIcon key={t} trait={t} size={22} />
              ))}
            </div>
            <p>{ITEM_INFO[panel.item].desc}</p>
          </div>
        </Modal>
      )}
      {panel?.kind === 'trait' && (
        <Modal onClose={close}>
          <TraitDetail trait={panel.trait} count={countTraits(run.team, run.items)[panel.trait]} />
        </Modal>
      )}

      {run.choices.length > 0 && <ChoicesModal run={run} update={update} />}
      {run.giftOffer.length > 0 && <GiftModal run={run} update={update} />}
      {run.pending && <NewMerdomonModal key={run.pending.id} run={run} m={run.pending} update={update} />}
    </div>
  );
}

/** Name of a reward source, for the Bonus panel. */
function sourceName(source: Reward['source']): string {
  if (source in TRAIT_INFO) return TRAIT_INFO[source as TraitId].name;
  if (source in ITEM_INFO) return ITEM_INFO[source as ItemId].name;
  if (source in MODIFIER_INFO) return MODIFIER_INFO[source as ModifierId].name;
  if (source in STRUCTURE_INFO) return STRUCTURE_INFO[source as StructureId].name;
  return '';
}

function Gain({ amount, icon }: { amount: number | string; icon: IconName }) {
  return (
    <b className="bonus-gain">
      {typeof amount === 'number' && amount > 0 ? '+' : ''}
      {amount}
      <Icon name={icon} size={15} fill="#fff" />
    </b>
  );
}

/** Everything the coming wave gives, and where it comes from. */
function BonusPanel({ run, onClose }: { run: RunState; onClose: () => void }) {
  const { sure, ifWon } = G.previewRewards(run);
  const modifier = G.activeModifier(run);
  const abilities = modifier === 'silentMode' ? [] : run.team.map((m) => m.ability);
  return (
    <Modal onClose={onClose} className="bonus-panel">
      <div className="panel-head">
        <Icon name="star" size={24} fill="#f2c94c" />
        <b>After this wave</b>
      </div>

      <h4 className="bonus-section">Bathroom</h4>
      <div className="bonus-structures">
        {STRUCTURES.map((id) => {
          const amount = G.production(run, id);
          return (
            <span key={id} className={`bonus-structure sk ${amount > 0 ? '' : 'none'}`}>
              <StructureIcon id={id} tier={run.structures[id]} size={24} />
              <Gain amount={amount} icon={STRUCTURE_ICON[id]} />
            </span>
          );
        })}
      </div>

      {(sure.length > 0 || run.round === GIFT_WAVE) && <h4 className="bonus-section">Traits and items</h4>}
      {(sure.length > 0 || run.round === GIFT_WAVE) && (
        <div className="bonus-structures">
          {sure.map((r) => (
            <span key={r.source} className="bonus-structure sk" title={sourceName(r.source)}>
              <SourceIcon source={r.source} />
              <Gain amount={r.amount} icon={RESOURCE_ICON[r.resource]} />
            </span>
          ))}
          {run.round === GIFT_WAVE && (
            <span className="bonus-structure sk" title="Gift: pick a free item">
              <span className="mod-emoji">🎁</span>
              <b className="bonus-gain">+1 item</b>
            </span>
          )}
        </div>
      )}

      <h4 className="bonus-section">From the fight</h4>
      <div className="bonus-row">
        <Icon name="fist" size={22} fill="#fff" />
        <span>Damage dealt</span>
        <Gain amount="+1 each" icon="tp" />
      </div>
      {abilities.includes('collector') && (
        <div className="bonus-row">
          <SourceIcon source="collector" />
          <span>Collector: per enemy defeated</span>
          <Gain amount={ABILITY.collectorTp} icon="tp" />
        </div>
      )}
      {abilities.includes('fertilizer') && (
        <div className="bonus-row">
          <SourceIcon source="fertilizer" />
          <span>Fertilizer: if it survives</span>
          <Gain amount={ABILITY.fertilizerMerdascore} icon="poop" />
        </div>
      )}
      {modifier === 'jackpot' && (
        <div className="bonus-row">
          <SourceIcon source="jackpot" />
          <span>Jackpot: wave TP and Poop</span>
          <b className="bonus-gain">×2</b>
        </div>
      )}

      <h4 className="bonus-section">If you win</h4>
      <div className="bonus-row">
        <SourceIcon source="survivors" />
        <span>Each surviving Merdomon</span>
        <Gain amount={1} icon="poop" />
      </div>
      {ifWon.map((r) => (
        <div key={r.source} className="bonus-row">
          <SourceIcon source={r.source} />
          <span>{sourceName(r.source)}: next round</span>
          <Gain amount={r.amount} icon={RESOURCE_ICON[r.resource]} />
        </div>
      ))}

      <h4 className="bonus-section">If you lose</h4>
      <div className="bonus-row">
        <SourceIcon source="enemies" />
        <span>Each surviving Distraction</span>
        <Gain amount={-1} icon="focus" />
      </div>
    </Modal>
  );
}

/** Icon of what each structure produces after a wave (the Toilet Brush gives free Re-Rolls). */
const STRUCTURE_ICON: Record<StructureId, IconName> = {
  stall: 'heart',
  sink: 'ap',
  bidet: 'focus',
  scrubber: 'dice',
  toilet: 'poop',
  holder: 'tp',
};

function ItemRow({ item }: { item: ItemId }) {
  return (
    <div className="item-row">
      <ItemIcon item={item} size={28} />
      <span>
        <b>
          {ITEM_INFO[item].name}{' '}
          {ITEM_INFO[item].traits.map((t) => (
            <TraitIcon key={t} trait={t} size={14} />
          ))}
        </b>
        <small>{ITEM_INFO[item].desc}</small>
      </span>
    </div>
  );
}

/** A bathroom structure: what it holds and produces now and at the next tier, and Build. */
function StructurePanel({ run, id, update, onClose }: { run: RunState; id: StructureId; update: Update; onClose: () => void }) {
  const info = STRUCTURE_INFO[id];
  const tier = run.structures[id];
  const max = tier >= MAX_TIER;
  const offline = G.isOffline(run, id);
  const next = (list: readonly number[]) => (max || offline ? null : list[tier + 1]);
  return (
    <Modal onClose={onClose} className="structure-panel">
      <div className="structure-head">
        <span className={tier === 0 ? 't0-art' : ''}>
          <StructureIcon id={id} tier={tier} size={72} />
        </span>
        <div>
          <h2>{info.name}</h2>
          {tier === 0 && !offline && <small className="muted">Not built yet</small>}
          {offline && <small className="offline-note">🔧 Water Shut-Off: off this run</small>}
          <span className="tier-pips">
            {[1, 2, 3].map((t) => (
              <span key={t} className={t <= tier ? 'on' : ''} />
            ))}
          </span>
        </div>
      </div>
      <div className="structure-rows">
        <div>
          <span className="muted">Holds {info.capacity}</span>
          <b>
            {G.capacity(run, id)}
            {next(info.capacities) !== null && <span className="next"> → {next(info.capacities)}</span>}
          </b>
        </div>
        <div>
          <span className="muted">After each wave: {info.produce}</span>
          <b>
            +{G.production(run, id)}
            {next(info.production) !== null && <span className="next"> → +{next(info.production)}</span>}
          </b>
        </div>
      </div>
      {max ? (
        <p className="center">
          <b>Max tier</b>
        </p>
      ) : (
        <button className="big-btn shadow" disabled={!G.canBuild(run, id)} onClick={() => update((s) => G.build(s, id))}>
          <Icon name="upgrade" size={22} /> Build T{tier + 1}
          <CostBadge ap={BUILD_COST.ap} tp={G.buildTp(run, id)} />
        </button>
      )}
    </Modal>
  );
}

export function WavePreview({ run }: { run: RunState }) {
  const planned = run.modifiers[run.round];
  return (
    <span className="wave-preview">
      {planned && (
        <span className={`wave-mod ${run.modifierDisabled ? 'off' : ''}`}>{MODIFIER_INFO[planned].icon}</span>
      )}
      {run.wave.map((e) =>
        e.boss ? (
          <Icon key={e.id} name="crown" size={16} fill="#1b1b1b" />
        ) : (
          <Icon key={e.id} name="phone" size={16} fill={e.rarity === 'rare' ? '#1b1b1b' : '#fff'} />
        ),
      )}
    </span>
  );
}

interface Tile {
  key: string;
  icon: IconName;
  label: string;
  enabled: boolean;
  cost: Parameters<typeof CostBadge>[0];
  onClick: () => void;
}

function ActionPanel({
  run,
  update,
  onClose,
  onOpen,
  onMode,
}: {
  run: RunState;
  update: Update;
  onClose: () => void;
  onOpen: (p: Panel) => void;
  onMode: (m: Exclude<Mode, null>) => void;
}) {
  const paid: Tile[] = [
    {
      key: 'heal',
      icon: 'heal',
      label: 'Heal',
      enabled: G.canHeal(run),
      cost: { ap: 1 },
      onClick: () => {
        update(G.heal);
        onClose();
      },
    },
    {
      key: 'evacuate',
      icon: 'toilet',
      label: 'Evacuate',
      enabled: G.canEvacuate(run, 'common'),
      cost: { ap: 1, ms: `${EVACUATE_COST.common}+` },
      onClick: () => onOpen({ kind: 'evacuate' }),
    },
    {
      key: 'shop',
      icon: 'shop',
      label: 'Shop',
      enabled: run.ap >= 1,
      cost: { ap: 1, tp: G.tpCost(run, 'shop') },
      onClick: () => onOpen({ kind: 'shop' }),
    },
    {
      key: 'concentrate',
      icon: 'focus',
      label: 'Concentrate',
      enabled: G.canConcentrate(run),
      cost: { ap: 1, conc: -COSTS.concentrate, ms: `+${CONCENTRATE_GAIN}` },
      onClick: () => {
        update(G.concentrate);
        onClose();
      },
    },
    {
      key: 'trade',
      icon: 'trade',
      label: 'Trade',
      enabled: G.canTrade(run),
      cost: { ap: 1 },
      onClick: () => onOpen({ kind: 'trade' }),
    },
    {
      key: 'build',
      icon: 'upgrade',
      label: 'Build',
      enabled: STRUCTURES.some((id) => G.canBuild(run, id)),
      cost: { ap: BUILD_COST.ap, tp: run.items.includes('hammer') ? BUILD_COST.hammerTp : BUILD_COST.tp[0] },
      onClick: () => onOpen({ kind: 'build' }),
    },
  ];
  const free: Tile[] = [
    {
      key: 'flush',
      icon: 'flush',
      label: 'Flush',
      enabled: G.canFlush(run),
      cost: { tp: G.tpCost(run, 'flush') },
      onClick: () => onMode('flush'),
    },
    {
      key: 'bonus',
      icon: 'bonus',
      label: 'Bonus Action',
      enabled: G.canBonusAction(run),
      cost: { tp: G.tpCost(run, 'bonusAction') },
      onClick: () => update(G.bonusAction),
    },
    {
      key: 'fart',
      icon: 'heart',
      label: 'Farting',
      enabled: G.canFart(run),
      cost: { tp: FARTING.tp },
      onClick: () => onMode('fart'),
    },
  ];

  const renderTile = (t: Tile) => (
    <button key={t.key} className="tile sk" data-tut={`tile-${t.key}`} disabled={!t.enabled} onClick={t.onClick}>
      <Icon name={t.icon} size={30} fill="#fff" />
      <span className="tile-label">{t.label}</span>
      <CostBadge {...t.cost} />
    </button>
  );

  return (
    <Modal onClose={onClose} className="action-panel">
      <div className="panel-head">
        {Array.from({ length: Math.max(run.ap, 1) }, (_, i) => (
          <Icon key={i} name="ap" size={20} fill={i < run.ap ? '#1b1b1b' : '#fff'} />
        ))}
      </div>
      <div className="tiles">{paid.map(renderTile)}</div>
      <div className="divider" />
      <div className="tiles">{free.map(renderTile)}</div>
    </Modal>
  );
}

function EvacuatePanel({ run, update, onClose }: { run: RunState; update: Update; onClose: () => void }) {
  const rarities: Rarity[] = ['common', 'rare', 'epic'];
  return (
    <Modal onClose={onClose} className="evacuate-panel">
      <div className="panel-head">
        <Icon name="toilet" size={28} fill="#fff" />
        <CostBadge ap={1} />
      </div>
      <div className="evac-options">
        {rarities.map((r) => (
          <button
            key={r}
            className="tile sk"
            disabled={!G.canEvacuate(run, r)}
            onClick={() => {
              update((s) => G.evacuate(s, r));
              onClose();
            }}
          >
            <Stars rarity={r} size={18} />
            <span className="tile-label">{SIZE_NAME[r]}</span>
            <CostBadge ms={String(EVACUATE_COST[r])} />
          </button>
        ))}
      </div>
      {run.team.length >= G.teamCap(run) && <p className="muted center">Toilet full – Flush or upgrade the Toilet</p>}
    </Modal>
  );
}

/** Pick one of the evacuated Merdomon (or re-roll them). */
function ChoicesModal({ run, update }: { run: RunState; update: Update }) {
  return (
    <Modal className="choices-modal">
      <div className="panel-head">
        <Icon name="toilet" size={28} fill="#fff" />
      </div>
      <div className={`choice-cards n${run.choices.length}`}>
        {run.choices.map((m, i) => (
          <MerdomonCard key={m.id} m={m} big onClick={() => update((s) => G.chooseEvacuated(s, i))} />
        ))}
      </div>
      <RerollButton enabled={G.canRerollChoices(run)} onClick={() => update(G.rerollChoices)} free={run.freeRerolls} />
    </Modal>
  );
}

/** After wave 5: pick one free item (drop one first if the bag is full), or skip. */
function GiftModal({ run, update }: { run: RunState; update: Update }) {
  const [picked, setPicked] = useState<ItemId | null>(null);
  const full = G.bagFull(run);
  return (
    <Modal className="gift-modal">
      <div className="gift-title">
        <span className="gift-emoji">🎁</span>
        <h2>A gift!</h2>
      </div>
      {picked && full ? (
        <>
          <p className="center">
            <b>Bag full – drop one item</b>
          </p>
          <div className="item-list">
            {run.items.map((it) => (
              <button key={it} className="item-row sk" onClick={() => update((s) => G.takeGift(s, picked, it))}>
                <ItemIcon item={it} size={26} />
                <span>
                  <b>{ITEM_INFO[it].name}</b>
                  <small>{ITEM_INFO[it].desc}</small>
                </span>
              </button>
            ))}
          </div>
          <button className="big-btn" onClick={() => setPicked(null)}>
            <Icon name="close" size={20} /> Back
          </button>
        </>
      ) : (
        <>
          <div className="shop-items single">
            {run.giftOffer.map((it) => (
              <button
                key={it}
                className="shop-item sk"
                onClick={() => (full ? setPicked(it) : update((s) => G.takeGift(s, it)))}
              >
                <span className="shop-item-head">
                  <ItemIcon item={it} size={28} />
                  <b>{ITEM_INFO[it].name}</b>
                  {ITEM_INFO[it].traits.map((t) => (
                    <TraitIcon key={t} trait={t} size={16} />
                  ))}
                </span>
                <small>{ITEM_INFO[it].desc}</small>
              </button>
            ))}
          </div>
          <button className="big-btn" onClick={() => update(G.skipGift)}>
            Skip
          </button>
        </>
      )}
    </Modal>
  );
}

/** Free Re-Rolls (Toilet Brush) are used before paying Toilet Paper. */
function RerollButton({ enabled, onClick, free }: { enabled: boolean; onClick: () => void; free: number }) {
  return (
    <button className="big-btn reroll-btn" disabled={!enabled} onClick={onClick}>
      <Icon name="dice" size={22} fill="#fff" /> Re-Roll
      {free > 0 ? <span className="cost free">free ×{free}</span> : <CostBadge tp={REROLL_COST} />}
    </button>
  );
}

function TradePanel({
  run,
  update,
  onClose,
  onStat,
}: {
  run: RunState;
  update: Update;
  onClose: () => void;
  onStat: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="panel-head">
        <Icon name="trade" size={28} />
        <CostBadge ap={1} />
      </div>
      <div className="evac-options">
        <button
          className="tile sk"
          disabled={!G.canTrade(run)}
          onClick={() => {
            update((s) => G.trade(s, 'merdascore'));
            onClose();
          }}
        >
          <Icon name="poop" size={30} fill="#fff" />
          <b className="trade-gain">+{TRADE.merdascore}</b>
        </button>
        <button
          className="tile sk"
          disabled={!G.canTrade(run)}
          onClick={() => {
            update((s) => G.trade(s, 'tp'));
            onClose();
          }}
        >
          <Icon name="tp" size={30} fill="#fff" />
          <b className="trade-gain">+{TRADE.tp}</b>
        </button>
        <button className="tile sk" disabled={!G.canTradeStat(run)} onClick={onStat}>
          <span className="trade-stats">
            {STAT_KEYS.map((k) => (
              <Icon key={k} name={STAT_ICON[k]} size={15} />
            ))}
          </span>
          <b className="trade-gain">+{TRADE.stat}</b>
        </button>
      </div>
    </Modal>
  );
}

function ShopPanel({ run, update, onClose }: { run: RunState; update: Update; onClose: () => void }) {
  // With a full bag, buying asks which owned item to drop.
  const [buying, setBuying] = useState<ItemId | null>(null);
  const full = G.bagFull(run);
  return (
    <Modal onClose={onClose} className="shop-panel">
      <div className="panel-head">
        <Icon name="shop" size={28} fill="#fff" />
        <CostBadge ap={1} tp={G.tpCost(run, 'shop')} />
        <span className={`bag-count ${full ? 'full' : ''}`}>
          {run.items.length}/{G.itemCap(run)}
        </span>
      </div>
      {buying ? (
        <>
          <p className="center">
            <b>Bag full – drop one item</b>
          </p>
          <div className="item-list">
            {run.items.map((it) => (
              <button
                key={it}
                className="item-row sk"
                onClick={() => {
                  update((s) => G.buy(s, buying, it));
                  setBuying(null);
                }}
              >
                <ItemIcon item={it} size={26} />
                <span>
                  <b>{ITEM_INFO[it].name}</b>
                  <small>{ITEM_INFO[it].desc}</small>
                </span>
              </button>
            ))}
          </div>
          <button className="big-btn" onClick={() => setBuying(null)}>
            <Icon name="close" size={20} /> Cancel
          </button>
        </>
      ) : (
        <>
          {run.shopOffer.length === 0 ? (
            <p className="muted center">Sold out – come back next round</p>
          ) : (
            <div className="shop-items single">
              {run.shopOffer.map((it) => (
                <button
                  key={it}
                  className="shop-item sk"
                  disabled={!G.affordable(run, it)}
                  onClick={() => (full ? setBuying(it) : update((s) => G.buy(s, it)))}
                >
                  <span className="shop-item-head">
                    <ItemIcon item={it} size={28} />
                    <b>{ITEM_INFO[it].name}</b>
                    {ITEM_INFO[it].traits.map((t) => (
                      <TraitIcon key={t} trait={t} size={16} />
                    ))}
                  </span>
                  <small>{ITEM_INFO[it].desc}</small>
                </button>
              ))}
            </div>
          )}
          <RerollButton enabled={G.canRerollShop(run)} onClick={() => update(G.rerollShop)} free={run.freeRerolls} />
        </>
      )}
    </Modal>
  );
}

/** This wave's modifier: effect and reward. */
function ModifierBox({ run }: { run: RunState }) {
  const id = run.modifiers[run.round];
  if (!id) return null;
  const info = MODIFIER_INFO[id];
  return (
    <div className={`modifier-box ${run.modifierDisabled ? 'off' : ''}`}>
      <span className="modifier-icon">{info.icon}</span>
      <span className="modifier-text">
        <b>{info.name}</b>
        <small>{info.desc}</small>
        {!run.modifierDisabled && (
          <small className="modifier-reward">
            Win: +{MODIFIER_AP_REWARD} <Icon name="ap" size={11} fill="#1b1b1b" /> next round
          </small>
        )}
      </span>
      {run.modifierDisabled && <span className="muted">Corrupted</span>}
    </div>
  );
}

/** Preview of the incoming wave, in fighting order. From Next Wave it ends with Corrupt / Fight. */
function ScoutPanel({
  run,
  update,
  onClose,
  fight = false,
}: {
  run: RunState;
  update: Update;
  onClose: () => void;
  fight?: boolean;
}) {
  const modifierWave = !!run.modifiers[run.round];
  return (
    <Modal onClose={onClose} className="scout-panel">
      <div className="panel-head">
        <Icon name="eye" size={28} fill="#fff" />
        <WavePreview run={run} />
      </div>
      <ModifierBox run={run} />
      <div className={`scout-list ${run.wave.length > 6 ? 'tight' : ''}`}>
        {run.wave.map((e, i) => (
          <div key={e.id} className={`scout-row ${e.boss ? 'boss' : ''}`}>
            <span className="scout-index">{i + 1}</span>
            <EnemyArt size={40} kind={e.kind} rarity={e.rarity} boss={e.boss} bossId={run.boss} />
            <span className="scout-name">
              <Stars rarity={e.rarity} size={10} />
              <small>{e.boss ? BOSS_INFO[run.boss].name : KIND_NAME[e.kind]}</small>
            </span>
            <span className="scout-stats">
              {STAT_KEYS.map((k) => (
                <span key={k}>
                  <Icon name={STAT_ICON[k]} size={14} />
                  <StatValue value={e.stats[k]} />
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
      <div className="scout-actions">
        {modifierWave && (
          <button className="big-btn corrupt-btn" disabled={!G.canDisableModifier(run)} onClick={() => update(G.disableModifier)}>
            Corrupt <CostBadge tp={MODIFIER_DISABLE_COST} />
          </button>
        )}
        {fight && (
          <button className="big-btn shadow" onClick={() => update(G.fight)} disabled={!G.canFight(run)}>
            <Icon name="fight" size={22} /> Fight
          </button>
        )}
      </div>
    </Modal>
  );
}
