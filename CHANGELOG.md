# Changelog

## v0.11

### Nuove funzioni
- **Livello 4 – 🔧 The Plumber** (tipo Console, nemici +3 punti statistica):
  - per tutta la partita, *Water Shut-Off*: Shower e Bidet spenti (Tier 0, non costruibili);
  - wave 5, *Knock Knock*: −1 Concentration all'inizio del combattimento;
  - wave 10, *Pipe Burst*: −2 Concentration e il suo primo attacco colpisce 2 volte.
- **Livello 5 – 📲 The Group Admin** (tipo Smartphone, nemici +4 punti statistica):
  - per tutta la partita, *Muted*: il tratto più presente non dà bonus;
  - dalla wave 5, *Pinned Message*: l'ultimo slot delle Merdomon è bloccato e chi c'è resta in panchina;
  - wave 10, *@everyone*: 2 slot bloccati e un nemico Small in più.
- Disegni dedicati per i due nuovi Boss.
- **Livelli da sbloccare**: si parte dal livello 1; vincere un livello sblocca il successivo. Le vittorie già nello storico valgono, e la password Testing Privilege sblocca tutto.
- **Ricompensa per livello**: i Toilet Points guadagnati sono lo score × 1 / 1,1 / 1,25 / 1,5 / 2. Lo score resta invariato.
- Rules: la pagina "Levels & Bosses" è divisa in due, con i sabotaggi spiegati.

## v0.10

### Nuove funzioni
- **Tutorial Game**: una partita guidata di 2 round, con tasto in Home sotto New Game.
  - Percorso obbligato: lo schermo si oscura tranne l'elemento da usare, con un fumetto che spiega.
  - Round 1: starter, abilità e +1, bonus di partenza, Concentration, TP e Poop, Action Points, Evacuate, tratti, ordine della squadra trascinando, Next Wave e combattimento.
  - Round 2: il bagno, Shop, Build, tasto Bonus e secondo combattimento.
  - Wave facili, sempre vinte. **Skip tutorial** sempre disponibile.
  - Alla fine **+500 Toilet Points**, solo la prima volta.
  - Non viene salvato e non entra nello storico. Su GoatCounter si vedono inizio, completamento e abbandono.
- Il vecchio Tutorial (le pagine con le regole) si chiama ora **Rules**.

## v0.9

### Punteggio
- Nuova formula: conta solo quello che si fa durante la partita, **vincere non dà punti**.
  - Distrazioni sconfitte: Small 10, Big 15, Boss medio 20, Boss finale 30.
  - Merdomon creati: Small 10, Big 15, Huge 20.
  - Oggetti ottenuti: 10.
  - Potenziamenti delle strutture: 10 per Tier.
  - Poop prodotta: 10.
  - Toilet Paper guadagnata (tutta): 1.
  - Concentration rimasta: 10.
- Eliminate le voci wave vinte, wave con modificatore, Boss medio, Boss finale e vittoria.
- **Record per livello azzerati**. Storico partite e Toilet Points restano.

### Bilanciamento
- Costi dei bagni riscalati sul nuovo punteggio: Office B e Public A 2.000, Public B 4.000, Home A 6.000, Home B 10.000, Hotel A 15.000, Hotel B 30.000.

### Interfaccia
- **Badge sulle strutture**: sotto il nome di ogni blocco, il limite e la produzione per wave.
- Nuovo tasto **Bonus** accanto a Next Wave: tutto quello che si ottiene dopo la wave, con la sua origine.
- **Ordine della squadra trascinando** le Merdomon direttamente nella schermata principale.
- Rimossi i tasti **Organize** e **Scout** (il recap della wave è già in Next Wave).

> I salvataggi della v0.8 non sono compatibili: il tasto Continue li ignora.

## v0.8

### Nuove funzioni
- **Statistiche di gioco anonime** con GoatCounter (senza cookie e senza dati personali), dashboard su https://fabiunes.goatcounter.com:
  - visite al gioco;
  - partite iniziate, per livello e bagno;
  - partite finite, vinte o perse, con la wave della sconfitta e la fascia di punteggio;
  - bagni sbloccati e uso della password Testing Privilege.
- Nella Home, sotto la versione, l'avviso "anonymous play stats, no personal data".

## v0.7

