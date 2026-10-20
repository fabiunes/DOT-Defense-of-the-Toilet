# D.o.t.T. – Defense of the Toilet · Game Design Document

> Versione regole: **v0.6** (modifiche per versione in [CHANGELOG.md](CHANGELOG.md)).
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
| 2 | Componenti roguelite: *Toilet Points* e tipi di bagno da sbloccare (**fatto nella v0.6**, §9g). |
| 3 | Grafica dedicata per ogni bagno, più abilità/tratti/nemici/oggetti. |

## 4. Risorse del giocatore

| Risorsa | Range | Iniziale | Note |
|---|---|---|---|
| **Toilet Paper** (TP) | 0 → limite Paper Holder (§9d) | dal bagno (§9g) | Valuta. L'eccesso va perso. |
| **Concentration** | 0 → limite Shower (§9d) | dal bagno (§9g) | "Vita" del giocatore, barra a riempimento. 0 = game over. |
| **Poop** | 0 → limite Bidet (§9d) | dal bagno (§9g) | Spesa con *Evacuate*. L'eccesso va perso. |
| **Action Points** (AP) | 0 → limite Toilet Brush (§9d) | 1 al primo round | A ogni preparazione: +1, + tratto Action, + Sink, + ricompense. **Quelli non spesi si accumulano** fino al limite. |
| **Toilet Points** | illimitati | 200.000 (test) | Valuta permanente tra le partite: il punteggio di ogni partita conclusa si aggiunge. Servono a sbloccare i bagni (§9g). |

## 5. Merdomon

- Statistiche: **HP, DEF, ATK, SPD**, ognuna tra 1 e 10. I valori sono colorati per fascia (scala "loot"): 1–2 grigio, 3–4 verde, 5–6 blu, 7–8 viola, 9–10 arancione.
- **Grandezza** (Small ★ / Big ★★ / Huge ★★★): decide il totale delle statistiche (**10 / 15 / 20**), i tratti (1 / 2 / 3) e il costo di Evacuate. Il disegno è più grande al crescere della grandezza.
- **Tipo** (estratto a caso con la stessa probabilità, indipendente dalla grandezza): decide come si divide il totale.

| Tipo | Aspetto | Ripartizione |
|---|---|---|
| **Normal** | Cacca marrone | 25 · 25 · 25 · 25 % (tuttofare) |
| **Liquid** (ex Runny) | Cacca gialla "colante" | 40 · 40 · 10 · 10 % (due statistiche forti) |
| **Fart** | Nuvoletta trasparente | 65 · 25 · 10 · 0 % (una statistica fortissima) |

