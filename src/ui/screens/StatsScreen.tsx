import { useState } from 'react';
import { BATHROOM_INFO, BOSS_INFO, LEVELS, LEVEL_BOSS, STRUCTURES, bathroomOf } from '../../engine/data';
import { loadBest, loadHistory, type RunRecord } from '../../engine/save';
import { EnemyArt, MerdomonArt } from '../art';
import { StructureIcon } from '../bathroom';
import { AbilityBadge } from '../components';
import { Icon, ItemIcon } from '../icons';

const PAGE = 6;

const shortDate = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Finished runs, newest first: one small row each, tap to expand the details. */
export function StatsScreen({ onClose }: { onClose: () => void }) {
  const [history] = useState(loadHistory);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const pages = Math.max(1, Math.ceil(history.length / PAGE));
  const rows = history.slice(page * PAGE, page * PAGE + PAGE);
  const wins = history.filter((r) => r.victory).length;

  return (
    <div className="screen stats">
      <div className="tut-head">
        <h2>Stats</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close stats">
          <Icon name="close" size={22} />
        </button>
      </div>

      <div className="stats-summary">
        <span>
          Runs <b>{history.length}</b>
        </span>
        <span>
          Wins <b>{wins}</b>
        </span>
        {LEVELS.map((l) => (
          <span key={l} className="stats-best" title={`Level ${l} best`}>
            {BOSS_INFO[LEVEL_BOSS[l]].icon} <b>{loadBest(l) || '–'}</b>
          </span>
        ))}
      </div>

      <div className="stats-list">
        {history.length === 0 && <p className="muted center">No finished runs yet – go defend that toilet!</p>}
        {rows.map((r) => (
          <RunRow key={r.id} r={r} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} />
        ))}
      </div>

      {pages > 1 && (
        <div className="tut-nav">
          <button className="icon-btn sk" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Newer runs">
            <Icon name="play" size={18} fill="#fff" className="flip" />
          </button>
          <span>
            {page + 1}/{pages}
          </span>
          <button className="icon-btn sk" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label="Older runs">
            <Icon name="play" size={18} fill="#1b1b1b" />
          </button>
        </div>
      )}
    </div>
  );
}

function RunRow({ r, open, onToggle }: { r: RunRecord; open: boolean; onToggle: () => void }) {
  const boss = BOSS_INFO[r.boss];
  return (
    <div className={`run-row sk ${open ? 'open' : ''} ${r.victory ? 'win' : 'lose'}`}>
      <button className="run-head" onClick={onToggle}>
        <EnemyArt size={30} kind={boss.kind} rarity="epic" boss bossId={r.boss} />
        <span className="run-result">{r.victory ? '✅' : '❌'}</span>
        <span className="run-main">
          <b>L{r.level}</b> · {r.victory ? 'Victory' : `Wave ${r.round}`}
        </span>
        <b className="run-score">{r.score}</b>
        <small className="muted">{shortDate(r.date)}</small>
      </button>
      {open && (
        <div className="run-detail">
          {bathroomOf(r.bathroom) && <b className="run-bathroom">{BATHROOM_INFO[bathroomOf(r.bathroom)!].name}</b>}
          <div className="run-lines">
            {r.lines
              .filter((l) => l.points > 0)
              .map((l) => (
                <span key={l.label}>
                  {l.label} <b>{l.points}</b>
                </span>
              ))}
          </div>
          <div className="run-team">
            {r.team.map((m, i) => (
              <span key={i} className="run-mini">
                <MerdomonArt size={28} kind={m.kind} rarity={m.rarity} />
                {m.ability && <AbilityBadge ability={m.ability} size={14} />}
              </span>
            ))}
          </div>
          {r.items.length > 0 && (
            <div className="run-items">
              {r.items.map((it) => (
                <ItemIcon key={it} item={it} size={20} />
              ))}
            </div>
          )}
          <div className="run-structures">
            {STRUCTURES.map((id) => (
              <span key={id}>
                <StructureIcon id={id} tier={r.structures[id] ?? 1} size={22} />
                <small>T{r.structures[id] ?? 1}</small>
              </span>
            ))}
          </div>
          <div className="run-extra muted">
            <span>
              <Icon name="fist" size={13} /> {r.damageDealt}
            </span>
            <span>
              <MerdomonArt size={14} /> {r.merdomonCreated}
            </span>
            <span>
              <Icon name="tp" size={13} fill="#fff" /> {r.tpEarned}
            </span>
            <span>
              <Icon name="poop" size={13} fill="#fff" /> {r.poopEarned}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
