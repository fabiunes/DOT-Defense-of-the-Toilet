import { MerdomonArt, PlayerArt } from '../art';
import { Icon } from '../icons';
import { ToiletPoints } from './ToiletsScreen';

export function HomeScreen({
  hasSave,
  onNew,
  onContinue,
  onTutorial,
  onStats,
  onToilets,
}: {
  hasSave: boolean;
  onNew: () => void;
  onContinue: () => void;
  onTutorial: () => void;
  onStats: () => void;
  onToilets: () => void;
}) {
  return (
    <div className="screen home">
      <div className="home-points">
        <ToiletPoints />
      </div>
      <div className="home-title">
        <MerdomonArt size={84} />
        <h1>D.o.t.T.</h1>
        <p>Defense of the Toilet</p>
      </div>
      <div className="home-menu">
        <button className="big-btn shadow" onClick={onNew}>
          <Icon name="play" size={22} fill="#1b1b1b" /> New Game
        </button>
        <button className="big-btn shadow" onClick={onContinue} disabled={!hasSave}>
          <Icon name="ff" size={22} fill="#fff" /> Continue
        </button>
        <button className="big-btn shadow" onClick={onTutorial}>
          <Icon name="question" size={22} fill="#fff" /> Tutorial
        </button>
        <button className="big-btn shadow" onClick={onStats}>
          <Icon name="trophy" size={22} fill="#fff" /> Stats
        </button>
        <button className="big-btn shadow" onClick={onToilets}>
          <Icon name="toilet" size={22} fill="#f2c94c" /> Toilets
        </button>
      </div>
      <div className="home-art">
        <PlayerArt />
      </div>
      <p className="version">v{__APP_VERSION__}</p>
    </div>
  );
}
