# D.o.t.T. – Defense of the Toilet

Roguelite auto-battler for smartphones (web app). Rules live in [GDD.md](GDD.md), per-version changes in [CHANGELOG.md](CHANGELOG.md).

## Working with the owner

- Talk to the owner in **Italian**. Everything in the game (UI text, names, tutorial) is in **English**.
- Before implementing a new version, list the open points/ambiguities and wait for answers; then propose sensible defaults for minor details and state them in the final report.
- Report balance with the simulation bot (`npm run sim`) after rule changes, noting that the greedy bot is pessimistic.

## Stack and layout

- TypeScript + React + Vite, tests with Vitest. Node is installed; on Windows prefer the Bash tool with `/d/Github Folder/...` paths.
- `src/engine/` – pure game rules, no UI. Every action is a pure function `(state) => newState` and returns the same state when not allowed; pair each with a `canX` guard.
  - `data.ts` – **all balance numbers and names** (costs, curves, waves, items, abilities, modifiers, bosses, structures, score).
  - `game.ts` – run flow and actions; `combat.ts` – fight simulation producing an event log; `generate.ts` – creatures and waves; `score.ts`; `save.ts` (localStorage, versioned key).
  - Seeded RNG (`rng.ts`) stored in the state, so combat is deterministic.
- `src/ui/` – screens, sketch-style SVG art (`art.tsx`, `bathroom.tsx`), icons (`icons.tsx`), styles in `src/styles.css`.

## UI rules

- Portrait phone, **fixed screens, no scrolling**. Verify new screens and tutorial pages in the browser at **375×667 (iPhone SE)**.
- Minimal text, icons first; black & white sketch style, colour only where meaningful (traits, stat bands, types).
- Stat values use the loot colour bands (`StatValue`).

## Release checklist (each version vX.Y)

1. Update rules in `src/engine`, add/adjust tests (`src/engine/*.test.ts`), run `npm test` and `npm run build`.
2. If the saved state shape changes, bump `RunState.version` and the save key in `save.ts`.
3. Update the **Rules** pages (`TutorialScreen.tsx`), the guided **Tutorial Game** if the basics changed (`src/engine/tutorial.ts`, `src/ui/TutorialGuide.tsx`), **GDD.md** and **CHANGELOG.md** (Italian).
4. Bump `version` in `package.json` (shown on the Home screen as vX.Y).
5. Commit, tag `vX.Y`, push, create the GitHub release from the CHANGELOG section; GitHub Actions deploys to https://fabiunes.github.io/DOT-Defense-of-the-Toilet/.
