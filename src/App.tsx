import { useCallback, useEffect, useState } from 'react';
import { continueAfterCombat, newRun } from './engine/game';
import { clearSave, loadRun, saveRun } from './engine/save';
import type { RunState } from './engine/types';
import { SketchDefs } from './ui/art';
import { BossRevealScreen } from './ui/screens/BossRevealScreen';
import { CombatScreen } from './ui/screens/CombatScreen';
import { EndScreen } from './ui/screens/EndScreen';
import { HomeScreen } from './ui/screens/HomeScreen';
import { PrepScreen } from './ui/screens/PrepScreen';
import { StartBonusScreen } from './ui/screens/StartBonusScreen';
import { StarterScreen } from './ui/screens/StarterScreen';
import { TutorialScreen } from './ui/screens/TutorialScreen';
import type { Update } from './ui/update';

export default function App() {
  const [run, setRun] = useState<RunState | null>(null);
  const [hasSave, setHasSave] = useState(() => loadRun() !== null);
  const [showTutorial, setShowTutorial] = useState(false);

  // Autosave during preparation; a finished run removes the save.
  useEffect(() => {
    if (!run) return;
    if (run.phase === 'preparation') saveRun(run);
    else if (run.phase === 'gameover' || run.phase === 'victory') clearSave();
  }, [run]);

  const update: Update = useCallback((fn) => setRun((s) => (s ? fn(s) : s)), []);

  const goHome = () => {
    setRun(null);
    setHasSave(loadRun() !== null);
  };

  let content;
  if (showTutorial) {
    content = <TutorialScreen onClose={() => setShowTutorial(false)} />;
  } else if (!run) {
    content = (
      <HomeScreen
        hasSave={hasSave}
        onNew={() => setRun(newRun())}
        onContinue={() => setRun(loadRun())}
        onTutorial={() => setShowTutorial(true)}
      />
    );
  } else if (run.phase === 'boss') {
    content = <BossRevealScreen run={run} update={update} />;
  } else if (run.phase === 'starter') {
    content = <StarterScreen run={run} update={update} />;
  } else if (run.phase === 'startBonus') {
    content = <StartBonusScreen run={run} update={update} />;
  } else if (run.phase === 'preparation') {
    content = <PrepScreen run={run} update={update} />;
  } else if (run.phase === 'combat' && run.lastCombat) {
    content = <CombatScreen key={run.round} report={run.lastCombat} onDone={() => update(continueAfterCombat)} />;
  } else {
    content = <EndScreen run={run} onHome={goHome} onNew={() => setRun(newRun())} />;
  }

  return (
    <div className="app">
      <SketchDefs />
      {content}
    </div>
  );
}
