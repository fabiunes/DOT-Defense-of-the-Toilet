import { useState } from 'react';
import { claimTutorialReward } from '../../engine/save';
import { TUTORIAL_REWARD } from '../../engine/tutorial';
import { analytics } from '../analytics';
import { MerdomonArt } from '../art';
import { Icon } from '../icons';

/** End of the Tutorial Game: the one-time reward and where to learn the rest. */
export function TutorialEndScreen({ onHome, onNew, onRules }: { onHome: () => void; onNew: () => void; onRules: () => void }) {
  const [reward] = useState(() => {
    analytics.tutorialComplete();
    return claimTutorialReward(TUTORIAL_REWARD);
  });
  return (
    <div className="screen tutorial-end">
      <MerdomonArt size={84} />
      <h1>Tutorial complete!</h1>
      {reward > 0 && (
        <span className="reward">
          +{reward} <Icon name="toilet" size={20} fill="#f2c94c" /> Toilet Points
        </span>
      )}
      <p className="muted">
        A real run lasts 10 waves, with a Boss on waves 5 and 10. Your final score becomes Toilet Points: spend them in
        Toilets to unlock new bathrooms.
      </p>
      <p className="muted">Learn the rest in Rules: wave modifiers, Bosses, Trade, Concentrate, Flush and Farting.</p>
      <button className="big-btn shadow" onClick={onNew}>
        <Icon name="play" size={22} fill="#1b1b1b" /> New Game
      </button>
      <button className="big-btn" onClick={onRules}>
        <Icon name="question" size={22} fill="#fff" /> Rules
      </button>
      <button className="big-btn" onClick={onHome}>
        <Icon name="home" size={22} /> Home
      </button>
    </div>
  );
}