- **Generazione**: il Merdomon nasce con totale − 1 (9 / 14 / 19) diviso **esattamente** secondo la curva; ogni quota va a una statistica scelta a caso. Poi il giocatore assegna il **+1** e si arriva a 10 / 15 / 20.
  - Arrotondamento: i punti avanzati vanno alle quote con la parte decimale più alta (a parità, alla quota più grande).
  - Ogni statistica è almeno 1 (il punto si toglie alla più alta) e al massimo 10 (l'eccesso passa alle quote successive).
  - Esempi (totale 20): Normal 5·5·5·5, Liquid 8·8·2·2, Fart 10·7·2·1. Small Merdomon alla nascita (9): Normal 3·2·2·2, Liquid 4·3·1·1, Fart 5·2·1·1.
- **HP** = vita massima. I danni **persistono** tra i round.
- **Tratti**: casuali tra i 7 disponibili (Action compreso), anche ripetuti — 1 (Small), 2 (Big), 3 (Huge).
- **Abilità**: 1, scelta dal giocatore tra **3 estratte a caso** (tutte diverse) nella stessa schermata del +1, poi *Confirm*. Valori fissi per tutte le grandezze (vedi §7b).
- Merdomon in squadra: massimo **3 / 4 / 5 / 6** secondo il Tier del **Toilet** (§9d).

## 6. Distraction-mon

- Stesse regole di generazione con totale **10 / 15 / 20** (Small / Big / Huge), senza +1 a scelta e senza tratti.

| Tipo | Aspetto | Ripartizione |
|---|---|---|
| **Smartphone** | Nero | 25 · 25 · 25 · 25 % |
| **Book** (Libro) | Verde | 40 · 40 · 10 · 10 % |
| **Console** | Rossa, stile Switch | 65 · 25 · 10 · 0 % |

- Nessuna abilità: le difficoltà extra arrivano dai modificatori delle wave (§9b).
- **Boss**: vedi §9c.

## 7. Tratti

Bonus a soglie in base al numero di occorrenze dello **stesso tratto** in squadra (Merdomon + oggetti; i doppioni sullo stesso Merdomon contano entrambi).

| Tratto | Simbolo | 2 | 4 | 6 | 8 | Effetto |
|---|---|---|---|---|---|---|
| **Paper** | 🧻 | 2 | 5 | 9 | 15 | TP a fine battaglia |
| **Stinky** (ex Merdon) | 💩 | 1 | 2 | 3 | 4 | Poop a fine battaglia |
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
| 🌱 **Fertilizer** | +1 Poop a fine wave se è sopravvissuto |
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
| Sturalavandini | **Plunger** (ex Toilet Brush) | 💩 Stinky | +2 Poop a fine wave |
| Rivista | **Magazine** | ❤️ Healthy | Il primo Merdomon che muore resuscita a vita piena (1 volta per combattimento) |
| Getto d'acqua | **Water Jet** (ex Bidet) | 🛡️ Defender | *Evacuate* dà anche +1 Concentration |
| Doccino | **Hand Shower** | 🧻 Paper | Shop, Flush e Bonus Action costano −2 TP |
| Finestra | **Window** | ⚡ Haste | Il primo Merdomon della squadra fa un doppio attacco al suo **primo** attacco del combattimento |
| Asciugamano | **Paper Towel** | 🥊 Fighter | +5 TP a fine wave |
| Spazzolino | **Toothbrush** | ◆ Action | +X HP a tutti i Merdomon per il combattimento, dove X = AP non spesi quando si preme Next Wave |
| Infradito | **Flip-Flops** | ◆ Action + ⚡ Haste | Un Merdomon con Velocità almeno doppia rispetto all'avversario attacca 2 volte a ogni turno (solo Merdomon) |
| Game Boy | **Game Boy** | 🧻 Paper + 💩 Stinky | 3 opzioni invece di 2 in Shop ed Evacuate |
| Asciugamano marrone | **Brown Towel** | 💩 Stinky | Merdomon Normal +1 HP e +1 ATK in combattimento |
| Asciugamano giallo | **Yellow Towel** | ❤️ Healthy | Merdomon Liquid +1 HP e +1 ATK in combattimento |
| Asciugamano bianco | **White Towel** | ⚡ Haste | Merdomon Fart +1 HP e +1 ATK in combattimento |
| Martello | **Hammer** | 🥊 Fighter | Ogni Build costa 15 TP, anche dal Tier 0 |

- **Regalo**: dopo la wave 5, vinta o persa, si sceglie **1 oggetto tra 3** casuali (non posseduti), gratis. Con la borsa piena si scarta un oggetto oppure si rinuncia (**Skip**).
- **Borsa**: il numero di oggetti è limitato dal **Sink** (§9d). Con la borsa piena, per comprare si sceglie un oggetto da **scartare**.

## 9. Flusso della run

1. Home → **New Game** → schermata di preparazione partita con due caroselli: in alto il **livello** (e quindi il Boss, §9c), in basso il **bagno** (§9g; quelli bloccati si sbloccano lì con i Toilet Points) → scelta di 1 tra 3 Merdomon **Small** → abilità (1 tra 3) e +1.
2. **Bonus di partenza**, uno a scelta tra:
   - un **oggetto** casuale;
   - un Merdomon **Small** casuale (poi abilità e +1);
   - un pacchetto **Supplies**: +5 TP, +3 Poop, +1 AP.
3. 10 round: ognuno è **Preparation → Combat → Esito**.
4. Fine: **Game Over** se Concentration = 0 (in qualunque momento), **Victory** se si sconfigge il Boss. Perdere la wave 10 = Game Over.

### Waves (livello 1)

| Wave | Nemici |
|---|---|
| 1 | 1 Small |
| 2 | 2 Small |
| 3 | 3 Small + 1 Big |
| 4 | 4 Small + 1 Big |
| 5 | 4 Small + **Boss** in forma media (Big, ultimo slot) |
| 6 | 3 Small + 2 Big |
| 7 | 3 Small + 3 Big |
| 8 | 2 Small + 4 Big |
| 9 | 6 Big |
| 10 | 5 Big + **Boss** in forma finale (Huge 22 punti, ultimo slot) |

Ordine dei nemici casuale (tranne il Boss).

### 9b. Modificatori delle wave

Le wave **3, 6 e 9** hanno un modificatore, estratto a inizio partita tra questi 6 (senza ripetizioni). È visibile sul tasto Next Wave e nel recap della wave.

| Modificatore | Effetto |
|---|---|
| 💬 **Group Chat** | Un nemico Small in più (tipo casuale) in testa alla fila |
| 📵 **Wi-Fi Down** | I bonus di combattimento dei tratti non valgono |
| ⏰ **Rush Hour** | I nemici colpiscono sempre per primi (la Window resta valida) |
| 📱 **Doomscrolling** | Ogni volta che cade un tuo Merdomon, tutti i nemici +1 ATK (si somma) |
| 🔕 **Silent Mode** | Le abilità dei Merdomon non si attivano |
| 🎰 **Jackpot** | Nemici +1 ATK e +1 HP, ma TP e Poop della wave raddoppiati |

- **Ricompensa**: se vinci una wave con il modificatore attivo, **+1 AP** nella preparazione del round successivo.
- **Corrupt**: nel recap che compare premendo Next Wave (o dallo Scout), per **3 TP** (senza sconto). Si perde anche la ricompensa.

### 9c. Boss

A inizio partita il giocatore sceglie il **livello di difficoltà**, che determina il Boss: **Livello 1 – The Bestseller**, **Livello 2 – The StreamDeck**, **Livello 3 – Demon Scroller** (per ora tutti selezionabili; in futuro da sbloccare). Ai livelli 2 e 3 ogni nemico normale ha anche **+1 / +2 punti statistica**. Ogni Boss dà **+1 ATK a tutti i nemici del suo tipo** per tutta la partita, e combatte due volte: in forma **media** alla wave 5 (Big, 15 punti) e in forma **finale** alla wave 10 (Huge, 22 punti). È sempre l'ultimo della fila.

| Boss | Tipo | Abilità (forma media) | Abilità (forma finale) |
|---|---|---|---|
| 📱 **Demon Scroller** | Smartphone | **Endless Feed**: +1 HP per ogni punto di Concentration perso finora nella partita | Uguale |
| 📚 **The Bestseller** | Book | **Plot Twist**: +1 DEF dopo ogni suo attacco | +1 DEF e +1 ATK dopo ogni suo attacco |
| 🎮 **The StreamDeck** | Console | **Extra Life**: torna in vita una volta con metà HP | Torna in vita una volta con tutti gli HP |

### 9d. Strutture del bagno

Sei blocchi nella parte bassa della schermata, come gli slot dei Merdomon: in alto **Shower, Sink, Bidet**; in basso **Toilet Brush, Toilet** (il water con il giocatore), **Paper Holder**. Il Tier di partenza dipende dal bagno (§9g), da **0** a **3**; si toccano per vedere l'effetto e potenziarle. Una struttura al **Tier 0** (non ancora costruita) è grigia e tratteggiata, ma dà comunque il suo limite minimo.

**Build**: 1 AP + **30 TP** dal Tier 0 al Tier 1, **20 TP** per gli altri Tier, fino al Tier 3. Con l'**Hammer** ogni Build costa 15 TP (+ 1 AP).

| Struttura | Limite (T0/T1/T2/T3) | Produzione dopo ogni combattimento (T0/T1/T2/T3) |
|---|---|---|
| **Shower** (Doccia) | Concentration massima 8 / 10 / 12 / 14 | +0 / +0 / +1 / +2 HP a tutti i Merdomon |
| **Sink** (Lavandino) | Oggetti 3 / 5 / 7 / 9 | +0 / +0 / +1 / +2 Action Point |
| **Bidet** | Poop 10 / 15 / 20 / 25 | +0 / +0 / +1 / +2 Concentration |
| **Toilet Brush** (Scopettone) | Action Point massimi 2 / 3 / 4 / 5 | 0 / 1 / 2 / 3 **Re-Roll gratuiti** per round (usati prima dei TP) |
| **Toilet** (Water) | Merdomon 3 / 4 / 5 / 6 | +0 / +1 / +2 / +3 Poop |
| **Paper Holder** (Porta carta) | Toilet Paper 30 / 40 / 50 / 60 | +0 / +2 / +5 / +8 TP |

### 9e. Punteggio finale

Mostrato a fine partita con il dettaglio. C'è un **record per ogni livello**, salvato nel browser. Il punteggio si aggiunge ai **Toilet Points** (§9g), sia in caso di vittoria sia di sconfitta.

### 9f. Statistiche

Schermata **Stats** dalla Home: riepilogo (partite, vittorie, record per livello) e lo storico delle **ultime 50 partite concluse** (quelle abbandonate non vengono salvate), dalla più recente, 6 per pagina. Ogni partita è una riga (icona del Boss, vinta o persa, livello, wave, punteggio, data) che toccata si espande con: bagno, dettaglio del punteggio, squadra finale, oggetti, Tier delle strutture, danni, Merdomon creati, TP e Poop prodotti.

| Voce | Punti |
|---|---|
| Wave vinta | 100 |
| Distrazione sconfitta | 10 |
| Wave con modificatore vinta senza Corrupt | 50 |
| Boss medio / finale sconfitto | 150 / 300 |
| Vittoria | 500 |
| Concentration rimasta | 30 per punto |
| Potenziamento di struttura costruito durante la partita | 25 |
| Poop prodotta (ricompense di fine wave e strutture) | 10 per punto |

### 9g. Tipi di bagno e Toilet Points

A inizio partita si sceglie il bagno: decide il **Tier di partenza delle strutture** e le risorse iniziali. Ogni bagno ha un colore distintivo sui blocchi delle strutture (grafica dedicata in futuro). I bagni si sbloccano con i **Toilet Points** dalla schermata **Toilets** (Home) o direttamente nella schermata di inizio partita.

| Bagno | Shower | Sink | Bidet | Toilet Brush | Toilet | Paper Holder | TP | Concentration | Poop | Costo |
|---|---|---|---|---|---|---|---|---|---|---|
| **Home Bathroom A** | 1 | 1 | 1 | 1 | 1 | 1 | 3 | 10 | 5 | gratis |
| **Home Bathroom B** | 0 | 1 | 2 | 1 | 2 | 0 | 0 | 8 | 3 | 3.000 |
| **Office Bathroom A** | 0 | 1 | 0 | 2 | 1 | 1 | 5 | 8 | 7 | gratis |
| **Office Bathroom B** | 0 | 0 | 0 | 1 | 1 | 2 | 5 | 6 | 10 | 5.000 |
| **Public Toilet A** | 0 | 0 | 0 | 0 | 3 | 3 | 0 | 5 | 10 | gratis |
| **Public Toilet B** | 0 | 1 | 1 | 0 | 2 | 0 | 10 | 6 | 12 | 10.000 |
| **Hotel Bathroom A** | 2 | 2 | 2 | 2 | 2 | 2 | 0 | 4 | 0 | 20.000 |
| **Hotel Bathroom B** | 3 | 3 | 3 | 3 | 3 | 3 | 0 | 1 | 0 | 40.000 |

Le risorse iniziali non superano il limite delle strutture. Per i test ogni giocatore parte con **200.000 Toilet Points**.

## 10. Preparation

### Azioni a costo AP (1 AP ciascuna)

| Azione | Nome | Effetto |
|---|---|---|
| Cura | **Heal** | Tutta la squadra a HP massimi |
| Evacuate | **Evacuate** | Spendi 5 / 10 / 20 Poop → appaiono **2 Merdomon** (3 con il Game Boy) Small / Big / Huge tra cui sceglierne 1, poi il +1. **Re-Roll** delle opzioni: 2 TP, illimitato. Bloccata se il Toilet è pieno. |
| Acquista | **Shop** | 10 TP → compri uno dei 3 oggetti in vendita |
| Concentrate | **Concentrate** | −2 Concentration → +4 Poop. Non usabile con Concentration ≤ 2. |
| Costruisci | **Build** | Potenzia una struttura: 1 AP + 30 TP dal Tier 0, 20 TP dopo (15 con l'Hammer) (§9d). |
| Scambio | **Trade** | A scelta: +2 Poop, +5 TP, oppure +1 a una statistica di un Merdomon (max 10). Sempre disponibile. |

### Azioni gratuite

| Azione | Nome | Costo | Effetto |
|---|---|---|---|
| Organize | **Organize** | – | Riordina la squadra |
| Flush | **Flush** | 5 TP | Elimina un Merdomon → +1 Concentration (fino al limite). Non sull'ultimo Merdomon. |
| Bonus Action | **Bonus Action** | 15 TP | +1 AP (fino al limite del Toilet Brush) |
| Scoreggia | **Farting** | 3 TP | +1 HP a un Merdomon ferito. Ripetibile, senza sconto dell'Hand Shower |
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

**Vittoria**: +Poop = Merdomon sopravvissuti.
**Sconfitta**: −Concentration = Distraction-mon sopravvissuti (nessun limite).

In entrambi i casi, poi:
1. +TP = danno totale inflitto ai Distraction-mon.
2. Bonus di tratti e oggetti di fine wave.
3. Dopo la wave 5: **regalo**, 1 oggetto tra 3 (§8).
4. I Merdomon morti tornano con **metà degli HP massimi** (arrotondata per eccesso).
5. Se Concentration = 0 → Game Over; altrimenti si passa alla Preparation successiva.

## 12. Schermate

- **Home**: Toilet Points in alto a destra; New Game, Continue, Tutorial, Stats, Toilets; numero di versione in basso.
- **Inizio partita**: carosello dei livelli (Boss) in alto e carosello dei bagni in basso, con Start o Unlock.
- **Toilets**: collezione dei bagni, 2 per pagina, con strutture, risorse iniziali e tasto Unlock.
- **Tutorial**: 20 pagine con icone e regole, con esempi presi dalla schermata principale.
- **Starter**: scelta tra 3 Merdomon Small, poi schermata abilità + +1 con Confirm.
- **Starting bonus**: scelta tra oggetto, Merdomon Small e Supplies.
- **Main / Preparation** (dall'alto verso il basso):
  - griglia 2×3 dei Merdomon, con il nome del tipo sul bordo di ogni carta;
  - bottoni **Preparation** e **Next Wave**, tra le due griglie;
  - griglia 2×3 del bagno con le strutture (§9d);
  - in alto: TP (sinistra), barra Concentration (centro), Poop (destra), con i limiti; sotto, "Round X/10", borsa oggetti (n/limite), Boss, "Actions ◆ /limite", poi i tratti. Gli slot oltre il limite del Toilet sono mostrati bloccati.
- **Preparation panel**: griglia di icone con il costo indicato (AP per le azioni costose, TP per le altre).
- **Merdomon detail**: popup con statistiche e tratti, a icone.
- **Combat**: prima una schermata "Bonuses" con il modificatore della wave, le abilità di inizio combattimento, i bonus attivi di tratti e oggetti e la squadra potenziata (si chiude toccando o dopo 2,6 secondi), poi animazione automatica con tasto ⏩.
- **Game Over / Victory**: punteggio con il dettaglio, record del livello e Toilet Points guadagnati.

## 13. Salvataggio

Salvataggio automatico nel browser all'inizio di ogni Preparation → tasto **Continue**. Toilet Points e bagni sbloccati restano salvati tra le partite.
