# D.O.T. – Defense of the Toilet · Game Design Document

> Versione regole: **v0.3** (modifiche per versione in [CHANGELOG.md](CHANGELOG.md)).
>
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
| **Toilet Paper** (TP) | 0 → ∞ | 2 | Valuta. Mai negativa. Contatore numerico. |
| **Concentration** | 0 – 10 | 10 | "Vita" del giocatore, barra a riempimento. 0 = game over. |
| **Merdascore** | 0 – 20 | 5 | Spesa con *Evacuate*. L'eccesso oltre 20 va perso. |
| **Action Points** (AP) | – | 1 | A ogni preparazione: 1 + bonus del tratto Action. Quelli non spesi si perdono (tornano a 0 dopo il combattimento). |

## 5. Merdomon

- Statistiche: **HP, DEF, ATK, SPD**, ognuna tra 1 e 10. I valori sono colorati per fascia (scala "loot"): 1–2 grigio, 3–4 verde, 5–6 blu, 7–8 viola, 9–10 arancione.
- **Grandezza** (Small ★ / Big ★★ / Huge ★★★): decide il totale delle statistiche (**10 / 15 / 20**), i tratti (1 / 2 / 3) e il costo di Evacuate. Il disegno è più grande al crescere della grandezza.
- **Tipo** (estratto a caso con la stessa probabilità, indipendente dalla grandezza): decide come si divide il totale.

| Tipo | Aspetto | Ripartizione |
|---|---|---|
| **Normal** | Cacca marrone | 25 · 25 · 25 · 25 % (tuttofare) |
| **Runny** (Sciolta) | Cacca gialla "colante" | 40 · 40 · 10 · 10 % (due statistiche forti) |
| **Fart** | Nuvoletta trasparente | 65 · 25 · 10 · 0 % (una statistica fortissima) |

