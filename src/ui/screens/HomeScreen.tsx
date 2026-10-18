import { MerdomonArt, PlayerArt } from '../art';
import { Icon } from '../icons';

export function HomeScreen({ hasSave, onNew, onContinue }: { hasSave: boolean; onNew: () => void; onContinue: () => void }) {
  return (
    <div className="screen home">
      <div className="home-title">
        <MerdomonArt size={84} />
        <h1>D.O.T.</h1>
        <p>Defense of the Toilet</p>
      </div>
      <div className="home-menu">
        <button className="big-btn shadow" onClick={onNew}>
          <Icon name="play" size={22} fill="#1b1b1b" /> New Game
        </button>
        <button className="big-btn shadow" onClick={onContinue} disabled={!hasSave}>
          <Icon name="ff" size={22} fill="#fff" /> Continue
        </button>
        <button className="big-btn" disabled>
          <Icon name="upgrade" size={22} /> Upgrade <span className="soon">soon</span>
        </button>
        <button className="big-btn" disabled>
          <Icon name="trophy" size={22} fill="#fff" /> Stats <span className="soon">soon</span>
        </button>
      </div>
      <div className="home-art">
        <PlayerArt />
      </div>
    </div>
  );
}
