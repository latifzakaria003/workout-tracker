Progetto per l'esame di **Sviluppo di Applicazioni Web (SAW)**.

- **Autore:** Zakaria Latif
- **Matricola:** 657099
- **Appello:** 03/09/2026

---

# WorkoutTracker

WorkoutTracker è una Progressive Web App per la gestione degli allenamenti. Permette la creazione
di schede di allenamento e la loro generazione automatica secondo parametri scelti dall'utente, permette inoltre
l'avvio di sessioni di allenamento e il salvataggio dei risultati in uno storico consultabile.

---

## Demo online

L'applicazione è pubblicata su Firebase Hosting:

**https://workout-tracker-59e6e.web.app**

---

## Credenziali di test

| Campo    | Valore              |
| -------- | ------------------- |
| Email    | `sushi@gmail.com`   |
| Password | `sushisushi`        |

L'account è già popolato con schede di esempio e storico allenamenti, così da poter provare tutte
le funzionalità senza dover inserire dati manualmente. È comunque possibile registrare un nuovo
utente dalla schermata di login.

---

## Requisiti

- **Node.js** 20.19+ oppure 22.12+ (richiesto da Vite 8)
- **npm** 10 o superiore

Verificare le versioni installate con:

```bash
node -v
npm -v
```

---

## Installazione e avvio

1. **Clonare il repository**

   ```bash
   git clone https://github.com/latifzakaria003/workout-tracker.git
   cd workout-tracker
   ```

2. **Installare le dipendenze**

   ```bash
   npm install
   ```

3. **Configurare le variabili d'ambiente**

   Copiare nella cartella principale del progetto il file `.env` allegato alla mail di consegna.

   In alternativa, rinominare `.env.example` in `.env` e compilarlo con le credenziali di un
   proprio progetto Firebase.

4. **Avviare l'applicazione**

   ```bash
   npm run dev
   ```

   L'applicazione sarà disponibile all'indirizzo: http://localhost:5173

---

## Funzionalità principali

- **Autenticazione** dell'utente tramite Firebase Authentication (email/password).
- **Creazione e modifica di schede**: aggiunta esercizi, configurazione di serie, ripetizioni,
  carico e tempo di recupero.
- **Catalogo esercizi** con ricerca, immagini e descrizioni recuperate dall'API pubblica
  [wger](https://wger.de/en/software/api).
- **Generazione automatica di schede**: algoritmo che compone un allenamento a partire
  dall'obiettivo dell'utente, dall'equipaggiamento disponibile e dalle tempistiche indicate.
- **Sessione di allenamento** con cronometro del tempo totale, timer di recupero automatico al
  completamento di una serie e notifica al termine del recupero.
- **Riepilogo e salvataggio**: al termine viene salvato nello storico solo ciò che è stato
  effettivamente completato, con durata, titolo e descrizione.
- **Profilo utente** con calendario delle attività e storico degli allenamenti.
- **Supporto offline**: persistenza locale di Firestore, con sincronizzazione automatica al
  ripristino della connessione.
- **PWA installabile** su desktop e mobile.
- **Notifiche** di fine recupero tramite l'API Notifications e il service worker. (Non disponibili su IOS dove l'API non è 
  supportata dal browser)

---

## Stack tecnologico

| Ambito         | Stack                                                  |
| -------------- | ------------------------------------------------------ |
| Linguaggio     | TypeScript 6                                           |
| UI             | React 19                                               |
| Build tool     | Vite 8                                                 |
| Routing        | React Router 7 (`react-router-dom`)                    |
| Stato globale  | React Context API                                      |
| Backend / BaaS | Firebase 12 (Authentication + Cloud Firestore)         |
| Stili          | CSS Modules                                            |
| API esterne    | wger REST API                                          |
| Linting        | ESLint 10 + typescript-eslint                          |
| PWA            | vite-plugin-pwa + Service Worker                       |
| Hosting        | Firebase Hosting                                       |

---

## Struttura del progetto