### Bilanciamento
- **Bagni** ordinati dal più debole al più forte: Office → Public → Home → Hotel (schermata Toilets e inizio partita).
- Nuovi valori dei bagni:
  - **Office A** (gratis, ora il bagno di default): Sink, Toilet Brush, Toilet e Paper Holder al Tier 1; 5 TP, 8 Concentration, 5 Poop;
  - **Office B** (5.000): Toilet T1, Paper Holder T3;
  - **Public A** (ora 5.000) e **Public B** (10.000): stesse strutture e risorse;
  - **Home A** (ora 15.000): tutto al Tier 1;
  - **Home B** (ora 30.000);
  - **Hotel A** (ora 40.000) e **Hotel B** (ora 100.000).
- **Costi del Build** per Tier: 20 TP per il Tier 1, 25 TP per il Tier 2, 30 TP per il Tier 3 (sempre + 1 AP). L'Hammer resta a 15 TP fissi.
- Si parte con **0 Toilet Points** (prima 200.000 per i test). Chi ha già punti o bagni sbloccati li tiene.

### Nuove funzioni
- **Testing Privilege**: 5ª pagina della schermata Toilets. Il tasto **Unlock All Toilet** chiede la password e, se è giusta, sblocca tutti i bagni.

## v0.6

### Nuove funzioni
- **Tipi di bagno**: 8 bagni (Home, Office, Public e Hotel, versioni A e B). Ognuno ha:
  - il Tier di partenza delle 6 strutture;
  - TP, Concentration e Poop iniziali;
  - un colore distintivo sui blocchi.
- **Nuova schermata di inizio partita**: carosello dei livelli (Boss) in alto e carosello dei bagni in basso.
- **Toilet Points**: valuta permanente, mostrata in alto a destra nella Home.
  - Il punteggio di ogni partita conclusa si aggiunge ai Toilet Points.
  - Servono a sbloccare i bagni, dalla schermata **Toilets** (ora attiva) o all'inizio della partita.
  - Per i test si parte con 200.000 Toilet Points.
- **Tier 0**: una struttura non ancora costruita è grigia e tratteggiata, ma dà comunque il suo limite minimo.
- **Regalo dopo la wave 5**, vinta o persa: un oggetto gratis a scelta tra 3. Con la borsa piena si scarta un oggetto oppure si rinuncia.
- **Farting** (azione gratuita): 3 TP per +1 HP a un Merdomon ferito. Si può ripetere e non ha lo sconto dell'Hand Shower.
- **Nuovo oggetto Hammer** (Fighter): ogni Build costa 15 TP, anche dal Tier 0.

### Modifiche alle regole
- Strutture con 4 Tier (0–3). Limiti T0/T1/T2/T3:
  - Shower: Concentration 8/10/12/14;
  - Sink: oggetti 3/5/7/9;
  - Bidet: Poop 10/15/20/25;
  - Toilet Brush: AP 2/3/4/5;
  - Toilet: Merdomon 3/4/5/6;
  - Paper Holder: TP 30/40/50/60.
- Nuove produzioni: Toilet Brush 0/1/2/3 Re-Roll gratuiti, Toilet 0/1/2/3 Poop, Paper Holder 0/2/5/8 TP. Shower, Sink e Bidet producono dal Tier 2 come prima.
- **Build**: 30 TP + 1 AP dal Tier 0 al Tier 1, 20 TP + 1 AP per gli altri Tier.
- La **wave 2** ha 2 Small (prima 3).
- Punteggio: la voce "Structure upgrades" conta solo i potenziamenti costruiti durante la partita.

> I salvataggi della v0.5 non sono compatibili: il tasto Continue li ignora. Storico e record restano.

## v0.5

### Grafica e impaginazione
- Nuova schermata principale:
  - griglia dei Merdomon in alto;
  - **Preparation** e **Next Wave** al centro;
  - sotto, la **griglia del bagno** con 6 blocchi: Shower, Sink, Bidet / Toilet Brush, Toilet, Paper Holder.
- Disegni nuovi per **Shower**, **Toilet Brush** e il **water** con il giocatore, adattati ai blocchi.
- Il nome del tipo (Normal, Liquid, Fart) compare sul bordo in alto di ogni carta.
- Carte dei Merdomon più compatte, così le due griglie stanno anche su schermi piccoli.

### Nuove funzioni
- **Livelli di difficoltà**: a inizio partita scegli il livello, e quindi il Boss.
  - Livello 1: The Bestseller.
  - Livello 2: The StreamDeck, nemici +1 punto statistica.
  - Livello 3: Demon Scroller, nemici +2 punti statistica.
