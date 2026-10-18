import { useState } from 'react';
import { COSTS, EVACUATE_COST, ITEM_INFO, MAX_TEAM, STAT_KEYS, CONCENTRATE_GAIN, TRADE } from '../../engine/data';
import * as G from '../../engine/game';
import { countTraits } from '../../engine/traits';
import type { ItemId, Rarity, RunState, TraitId } from '../../engine/types';
import { EnemyArt, PlayerArt } from '../art';
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
  | { kind: 'trade' }
  | { kind: 'scout' }
  | { kind: 'detail'; id: number }
  | { kind: 'tradeStat'; id: number }
  | { kind: 'flush'; id: number }
  | { kind: 'item'; item: ItemId }
  | { kind: 'trait'; trait: TraitId };

type Mode = 'organize' | 'flush' | 'tradeStat' | null;

const MODE_ICON: Record<Exclude<Mode, null>, IconName> = { organize: 'swap', flush: 'flush', tradeStat: 'upgrade' };

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
    } else if (mode === 'tradeStat') {
      setPanel({ kind: 'tradeStat', id: m.id });
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
            <Icon name="bonus" size={22} fill="#fff" /> Preparation
          </button>
          <button className="big-btn shadow fight-btn" onClick={() => update(G.fight)} disabled={!G.canFight(run)}>
            <span className="fight-label">
              <Icon name="fight" size={22} /> Next Wave
            </span>
            <WavePreview run={run} />
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
      {panel?.kind === 'scout' && <ScoutPanel run={run} onClose={close} />}
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

export function WavePreview({ run }: { run: RunState }) {
  return (
    <span className="wave-preview">
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
      enabled: run.ap >= 1 && run.shopOffer.length > 0,
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
      key: 'scout',
      icon: 'eye',
      label: 'Scout',
      enabled: run.wave.length > 0,
      cost: {},
      onClick: () => onOpen({ kind: 'scout' }),
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
  return (
    <Modal onClose={onClose} className="shop-panel">
      <div className="panel-head">
        <Icon name="shop" size={28} fill="#fff" />
        <CostBadge ap={1} tp={G.tpCost(run, 'shop')} />
      </div>
      {run.shopOffer.length === 0 ? (
        <p className="muted center">Sold out – come back next round</p>
      ) : (
        <div className="shop-items single">
          {run.shopOffer.map((it) => (
            <button
              key={it}
              className="shop-item sk"
              disabled={!G.canBuy(run, it)}
              onClick={() => update((s) => G.buy(s, it))}
            >
              <span className="shop-item-head">
                <ItemIcon item={it} size={28} />
                <b>{ITEM_INFO[it].name}</b>
                <TraitIcon trait={ITEM_INFO[it].trait} size={16} />
              </span>
              <small>{ITEM_INFO[it].desc}</small>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

/** Preview of the incoming wave, in fighting order. */
function ScoutPanel({ run, onClose }: { run: RunState; onClose: () => void }) {
  return (
    <Modal onClose={onClose} className="scout-panel">
      <div className="panel-head">
        <Icon name="eye" size={28} fill="#fff" />
        <WavePreview run={run} />
      </div>
      <div className="scout-list">
        {run.wave.map((e, i) => (
          <div key={e.id} className={`scout-row ${e.boss ? 'boss' : ''}`}>
            <span className="scout-index">{i + 1}</span>
            <EnemyArt size={e.boss ? 40 : 34} boss={e.boss} />
            <Stars rarity={e.rarity} size={11} />
            <span className="scout-stats">
              {STAT_KEYS.map((k) => (
                <span key={k}>
                  <Icon name={STAT_ICON[k]} size={14} />
                  <b>{e.stats[k]}</b>
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
