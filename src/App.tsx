import { useCallback, useEffect, useRef, useState } from 'react';
import { continueAfterCombat, newRun, roundsOf } from './engine/game';
import { clearSave, loadRun, saveRun } from './engine/save';
import { TUTORIAL_ROUNDS, tutorialAdjust, tutorialRun } from './engine/tutorial';
import type { RunState } from './engine/types';
import { analytics } from './ui/analytics';
import { SketchDefs } from './ui/art';
import { BossRevealScreen } from './ui/screens/BossRevealScreen';
import { Modal } from './ui/components';
import { CombatScreen } from './ui/screens/CombatScreen';
import { CustomizeScreen } from './ui/screens/CustomizeScreen';
import { EndScreen } from './ui/screens/EndScreen';
import { HomeScreen } from './ui/screens/HomeScreen';
import { PrepScreen } from './ui/screens/PrepScreen';
import { StartBonusScreen } from './ui/screens/StartBonusScreen';
import { StarterScreen } from './ui/screens/StarterScreen';
import { StatsScreen } from './ui/screens/StatsScreen';
import { TutorialEndScreen } from './ui/screens/TutorialEndScreen';
import { TutorialScreen } from './ui/screens/TutorialScreen';
import { TutorialGuide } from './ui/TutorialGuide';
import type { Update } from './ui/update';

export default function App() {
  const [run, setRun] = useState<RunState | null>(null);
  const [hasSave, setHasSave] = useState(() => loadRun() !== null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showStats, setShowStats] = useState(false);
  // The Tutorial Game: a prepared run, never saved or recorded.
  const [tutorial, setTutorial] = useState(false);
  const tutorialRef = useRef(false);
  tutorialRef.current = tutorial;

  // Autosave during preparation; a finished run removes the save.
  useEffect(() => {
    if (!run || tutorial) return;
    if (run.phase === 'preparation') saveRun(run);
    else if (run.phase === 'gameover' || run.phase === 'victory') clearSave();
  }, [run, tutorial]);

  const update: Update = useCallback(
    (fn) => setRun((s) => (s ? (tutorialRef.current ? tutorialAdjust(fn(s)) : fn(s)) : s)),
    [],
  );

  const goHome = () => {
    setRun(null);
    setTutorial(false);
    setHasSave(loadRun() !== null);
  };
  const startTutorial = () => {
    analytics.tutorialStart();
    setTutorial(true);
    setRun(tutorialRun());
  };
  const skipTutorial = () => {
    analytics.tutorialSkip();
    goHome();
  };
  const tutorialDone = tutorial && !!run && run.round > TUTORIAL_ROUNDS;

  // Home from inside a run: confirm first (a run is saved only from its first Preparation).
  const [leaving, setLeaving] = useState(false);
  const requestHome = () => {
    if (tutorial) return skipTutorial();
    if (!run || run.phase === 'boss') return goHome();
    setLeaving(true);
  };
  const saved = !!run && (run.phase === 'preparation' || run.phase === 'combat');

  let content;
  if (showStats) {
    content = <StatsScreen onClose={() => setShowStats(false)} />;
  } else if (showTutorial) {
    // From Home the rules close back home; from a run (Help) they go back to the game.
    content = <TutorialScreen onClose={() => setShowTutorial(false)} homeIcon={!run} />;
  } else if (!run) {
    content = (
      <HomeScreen
        hasSave={hasSave}
        onNew={() => setRun(newRun())}
        onTutorialGame={startTutorial}
        onContinue={() => setRun(loadRun())}
        onTutorial={() => setShowTutorial(true)}
        onStats={() => setShowStats(true)}
      />
    );
  } else if (tutorialDone) {
    content = (
      <TutorialEndScreen
        onHome={goHome}
        onNew={() => {
          setTutorial(false);
          setRun(newRun());
        }}
        onRules={() => {
          goHome();
          setShowTutorial(true);
        }}
      />
    );
  } else if (run.phase === 'boss') {
    content = <BossRevealScreen run={run} update={update} onHome={requestHome} />;
  } else if (run.phase === 'customize') {
    content = <CustomizeScreen run={run} update={update} onHome={requestHome} />;
  } else if (run.phase === 'starter') {
    content = <StarterScreen run={run} update={update} onHome={requestHome} />;
  } else if (run.phase === 'startBonus') {
    content = <StartBonusScreen run={run} update={update} onHome={requestHome} />;
  } else if (run.phase === 'preparation') {
    content = <PrepScreen run={run} update={update} onHelp={() => setShowTutorial(true)} onHome={requestHome} />;
  } else if (run.phase === 'combat' && run.lastCombat) {
    content = (
      <CombatScreen
        key={`${run.endlessLevel}-${run.round}`}
        report={run.lastCombat}
        rounds={roundsOf(run)}
        onDone={() => update(continueAfterCombat)}
        onHome={requestHome}
      />
    );
  } else {
    content = <EndScreen run={run} onHome={goHome} onNew={() => setRun(newRun())} />;
  }

  return (
    <div className="app">
      <SketchDefs />
      {content}
      {tutorial && run && !tutorialDone && !showTutorial && <TutorialGuide run={run} onSkip={skipTutorial} />}
      {leaving && (
        <Modal onClose={() => setLeaving(false)} className="leave-modal">
          <h2>Leave the run?</h2>
          <p className="center">{saved ? 'You can Continue it later from Home.' : 'This run has not started yet: it will be lost.'}</p>
          <button
            className="big-btn shadow"
            onClick={() => {
              setLeaving(false);
              goHome();
            }}
          >
            Leave
          </button>
          <button className="big-btn" onClick={() => setLeaving(false)}>
            Stay
          </button>
        </Modal>
      )}
    </div>
  );
}