- **Stats**: storico delle ultime 50 partite concluse, con riepilogo e record per livello. Ogni partita si espande con i dettagli.
- **Record per livello** nella schermata finale.
- 2 nuove strutture:
  - **Shower**: Concentration massima 10/12/14 e cura +0/+1/+2 HP a tutti dopo ogni wave;
  - **Toilet Brush**: Action Point massimi 2/3/4 e 0/2/4 Re-Roll gratuiti per round.

### Modifiche alle regole
- Gli Action Point accumulabili ora dipendono dal Toilet Brush: **2** al Tier 1 (prima erano 5).
- L'oggetto Toilet Brush si chiama ora **Plunger**, con lo stesso effetto.
- Nella Home, "Upgrade" diventa **Toilets** (in arrivo).

> I salvataggi della v0.4 non sono compatibili: il tasto Continue li ignora. Il record della v0.4 non viene trasferito ai record per livello.

## v0.4

### Nuove funzioni
- **Strutture del bagno** (in basso nella schermata, toccabili): **Sink**, **Bidet**, **Paper Holder** e **Toilet**, dal Tier 1 al Tier 3.
  - Decidono quanto puoi tenere: oggetti 3/6/9, Poop 15/20/30, Toilet Paper 30/50/70, Merdomon 4/5/6.
  - Dal Tier 2 producono qualcosa dopo ogni combattimento (AP, Concentration, TP, Poop).
  - Si potenziano con la nuova azione **Build** (20 TP + 1 AP per Tier).
- **3 Boss** (Demon Scroller, The Bestseller, The StreamDeck): rivelato a inizio partita, dà +1 ATK ai nemici del suo tipo e combatte in forma media alla wave 5 e in forma finale alla wave 10, con un'abilità propria.
- **Next Wave** apre il recap della wave in arrivo, con **Corrupt** (disattiva il modificatore per 3 TP) e **Fight**.
- **Punteggio finale** con il dettaglio delle voci e **record** salvato (mostrato nella Home).
- **3 nuovi oggetti**: Brown Towel, Yellow Towel e White Towel (+1 HP e +1 ATK ai Merdomon Normal, Liquid o Fart).
- **Borsa degli oggetti**: con la borsa piena, per comprare si sceglie un oggetto da scartare.
- Tutorial con nuove pagine: **Your bathroom**, **Bosses**, Items divisa in 2.

