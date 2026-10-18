import { useCallback, useEffect, useState } from 'react';
import { continueAfterCombat, newRun } from './engine/game';
import { clearSave, loadRun, saveRun } from './engine/save';
import type { RunState } from './engine/types';
import { SketchDefs } from './ui/art';
import { CombatScreen } from './ui/screens/CombatScreen';
import { EndScreen } from './ui/screens/EndScreen';
import { HomeScreen } from './ui/screens/HomeScreen';
import { PrepScreen } from './ui/screens/PrepScreen';
import { StarterScreen } from './ui/screens/StarterScreen';
import type { Update } from './ui/update';

export default function App() {
  const [run, setRun] = useState<RunState | null>(null);
  const [hasSave, setHasSave] = useState(() => loadRun() !== null);

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
  if (!run) {
    content = <HomeScreen hasSave={hasSave} onNew={() => setRun(newRun())} onContinue={() => setRun(loadRun())} />;
  } else if (run.phase === 'starter') {
    content = <StarterScreen run={run} update={update} />;
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
