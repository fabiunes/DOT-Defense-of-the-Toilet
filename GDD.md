# D.O.T. – Defense of the Toilet · Game Design Document

> Fonte ufficiale delle regole. Il gioco è interamente in **inglese**; questo documento è in italiano, con i termini di gioco in inglese.

## 1. Concept

Single player per smartphone, roguelite + auto-battler. Il giocatore difende la propria pausa bagno da distrazioni e incursioni (i *Distraction-mon*), schierando dei *Merdomon*, finché la pausa non si conclude.

## 2. Specifiche tecniche e UI

- Web-app (in futuro app nativa / PWA).
- Solo verticale, **schermate fisse, nessuno scroll**.
- Poco testo: icone e azioni intuitive.
- Grafica minimal in bianco e nero stile sketch; solo i simboli dei tratti sono riconoscibili/caratterizzati.
- Tutti i Merdomon condividono la stessa grafica (per ora senza nome). Idem i Distraction-mon. Il Boss ha una grafica propria.

## 3. Piano di sviluppo

| Fase | Contenuto |
|---|---|
| **1** | Gioco base per beta testing, run completa. Livello 1 – *Home Bathroom*. |
| 2 | Componenti roguelite: *Toilet Points* guadagnati nelle run per potenziare il bagno (es. capienza Merdascore). |
| 3 | Livello 2 (*Work Bathroom*), Livello 3 (*Public Bathroom*), più abilità/tratti/nemici/oggetti, statistiche avanzate, archivio partite. |

## 4. Risorse del giocatore

| Risorsa | Range | Iniziale | Note |
|---|---|---|---|
| **Toilet Paper** (TP) | 0 → ∞ | 0 | Valuta. Mai negativa. Contatore numerico. |
| **Concentration** | 0 – 10 | 10 | "Vita" del giocatore, barra a riempimento. 0 = game over. |
| **Merdascore** | 0 – 20 | 0 | Spesa con *Evacuate*. L'eccesso oltre 20 va perso. |
| **Action Points** (AP) | – | 1 | Si ripristinano a 1 all'inizio di ogni preparazione. |

## 5. Merdomon

- Statistiche: **HP, DEF, ATK, SPD**. Ognuna parte da 1, max 10.
- Alla generazione si distribuiscono a caso **5 / 10 / 15** punti extra (Common / Rare / Epic), rispettando il max 10.
- Poi il giocatore assegna **+1 punto** a scelta (rispettando il max 10).
- **HP** = vita massima. I danni **persistono** tra i round.
- **Tratti**: casuali, anche ripetuti — 1 (Common), 2 (Rare), 3 (Epic).
- **Abilità**: 1, per ora sempre *Generic Ability* (nessun effetto).
- Massimo **6** Merdomon in squadra.

## 6. Distraction-mon

- Stesse statistiche e regola di generazione (5/10/15 punti sopra base 1, max 10). Nessun punto extra, nessun tratto.
- Abilità: *Generic Ability*.
- **Boss**: è il nemico Epic della wave 10, ha grafica dedicata ed è **sempre nell'ultimo slot**.

## 7. Tratti

Bonus a soglie in base al numero di occorrenze dello **stesso tratto** in squadra (Merdomon + oggetti; i doppioni sullo stesso Merdomon contano entrambi).

| Tratto | Simbolo | 2 | 4 | 6 | 8 | Effetto |
|---|---|---|---|---|---|---|
| **Paper** | 🧻 | 2 | 5 | 9 | 15 | TP a fine battaglia |
| **Merdon** | 💩 | 1 | 2 | 3 | 4 | Merdascore a fine battaglia |
| **Healthy** | ❤️ | 1 | 2 | 3 | 4 | +HP a tutti a inizio combattimento |
| **Haste** | ⚡ | 1 | 2 | 3 | 4 | +SPD a tutti a inizio combattimento |
| **Fighter** | 👊 | 1 | 2 | 3 | 4 | +ATK a tutti a inizio combattimento |
| **Defender** | 🛡️ | 1 | 2 | 3 | 4 | +DEF a tutti a inizio combattimento |

- I bonus dei tratti **possono superare il max 10**.
- I bonus di combattimento valgono **solo per quel combattimento**. A fine combattimento gli HP tornano al massimo base (gli HP correnti non lo superano).

## 8. Oggetti

Tutti e 6 sempre disponibili nello shop. Unici: una volta comprati spariscono dallo shop. Nessun limite di possesso. Ogni oggetto conta come **1 tratto**.