### Modifiche alle regole
- Gli **Action Point non spesi si accumulano** (massimo 5).
- Il **Bonus Action** costa 15 TP.
- Nessun limite alla Concentration persa in una wave.
- Modificatori delle wave solo sulle wave **3, 6 e 9** (alla wave 10 c'è il Boss).
- La wave 5 ora ha 4 Small e il Boss in forma media.

### Nomi
- Il gioco si chiama **D.o.t.T.** (Defense of the Toilet).
- Merdascore → **Poop**, Runny → **Liquid**, tratto Merdon → **Stinky**, oggetto Bidet → **Water Jet**, Towel → **Paper Towel**.

> I salvataggi della v0.3 non sono compatibili: il tasto Continue li ignora.

## v0.3

### Nuove funzioni
- **15 abilità dei Merdomon**: ogni nuovo Merdomon (starter, Evacuate, bonus di partenza) sceglie **1 abilità tra 3** nella stessa schermata del +1, poi *Confirm*. Cheerleader, Frontliner, Rear Guard, Thick Skin, Spiky, Splash, Giant Slayer, Snowball, Leech, Second Wind, Last Gasp, Legacy, Collector, Fertilizer, Stinky Aura. Valori fissi per tutte le grandezze.
- **Modificatori delle wave** sulle wave 3, 6, 9 e 10: Group Chat, Wi-Fi Down, Rush Hour, Doomscrolling, Silent Mode, Jackpot.
  - Vincere una wave con il modificatore attivo dà **+1 AP** nel round successivo.
  - Si può disattivare per **3 TP** (perdendo la ricompensa), tranne alla wave 10.
- **Bonus di partenza**: dopo lo starter scegli tra un oggetto casuale, un Merdomon Small casuale o un pacchetto Supplies (+5 TP, +3 Merdascore, +1 AP nel round 1).
- In combattimento compaiono **fumetti** quando un'abilità si attiva; la schermata Bonuses mostra anche modificatore e abilità di inizio combattimento.
- Tutorial: nuove pagine **Starting a run**, **Abilities (1/2, 2/2)** e **Wave modifiers**.

### Modifiche alle regole
- Nuove curve delle statistiche, uguali per Merdomon e nemici:
  - Normal / Smartphone **25·25·25·25** (tuttofare);
  - Runny / Book **40·40·10·10** (due statistiche forti);
  - Fart / Console **65·25·10·0** (una statistica fortissima).
- Si parte con **2 TP** e 5 Merdascore.
- Un nemico Small in più nelle **wave 2, 3 e 4**.

> I salvataggi della v0.2 non sono compatibili: il tasto Continue li ignora.

## v0.2

### Nuove funzioni
- **Grandezze** Small ★ / Big ★★ / Huge ★★★ (al posto di Common / Rare / Epic): totale statistiche 10 / 15 / 20, e il disegno cresce con la grandezza.
- **Tipi di Merdomon**, ognuno con grafica e colore propri: **Normal** (marrone, 30·30·20·20%), **Runny** (gialla, 40·30·20·10%), **Fart** (nuvoletta trasparente, 60·30·10·0%). La quota più alta va a una statistica casuale.
- **Tipi di Distraction-mon**: **Smartphone** (nero), **Book** (verde), **Console** (rossa), con le stesse tre curve.
- **Evacuate**: appaiono 2 Merdomon tra cui sceglierne 1.
- **Re-Roll** (2 Toilet Paper, illimitato) delle opzioni in Evacuate e nello Shop.
- **Schermata dei bonus** a inizio combattimento: mostra cosa danno tratti e oggetti e le statistiche potenziate della squadra.
- **Colori delle statistiche** a fasce (scala "loot"): 1–2 grigio, 3–4 verde, 5–6 blu, 7–8 viola, 9–10 arancione.
- Nuovo oggetto **Flip-Flops** (Action + Haste): un Merdomon con Velocità almeno doppia rispetto all'avversario colpisce 2 volte a ogni turno.
- Nuovo oggetto **Game Boy** (Paper + Merdon): 3 opzioni invece di 2 in Shop ed Evacuate.
- Tutorial: nuova pagina **Types**; tutte le pagine aggiornate.

### Modifiche alle regole
- I nemici sono più forti: 10 / 15 / 20 punti statistica (prima 9 / 12 / 19).
- **Velocità**: torna a decidere solo chi colpisce per primo. Il doppio colpo esiste solo con le Flip-Flops.
- Lo **Shop** mostra 2 oggetti (3 con il Game Boy).
- Alcuni oggetti hanno 2 tratti, e li contano entrambi.

### Interfaccia
- In alto: "Round X/10" a sinistra, oggetti al centro, etichetta **Actions ◆** a destra.

> I salvataggi della v0.1 non sono compatibili: il tasto Continue li ignora.

## v0.1

### Nuove funzioni
- **Trade** (1 AP): scambia un Action Point con +2 Merdascore, +5 Toilet Paper oppure +1 a una statistica di un Merdomon. Sostituisce l'Upgrade a pagamento.
- **Scout**: nuova azione gratuita che mostra le statistiche dei nemici in arrivo, nell'ordine di combattimento.
- **Tratto Action** (◆): +1/+1/+2/+2 Action Point a ogni round con 2/4/6/8 tratti.
- **Toothbrush** (Spazzolino), tratto Action: +1 HP a tutti i Merdomon in combattimento per ogni AP non speso.
- **Shop casuale**: a ogni round sono in vendita 3 oggetti estratti tra quelli non ancora posseduti.
- Numero di versione nella Home.

### Modifiche alle regole
- Si parte con **5 Toilet Paper e 5 Merdascore**.
- **Difesa**: danno = ATK − metà DEF (arrotondata per difetto), minimo 1.
- **Velocità**: con SPD almeno doppia rispetto all'avversario si colpisce 2 volte a ogni turno.
- Una wave persa costa **al massimo 3** Concentration.
- I Merdomon caduti tornano con **metà degli HP** invece di 1.
- I nemici Rari hanno **8** punti extra invece di 10, quindi le wave dalla 3 in poi sono più facili.
- Gli Action Point non spesi si perdono dopo il combattimento.
- **Hand Shower**: ora −2 Toilet Paper su Shop, Flush e Bonus Action.

### Interfaccia
- Il tasto "Action" diventa **Preparation**.
- Etichetta **Round X/10**, per non confonderla con gli Action Point.
- Nuova icona dell'attacco: un **guantone da boxe**.
- Tutorial aggiornato con le nuove regole.

> I salvataggi della v0.0 non sono compatibili: il tasto Continue li ignora.

## v0.0

Prima versione giocabile: run completa di 10 wave, combattimento animato, salvataggio automatico, tutorial.
