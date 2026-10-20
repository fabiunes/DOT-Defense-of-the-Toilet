import { useState } from 'react';
import { BATHROOMS, BATHROOM_INFO } from '../../engine/data';
import { isUnlocked, loadToiletPoints, unlockBathroom } from '../../engine/save';
import { Icon } from '../icons';
import { BathroomCard } from './BossRevealScreen';

/** Toilet Points balance (earned with the final score of every run). */
export function ToiletPoints() {
  return (
    <span className="toilet-points" aria-label="Toilet Points">
      <Icon name="toilet" size={18} fill="#f2c94c" />
      <b>{loadToiletPoints().toLocaleString('en')}</b>
    </span>
  );
}

const PAGE = 2;

/** The bathroom collection: see every type and unlock new ones with Toilet Points. */
export function ToiletsScreen({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(0);
  const [, refresh] = useState(0);
  const pages = Math.ceil(BATHROOMS.length / PAGE);
  const shown = BATHROOMS.slice(page * PAGE, page * PAGE + PAGE);
  return (
    <div className="screen toilets">
      <div className="tut-head">
        <h2>Toilets</h2>
        <ToiletPoints />
        <button className="icon-btn" onClick={onClose} aria-label="Close toilets">
          <Icon name="close" size={22} />
        </button>
      </div>
      <p className="tut-note">Your final score becomes Toilet Points. Spend them to unlock new bathrooms.</p>
      <div className="toilets-list">
        {shown.map((id) => (
          <div key={id} className="toilet-entry">
            <BathroomCard id={id} />
            {isUnlocked(id) ? (
              <span className="unlocked-tag">
                <Icon name="check" size={16} /> Unlocked
              </span>
            ) : (
              <button
                className="big-btn unlock-btn"
                disabled={loadToiletPoints() < BATHROOM_INFO[id].cost}
                onClick={() => {
                  unlockBathroom(id);
                  refresh((n) => n + 1);
                }}
              >
                🔒 Unlock
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="tut-nav">
        <button className="icon-btn sk" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous">
          <Icon name="play" size={18} fill="#fff" className="flip" />
        </button>
        <span>
          {page + 1}/{pages}
        </span>
        <button className="icon-btn sk" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label="Next">
          <Icon name="play" size={18} fill="#1b1b1b" />
        </button>
      </div>
    </div>
  );
}
