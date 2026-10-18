import { ROUNDS } from '../../engine/data';
import type { RunState } from '../../engine/types';
import { EnemyArt, MerdomonArt } from '../art';
import { Icon, type IconName } from '../icons';

export function EndScreen({ run, onHome, onNew }: { run: RunState; onHome: () => void; onNew: () => void }) {
  const victory = run.phase === 'victory';
  const s = run.stats;
  const rows: { icon: IconName | 'merdomon' | 'enemy'; label: string; value: string | number }[] = [
    { icon: 'fight', label: 'Waves won', value: `${s.wavesWon}/${ROUNDS}` },
    { icon: 'enemy', label: 'Distractions defeated', value: s.enemiesDefeated },
    { icon: 'fist', label: 'Damage dealt', value: s.damageDealt },
    { icon: 'merdomon', label: 'Merdomon created', value: s.merdomonCreated },
    { icon: 'tp', label: 'Toilet Paper earned', value: s.tpEarned },
    { icon: 'poop', label: 'Merdascore earned', value: s.merdascoreEarned },
    { icon: 'shop', label: 'Items bought', value: s.itemsBought },
  ];
  return (
    <div className="screen end">
      <div className={`end-title ${victory ? 'win' : 'lose'}`}>
        <Icon name={victory ? 'trophy' : 'skull'} size={64} fill="#fff" />
        <h1>{victory ? 'Victory!' : 'Game Over'}</h1>
        <p className="muted">{victory ? 'Break completed in peace.' : `Distracted at wave ${run.round}`}</p>
      </div>
      <div className="end-stats sk">
        {rows.map((r) => (
          <div key={r.label} className="end-row">
            {r.icon === 'merdomon' ? (
              <MerdomonArt size={22} />
            ) : r.icon === 'enemy' ? (
              <EnemyArt size={22} />
            ) : (
              <Icon name={r.icon} size={20} fill="#fff" />
            )}
            <span>{r.label}</span>
            <b>{r.value}</b>
          </div>
        ))}
      </div>
      <div className="end-buttons">
        <button className="big-btn shadow" onClick={onNew}>
          <Icon name="play" size={22} fill="#1b1b1b" /> New Game
        </button>
        <button className="big-btn" onClick={onHome}>
          <Icon name="home" size={22} /> Home
        </button>
      </div>
    </div>
  );
}
