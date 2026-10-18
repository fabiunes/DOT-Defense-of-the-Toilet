# D.O.T. – Defense of the Toilet 🚽🛡️

Roguelite auto-battler per smartphone: difendi la tua pausa bagno dai *Distraction-mon* schierando i tuoi *Merdomon*.

**Gioca:** https://fabiunes.github.io/DOT-Defense-of-the-Toilet/

Le regole complete sono in [GDD.md](GDD.md), le novità di ogni versione in [CHANGELOG.md](CHANGELOG.md).

## Sviluppo

```bash
npm install
npm run dev      # server locale (anche da telefono sulla stessa rete Wi-Fi)
npm test         # test del motore di gioco
npm run sim      # simula 500 run con un bot (indicazione di bilanciamento)
npm run build    # build di produzione in dist/
```

## Struttura

- `src/engine/` – regole del gioco in TypeScript puro (nessuna dipendenza dalla UI), con test.
- `src/ui/` – schermate React, icone e grafica sketch.
- Ogni push su `main` pubblica automaticamente il gioco su GitHub Pages.