| Oggetto (IT) | Nome in gioco | Tratto | Effetto |
|---|---|---|---|
| Scopettone | **Toilet Brush** | 💩 Merdon | +2 Merdascore a fine wave |
| Rivista | **Magazine** | ❤️ Healthy | Il primo Merdomon che muore resuscita a vita piena (1 volta per combattimento) |
| Bidet | **Bidet** | 🛡️ Defender | *Evacuate* dà anche +1 Concentration |
| Doccino | **Hand Shower** | 🧻 Paper | Le azioni pagate in TP costano −1 TP (Flush, Bonus Action, Upgrade). **Lo Shop resta 10.** |
| Finestra | **Window** | ⚡ Haste | Il primo Merdomon della squadra fa un doppio attacco al suo **primo** attacco del combattimento |
| Asciugamano | **Towel** | 👊 Fighter | +5 TP a fine wave |

## 9. Flusso della run

1. Home → **New Game** → scelta di 1 tra 3 Merdomon **Common** (+1 punto extra).
2. 10 round: ognuno è **Preparation → Combat → Esito**.
3. Fine: **Game Over** se Concentration = 0 (in qualunque momento), **Victory** se si sconfigge il Boss. Perdere la wave 10 = Game Over.

### Waves (livello 1)

| Wave | Nemici |
|---|---|
| 1 | 1 Common |
| 2 | 2 Common |
| 3 | 2 Common + 1 Rare |
| 4 | 3 Common + 1 Rare |
| 5 | 4 Common + 1 Rare |
| 6 | 3 Common + 2 Rare |
| 7 | 3 Common + 3 Rare |
| 8 | 2 Common + 4 Rare |
| 9 | 6 Rare |
| 10 | 5 Rare + **Boss** (Epic, ultimo slot) |

Ordine dei nemici casuale (tranne il Boss).

## 10. Preparation

### Azioni a costo AP (1 AP ciascuna)

| Azione | Nome | Effetto |
|---|---|---|
| Cura | **Heal** | Tutta la squadra a HP massimi |
| Evacuate | **Evacuate** | Spendi 5 / 10 / 20 Merdascore → Merdomon Common / Rare / Epic. Bloccata con 6 slot pieni. |
| Acquista | **Shop** | 10 TP → compri un oggetto |
| Concentrate | **Concentrate** | −2 Concentration → +4 Merdascore. Non usabile con Concentration ≤ 2. |

### Azioni gratuite

| Azione | Nome | Costo | Effetto |
|---|---|---|---|
| Organize | **Organize** | – | Riordina la squadra |
| Flush | **Flush** | 5 TP | Elimina un Merdomon → +1 Concentration (max 10). Non sull'ultimo Merdomon. |
| Bonus Action | **Bonus Action** | 20 TP | +1 AP (solo per il round corrente) |
| Potenziamento | **Upgrade** | 10 TP | +1 a una statistica di un Merdomon (max 10). Ripetibile. |
| Combat | **Fight** | – | Avvia la wave |

## 11. Combattimento (automatico)

1. **Duello**: il primo Merdomon vivo contro il primo Distraction-mon vivo.
2. **Iniziativa**: SPD più alta inizia. Parità → SPD totale della squadra. Ulteriore parità → casuale. Si ricalcola a **ogni nuovo duello**.
3. **Danno** = ATK − DEF, minimo 1. Attacchi alternati fino alla morte di uno dei due.
4. Il morto viene sostituito dal successivo in squadra; il sopravvissuto resta con i suoi HP.
5. Fine quando una squadra è tutta sconfitta. Con 0 Merdomon la wave è persa.
6. Animazione rapida con tasto ⏩ per velocizzare/saltare.

### Esito

**Vittoria**: +Merdascore = Merdomon sopravvissuti.
**Sconfitta**: −Concentration = Distraction-mon sopravvissuti.

In entrambi i casi, poi:
1. +TP = danno totale inflitto ai Distraction-mon.
2. Bonus di tratti e oggetti di fine wave.
3. I Merdomon morti resuscitano con 1 HP.
4. Se Concentration = 0 → Game Over; altrimenti si passa alla Preparation successiva.

## 12. Schermate

- **Home**: New Game, Continue, Upgrade *(coming soon)*, Stats *(coming soon)*.
- **Starter**: scelta tra 3 Merdomon Common.
- **Main / Preparation** (dal basso verso l'alto):
  - giocatore stilizzato visto dall'alto, seduto sul water;
  - 6 slot Merdomon con anteprima delle caratteristiche;
  - bottoni **Action** e **Next Wave**;
  - in alto: TP (sinistra), barra Concentration (centro), Merdascore (destra).
- **Action panel**: griglia di icone con il costo indicato (AP per le azioni costose, TP per le altre).
- **Merdomon detail**: popup con statistiche e tratti, a icone.
- **Combat**: animazione automatica con tasto ⏩.
- **Game Over / Victory**: riepilogo delle statistiche della run *(Toilet Points: Fase 2)*.

## 13. Salvataggio

Salvataggio automatico nel browser all'inizio di ogni Preparation → tasto **Continue**.