```
workout-tracker/
├── public/                 # asset statici, manifest e icone della PWA
├── src/
│   ├── assets/             # hook e funzioni di utilità (timer, stato connessione, formattazione)
│   ├── components/         # componenti riutilizzabili (Navbar, ExerciseCard, ExerciseSelector, ...)
│   ├── contexts/           # Context API: catalogo esercizi e sessione di allenamento
│   ├── firebase/           # inizializzazione Firebase e configurazione Firestore
│   ├── pages/              # pagine associate alle rotte (Home, EditWorkout, Profile, History, ...)
│   ├── sw.js               # service worker personalizzato (strategia injectManifest)
│   ├── types.tsx           # definizioni dei tipi TypeScript condivisi
│   ├── App.tsx             # definizione delle rotte
│   └── main.tsx            # entry point: montaggio dell'app e Provider globali
├── firestore.rules         # regole di sicurezza di Cloud Firestore
├── firebase.json           # configurazione di Firebase Hosting
├── .firebaserc             # progetto Firebase associato
├── .env.example            # variabili d'ambiente richieste (senza valori reali)
├── offline.html            # pagina mostrata se l'app non è mai stata caricata
├── vite.config.ts            
└── package.json
```

---

## Organizzazione dei dati (Cloud Firestore)

| Collezione        | Contenuto                                        |
| ----------------- | ------------------------------------------------ |
| `workouts`        | Schede di allenamento e relativi esercizi        |
| `workoutsHistory` | Allenamenti completati e dati della sessione     |
| `users`           | Informazioni del profilo dell' utente            |

Ogni documento contiene il campo `userId`, cioè l'identificativo dell'utente proprietario.

Le regole di sicurezza consentono lettura e scrittura esclusivamente all'utente autenticato
proprietario del documento. Sono pubblicate sul progetto Firebase e riportate, a scopo di
consultazione, nel file `firestore.rules` nella cartella principale del repository.

---

## Variabili d'ambiente

Il file `.env` deve trovarsi nella cartella principale del progetto e contenere:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Tutte le variabili devono avere il prefisso `VITE_` per essere esposte al client da Vite.
Il file non è versionato ed è escluso tramite `.gitignore`; nel repository è presente
`.env.example` con i nomi delle variabili richieste.

---

## Build di produzione

```bash
npm run build     # compila TypeScript e genera la cartella dist/
npm run preview   # serve localmente la build di produzione
```

L'installazione come PWA e il Service Worker sono attivi solo sulla build di produzione servita
in HTTPS (o su `localhost`), non in modalità sviluppo.

---

## Deploy

L'applicazione è pubblicata su Firebase Hosting. Per aggiornare la versione online:

```bash
npm run build
firebase deploy --only hosting
```

---

## Installazione come applicazione (PWA)

- **Desktop (Chrome/Edge):** icona di installazione nella barra degli indirizzi.
- **Android (Chrome):** menu ⋮ → *Installa app*.
- **iOS (Safari):** Condividi → *Aggiungi a Home*.

Una volta installata, l'applicazione resta consultabile anche senza connessione: le schede già
caricate rimangono disponibili e le modifiche effettuate offline vengono sincronizzate
automaticamente al ritorno della rete.

---

## Note implementative

- **Stato della sessione derivato dai timestamp.** La fase dell'allenamento (non iniziato / in
  corso / da salvare) non è memorizzata in una variabile dedicata, ma calcolata dai campi
  `startedAt` e `finishedAt`. Anche i tempi mostrati (cronometro e recupero) sono differenze tra
  istanti e non contatori, così da garantire valori corretti anche dopo la chiusura e la
  riapertura dell'applicazione.
- **Sessione unica.** È possibile avere un solo allenamento attivo alla volta: se se ne apre un
  altro, l'interfaccia segnala la presenza di una sessione già in corso e non permette di
  iniziarne una nuova.
- **Salvataggio non bloccante.** La scrittura nello storico non attende la conferma del server,
  in modo da funzionare anche offline sfruttando la coda di sincronizzazione di Firestore.
- **Routing lato client.** Firebase Hosting è configurato in modalità single-page application:
  tutte le richieste vengono reindirizzate a `index.html`, lasciando la gestione delle rotte a
  React Router.
- **Notifiche locali.** L'avviso di fine recupero è generato dal client tramite `showNotification` sul 
  service worker, il permesso viene richiesto all'avvio della sessione.