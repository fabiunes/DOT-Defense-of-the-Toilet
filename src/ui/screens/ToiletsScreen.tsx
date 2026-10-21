import { useState } from 'react';
import { BATHROOMS, BATHROOM_INFO } from '../../engine/data';
import { isUnlocked, loadToiletPoints, unlockAllWithPassword, unlockBathroom } from '../../engine/save';
import { analytics } from '../analytics';
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

/** The bathroom collection: see every type and unlock new ones with Toilet Points. The last page is for testers. */
export function ToiletsScreen({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(0);
  const [, refresh] = useState(0);
  const bathroomPages = Math.ceil(BATHROOMS.length / PAGE);
  const pages = bathroomPages + 1;
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
      {page < bathroomPages ? (
        <>
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
                      if (unlockBathroom(id)) analytics.unlock(id);
                      refresh((n) => n + 1);
                    }}
                  >
                    🔒 Unlock
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <TestingPrivilege />
      )}
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

/** Testers with the password can unlock every bathroom for free. */
function TestingPrivilege() {
  const [asking, setAsking] = useState(false);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'wrong' | 'done'>(
    BATHROOMS.every(isUnlocked) ? 'done' : 'idle',
  );

  const submit = async () => {
    const ok = await unlockAllWithPassword(password);
    if (ok) analytics.testingUnlock();
    setStatus(ok ? 'done' : 'wrong');
  };

  return (
    <div className="toilets-list testing">
      <h3>Testing Privilege</h3>
      <p className="tut-note">If you have the password to unlock all the content, tap the button below.</p>
      {status === 'done' ? (
        <span className="unlocked-tag">
          <Icon name="check" size={16} /> All toilets unlocked
        </span>
      ) : asking ? (
        <form
          className="password-form"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <input
            className="sk"
            type="password"
            placeholder="Insert Password"
            aria-label="Insert Password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setStatus('idle');
            }}
          />
          {status === 'wrong' && <small className="wrong">Wrong password</small>}
          <button className="big-btn shadow" type="submit" disabled={!password}>
            <Icon name="check" size={20} /> Confirm
          </button>
        </form>
      ) : (
        <button className="big-btn shadow" onClick={() => setAsking(true)}>
          🔒 Unlock All Toilet
        </button>
      )}
    </div>
  );
}
