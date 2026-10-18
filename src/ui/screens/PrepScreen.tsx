import { useState } from 'react';
import { COSTS, EVACUATE_COST, ITEMS, ITEM_INFO, MAX_TEAM, STAT_KEYS, CONCENTRATE_GAIN } from '../../engine/data';
import * as G from '../../engine/game';
import { countTraits } from '../../engine/traits';
import type { ItemId, Rarity, RunState, TraitId } from '../../engine/types';
import { PlayerArt } from '../art';
import {
  CostBadge,
  EmptySlot,
  InfoRow,
  MerdomonCard,
  MerdomonDetail,
  Modal,
  Stars,
  TopBar,
  TraitDetail,
  TraitsRow,
} from '../components';
import { Icon, ItemIcon, STAT_ICON, TraitIcon, type IconName } from '../icons';
import type { Update } from '../update';
import { BonusPointModal } from './BonusPointModal';

type Panel =
  | { kind: 'actions' }
  | { kind: 'evacuate' }
  | { kind: 'shop' }
  | { kind: 'detail'; id: number }
  | { kind: 'upgrade'; id: number }
  | { kind: 'flush'; id: number }
  | { kind: 'item'; item: ItemId }
  | { kind: 'trait'; trait: TraitId };

type Mode = 'organize' | 'flush' | 'upgrade' | null;

const MODE_ICON: Record<Exclude<Mode, null>, IconName> = { organize: 'swap', flush: 'flush', upgrade: 'upgrade' };

export function PrepScreen({ run, update }: { run: RunState; update: Update }) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [swapFrom, setSwapFrom] = useState<number | null>(null);
  const close = () => setPanel(null);

  const exitMode = () => {
    setMode(null);
    setSwapFrom(null);
  };

  const onSlot = (index: number) => {
    const m = run.team[index];
    if (!m) return;
    if (mode === 'organize') {
      if (swapFrom === null) setSwapFrom(index);
      else {
        update((s) => G.swap(s, swapFrom, index));
        setSwapFrom(null);
      }
    } else if (mode === 'flush') {
      setPanel({ kind: 'flush', id: m.id });
    } else if (mode === 'upgrade') {
      setPanel({ kind: 'upgrade', id: m.id });
    } else {
      setPanel({ kind: 'detail', id: m.id });
    }
  };

  const findM = (id: number) => run.team.find((m) => m.id === id);

  return (
    <div className="screen prep">
      <TopBar run={run} />
      <InfoRow run={run} onItem={(item) => setPanel({ kind: 'item', item })} />
      <TraitsRow run={run} onTrait={(trait) => setPanel({ kind: 'trait', trait })} />

      {mode ? (
        <div className="mode-bar sk">
          <Icon name={MODE_ICON[mode]} size={22} />
          <span>{mode === 'organize' ? (swapFrom === null ? 'Tap a Merdomon' : 'Tap where to move it') : 'Tap a Merdomon'}</span>
          <button className="icon-btn" onClick={exitMode} aria-label="Done">
            <Icon name={mode === 'organize' ? 'check' : 'close'} size={20} />
          </button>
        </div>
      ) : (
        <div className="main-buttons">
          <button className="big-btn shadow" onClick={() => setPanel({ kind: 'actions' })}>
            <Icon name="bonus" size={22} fill="#fff" /> Action
          </button>
          <button className="big-btn shadow fight-btn" onClick={() => update(G.fight)} disabled={!G.canFight(run)}>
            <span className="fight-label">
              <Icon name="fight" size={22} /> Next Wave
            </span>
            <span className="wave-preview">
              {run.wave.map((e) =>
                e.boss ? (
                  <Icon key={e.id} name="crown" size={16} fill="#1b1b1b" />
                ) : (
                  <Icon key={e.id} name="phone" size={16} fill={e.rarity === 'rare' ? '#1b1b1b' : '#fff'} />
                ),
              )}
            </span>
          </button>
        </div>
      )}

      <div className="slots">
        {Array.from({ length: MAX_TEAM }, (_, i) => {
          const m = run.team[i];
          return m ? (
            <MerdomonCard key={m.id} m={m} onClick={() => onSlot(i)} selected={mode === 'organize' && swapFrom === i} />
          ) : (
            <EmptySlot key={`empty-${i}`} index={i} />
          );
        })}
      </div>

      <div className="player-zone">
        <PlayerArt />
      </div>

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
      {panel?.kind === 'evacuate' && <EvacuatePanel run={run} update={update} onClose={close} />}
      {panel?.kind === 'shop' && <ShopPanel run={run} update={update} onClose={close} />}
      {panel?.kind === 'detail' && findM(panel.id) && (
        <Modal onClose={close}>
          <MerdomonDetail m={findM(panel.id)!} />
        </Modal>
      )}
      {panel?.kind === 'upgrade' && findM(panel.id) && (
        <Modal onClose={close}>
          <MerdomonDetail m={findM(panel.id)!}>
            <div className="upgrade-row">
              {STAT_KEYS.map((k) => (
                <button
                  key={k}
                  className="stat-btn sk"
                  disabled={!G.canUpgrade(run, panel.id, k)}
                  onClick={() => update((s) => G.upgrade(s, panel.id, k))}
                >
                  <Icon name={STAT_ICON[k]} size={20} />
                  <b>+1</b>
                </button>
              ))}
            </div>
            <div className="center">
              <CostBadge tp={G.tpCost(run, 'upgrade')} />
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
              <TraitIcon trait={ITEM_INFO[panel.item].trait} size={22} />
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

      {run.pending && <BonusPointModal run={run} m={run.pending} update={update} />}
    </div>
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
      enabled: run.ap >= 1 && run.items.length < ITEMS.length,
      cost: { ap: 1, tp: COSTS.shop },
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
  ];
  const free: Tile[] = [
    {
      key: 'organize',
      icon: 'swap',
      label: 'Organize',
      enabled: G.canOrganize(run),
      cost: {},
      onClick: () => onMode('organize'),
    },
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
      key: 'upgrade',
      icon: 'upgrade',
      label: 'Upgrade',
      enabled: G.canUpgrade(run),
      cost: { tp: G.tpCost(run, 'upgrade') },
      onClick: () => onMode('upgrade'),
    },
  ];

  const renderTile = (t: Tile) => (
    <button key={t.key} className="tile sk" disabled={!t.enabled} onClick={t.onClick}>
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
    <Modal onClose={onClose}>
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
            <CostBadge ms={String(EVACUATE_COST[r])} />
          </button>
        ))}
      </div>
      {run.team.length >= MAX_TEAM && <p className="muted center">Team full – Flush first</p>}
    </Modal>
  );
}

function ShopPanel({ run, update, onClose }: { run: RunState; update: Update; onClose: () => void }) {
  return (
    <Modal onClose={onClose} className="shop-panel">
      <div className="panel-head">
        <Icon name="shop" size={28} fill="#fff" />
        <CostBadge ap={1} tp={COSTS.shop} />
      </div>
      <div className="shop-items">
        {ITEMS.map((it) => {
          const owned = run.items.includes(it);
          return (
            <button
              key={it}
              className={`shop-item sk ${owned ? 'owned' : ''}`}
              disabled={!G.canBuy(run, it)}
              onClick={() => update((s) => G.buy(s, it))}
            >
              <span className="shop-item-head">
                <ItemIcon item={it} size={28} />
                <TraitIcon trait={ITEM_INFO[it].trait} size={16} />
                {owned && <Icon name="check" size={18} />}
              </span>
              <b>{ITEM_INFO[it].name}</b>
              <small>{ITEM_INFO[it].desc}</small>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