- **Generazione**: il Merdomon nasce con totale − 1 (9 / 14 / 19) diviso **esattamente** secondo la curva; ogni quota va a una statistica scelta a caso. Poi il giocatore assegna il **+1** e si arriva a 10 / 15 / 20.
  - Arrotondamento: i punti avanzati vanno alle quote con la parte decimale più alta (a parità, alla quota più grande).
  - Ogni statistica è almeno 1 (il punto si toglie alla più alta) e al massimo 10 (l'eccesso passa alle quote successive).
  - Esempi (totale 20): Normal 5·5·5·5, Runny 8·8·2·2, Fart 10·7·2·1. Small Merdomon alla nascita (9): Normal 3·2·2·2, Runny 4·3·1·1, Fart 5·2·1·1.
- **HP** = vita massima. I danni **persistono** tra i round.
- **Tratti**: casuali tra i 7 disponibili (Action compreso), anche ripetuti — 1 (Small), 2 (Big), 3 (Huge).
- **Abilità**: 1, scelta dal giocatore tra **3 estratte a caso** (tutte diverse) nella stessa schermata del +1, poi *Confirm*. Valori fissi per tutte le grandezze (vedi §7b).
- Massimo **6** Merdomon in squadra.

## 6. Distraction-mon

- Stesse regole di generazione con totale **10 / 15 / 20** (Small / Big / Huge), senza +1 a scelta e senza tratti.

| Tipo | Aspetto | Ripartizione |
|---|---|---|
| **Smartphone** | Nero | 25 · 25 · 25 · 25 % |
| **Book** (Libro) | Verde | 40 · 40 · 10 · 10 % |
| **Console** | Rossa, stile Switch | 65 · 25 · 10 · 0 % |

- Nessuna abilità: le difficoltà extra arrivano dai modificatori delle wave (§9b).
- **Boss**: è il nemico Huge della wave 10, con la corona,, ha grafica dedicata ed è **sempre nell'ultimo slot**.

## 7. Tratti

Bonus a soglie in base al numero di occorrenze dello **stesso tratto** in squadra (Merdomon + oggetti; i doppioni sullo stesso Merdomon contano entrambi).

| Tratto | Simbolo | 2 | 4 | 6 | 8 | Effetto |
|---|---|---|---|---|---|---|
| **Paper** | 🧻 | 2 | 5 | 9 | 15 | TP a fine battaglia |
| **Merdon** | 💩 | 1 | 2 | 3 | 4 | Merdascore a fine battaglia |
| **Healthy** | ❤️ | 1 | 2 | 3 | 4 | +HP a tutti a inizio combattimento |
| **Haste** | ⚡ | 1 | 2 | 3 | 4 | +SPD a tutti a inizio combattimento |
| **Fighter** | 🥊 | 1 | 2 | 3 | 4 | +ATK a tutti a inizio combattimento |
| **Defender** | 🛡️ | 1 | 2 | 3 | 4 | +DEF a tutti a inizio combattimento |
| **Action** | ◆ | 1 | 1 | 2 | 2 | +AP a ogni preparazione |

- I bonus dei tratti **possono superare il max 10**.
- I bonus di combattimento valgono **solo per quel combattimento**. A fine combattimento gli HP tornano al massimo base (gli HP correnti non lo superano).

## 7b. Abilità dei Merdomon

| Abilità | Effetto |
|---|---|
| 📣 **Cheerleader** | Il Merdomon dietro di lui ottiene +1 ATK (inizio combattimento) |
| 🧱 **Frontliner** | Se è il primo della fila: +2 HP e +1 DEF |
| 🛡️ **Rear Guard** | Se è l'ultimo della fila: +2 DEF |
| 🦏 **Thick Skin** | −1 al danno subito (minimo 1): danno = ATK − ⌊DEF/2⌋ − 1 |
| 🌵 **Spiky** | Chi lo colpisce subisce 1 danno |
| 💦 **Splash** | Ogni suo colpo infligge 1 danno anche al nemico successivo in fila |
| 🎯 **Giant Slayer** | +2 ATK contro nemici Big e Huge (Boss compreso) |
| ⛄ **Snowball** | +1 ATK (per il combattimento) per ogni nemico che sconfigge |
| 🩸 **Leech** | Si cura di 1 HP quando infligge danno |
| 💨 **Second Wind** | Una volta per combattimento, invece di morire resta con 1 HP |
| 💥 **Last Gasp** | Quando muore, 3 danni a chi l'ha ucciso |
| 🎁 **Legacy** | Quando muore, il Merdomon successivo ottiene +2 ATK |
| 🪙 **Collector** | +2 TP per ogni nemico che sconfigge |
| 🌱 **Fertilizer** | +1 Merdascore a fine wave se è sopravvissuto |
| 🤢 **Stinky Aura** | Il nemico che affronta ha −1 SPD |

Regole di dettaglio:
- Un nemico ucciso da Splash prima del suo turno viene saltato; uno ucciso da Spiky o Last Gasp perde il duello. Il danno conta per il TP di fine wave.
- Second Wind scatta prima del Magazine.
- Cheerleader e Legacy agiscono su chi è dietro all'inizio del combattimento o al momento della morte; se non c'è nessuno, l'effetto si perde.
- Un nemico "sconfitto da" un Merdomon (Snowball, Collector) è quello a cui ha dato il colpo finale con qualunque suo danno.

## 8. Oggetti

A ogni preparazione lo shop estrae **2 oggetti a caso** (3 con il Game Boy) tra quelli non ancora posseduti. Un oggetto comprato lascia lo slot vuoto fino al round successivo. **Re-Roll**: 2 TP, illimitato. Unici, nessun limite di possesso. Ogni oggetto conta per i suoi tratti (alcuni ne hanno 2).

| Oggetto (IT) | Nome in gioco | Tratto | Effetto |
|---|---|---|---|
| Scopettone | **Toilet Brush** | 💩 Merdon | +2 Merdascore a fine wave |
| Rivista | **Magazine** | ❤️ Healthy | Il primo Merdomon che muore resuscita a vita piena (1 volta per combattimento) |
| Bidet | **Bidet** | 🛡️ Defender | *Evacuate* dà anche +1 Concentration |
| Doccino | **Hand Shower** | 🧻 Paper | Shop, Flush e Bonus Action costano −2 TP |
| Finestra | **Window** | ⚡ Haste | Il primo Merdomon della squadra fa un doppio attacco al suo **primo** attacco del combattimento |
| Asciugamano | **Towel** | 🥊 Fighter | +5 TP a fine wave |
| Spazzolino | **Toothbrush** | ◆ Action | +X HP a tutti i Merdomon per il combattimento, dove X = AP non spesi quando si preme Next Wave |
| Infradito | **Flip-Flops** | ◆ Action + ⚡ Haste | Un Merdomon con Velocità almeno doppia rispetto all'avversario attacca 2 volte a ogni turno (solo Merdomon) |
| Game Boy | **Game Boy** | 🧻 Paper + 💩 Merdon | 3 opzioni invece di 2 in Shop ed Evacuate |

## 9. Flusso della run

1. Home → **New Game** → scelta di 1 tra 3 Merdomon **Small** → abilità (1 tra 3) e +1.
2. **Bonus di partenza**, uno a scelta tra:
   - un **oggetto** casuale;
   - un Merdomon **Small** casuale (poi abilità e +1);
   - un pacchetto **Supplies**: +5 TP, +3 Merdascore, +1 AP solo nel round 1.
3. 10 round: ognuno è **Preparation → Combat → Esito**.
4. Fine: **Game Over** se Concentration = 0 (in qualunque momento), **Victory** se si sconfigge il Boss. Perdere la wave 10 = Game Over.

### Waves (livello 1)

| Wave | Nemici |
|---|---|
| 1 | 1 Small |
| 2 | 3 Small |
| 3 | 3 Small + 1 Big |
| 4 | 4 Small + 1 Big |
| 5 | 4 Small + 1 Big |
| 6 | 3 Small + 2 Big |
| 7 | 3 Small + 3 Big |
| 8 | 2 Small + 4 Big |
| 9 | 6 Big |
| 10 | 5 Big + **Boss** (Huge, ultimo slot) |

Ordine dei nemici casuale (tranne il Boss).

### 9b. Modificatori delle wave

Le wave **3, 6, 9 e 10** hanno un modificatore, estratto a inizio partita tra questi 6 (senza ripetizioni; il Jackpot mai alla wave 10). È visibile sul tasto Next Wave e nello Scout.

| Modificatore | Effetto |
|---|---|
| 💬 **Group Chat** | Un nemico Small in più (tipo casuale) in testa alla fila |
| 📵 **Wi-Fi Down** | I bonus di combattimento dei tratti non valgono |
| ⏰ **Rush Hour** | I nemici colpiscono sempre per primi (la Window resta valida) |
| 📱 **Doomscrolling** | Ogni volta che cade un tuo Merdomon, tutti i nemici +1 ATK (si somma) |
| 🔕 **Silent Mode** | Le abilità dei Merdomon non si attivano |
| 🎰 **Jackpot** | Nemici +1 ATK e +1 HP, ma TP e Merdascore della wave raddoppiati |

- **Ricompensa**: se vinci una wave con il modificatore attivo, **+1 AP** nella preparazione del round successivo.
- **Disattivazione**: durante la preparazione, per **3 TP** (senza sconto). Si perde anche la ricompensa. **Alla wave 10 non si può disattivare.**

## 10. Preparation

### Azioni a costo AP (1 AP ciascuna)

| Azione | Nome | Effetto |
|---|---|---|
| Cura | **Heal** | Tutta la squadra a HP massimi |
| Evacuate | **Evacuate** | Spendi 5 / 10 / 20 Merdascore → appaiono **2 Merdomon** (3 con il Game Boy) Small / Big / Huge tra cui sceglierne 1, poi il +1. **Re-Roll** delle opzioni: 2 TP, illimitato. Bloccata con 6 slot pieni. |
| Acquista | **Shop** | 10 TP → compri uno dei 3 oggetti in vendita |
| Concentrate | **Concentrate** | −2 Concentration → +4 Merdascore. Non usabile con Concentration ≤ 2. |
| Scambio | **Trade** | A scelta: +2 Merdascore, +5 TP, oppure +1 a una statistica di un Merdomon (max 10). Sempre disponibile. |

### Azioni gratuite

| Azione | Nome | Costo | Effetto |
|---|---|---|---|
| Organize | **Organize** | – | Riordina la squadra |
| Flush | **Flush** | 5 TP | Elimina un Merdomon → +1 Concentration (max 10). Non sull'ultimo Merdomon. |
| Bonus Action | **Bonus Action** | 20 TP | +1 AP (solo per il round corrente) |
| Anteprima | **Scout** | – | Mostra le statistiche dei nemici in arrivo, nell'ordine di combattimento |
| Combat | **Fight** | – | Avvia la wave |

## 11. Combattimento (automatico)

1. **Duello**: il primo Merdomon vivo contro il primo Distraction-mon vivo.
2. **Iniziativa**: SPD più alta inizia. Parità → SPD totale della squadra. Ulteriore parità → casuale. Si ricalcola a **ogni nuovo duello**.
3. **Danno** = ATK − ⌊DEF / 2⌋, minimo 1. Attacchi alternati fino alla morte di uno dei due.
4. **Velocità**: decide solo chi colpisce per primo. Il doppio colpo con Velocità doppia esiste solo con le **Flip-Flops** (e solo per i Merdomon).
5. Il morto viene sostituito dal successivo in squadra; il sopravvissuto resta con i suoi HP.
6. Fine quando una squadra è tutta sconfitta. Con 0 Merdomon la wave è persa.
7. Animazione rapida con tasto ⏩ per velocizzare/saltare.

### Esito

**Vittoria**: +Merdascore = Merdomon sopravvissuti.
**Sconfitta**: −Concentration = Distraction-mon sopravvissuti, **massimo 3** per wave.

In entrambi i casi, poi:
1. +TP = danno totale inflitto ai Distraction-mon.
2. Bonus di tratti e oggetti di fine wave.
3. I Merdomon morti tornano con **metà degli HP massimi** (arrotondata per eccesso).
4. Se Concentration = 0 → Game Over; altrimenti si passa alla Preparation successiva.

## 12. Schermate

- **Home**: New Game, Continue, Tutorial, Upgrade *(coming soon)*, Stats *(coming soon)*; numero di versione in basso.
- **Tutorial**: 11 pagine con icone e regole, con esempi presi dalla schermata principale.
- **Starter**: scelta tra 3 Merdomon Small, poi schermata abilità + +1 con Confirm.
- **Starting bonus**: scelta tra oggetto, Merdomon Small e Supplies.
- **Main / Preparation** (dal basso verso l'alto):
  - giocatore stilizzato visto dall'alto, seduto sul water;
  - 6 slot Merdomon con anteprima delle caratteristiche;
  - bottoni **Preparation** e **Next Wave**;
  - in alto: TP (sinistra), barra Concentration (centro), Merdascore (destra); sotto, "Round X/10" a sinistra, oggetti al centro, "Actions ◆" a destra, poi i tratti.
- **Preparation panel**: griglia di icone con il costo indicato (AP per le azioni costose, TP per le altre).
- **Merdomon detail**: popup con statistiche e tratti, a icone.
- **Combat**: prima una schermata "Bonuses" con il modificatore della wave, le abilità di inizio combattimento, i bonus attivi di tratti e oggetti e la squadra potenziata (si chiude toccando o dopo 2,6 secondi), poi animazione automatica con tasto ⏩.
- **Game Over / Victory**: riepilogo delle statistiche della run *(Toilet Points: Fase 2)*.

## 13. Salvataggio

Salvataggio automatico nel browser all'inizio di ogni Preparation → tasto **Continue**.
