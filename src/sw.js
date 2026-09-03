const VERSION = "v1";

// creo 4 cache
const PRECACHE = `precache-${VERSION}`;       // file statici
const RUNTIME = `runtime-${VERSION}`;         // risorse scoperte navigando
const WGER_API = `wger-api-${VERSION}`;       // dati wger
const WGER_MEDIA = `wger-media-${VERSION}`;   // media wger

const CURRENT_CACHES = [PRECACHE, RUNTIME, WGER_API, WGER_MEDIA];

const OFFLINE_URL = "/offline.html";

// recupero file generati da Vite 
const buildAssets = self.__WB_MANIFEST || [];

const PRECACHE_URLS = [
    ...new Set([
        "/",
        OFFLINE_URL,
        ...buildAssets.map((entry) => entry.url),
    ]),
];

// non intercetto perché sono host con cui Firebase interagisce 
const SKIP_HOSTS = [
    "googleapis.com",
    "firebaseio.com",
    "firebaseinstallations.googleapis.com",
];

// fase di installazione
self.addEventListener("install", (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(PRECACHE);
        // riempio la cache
        const results = await Promise.allSettled(
            PRECACHE_URLS.map((url) =>
                cache.add(new Request(url, { cache: "reload" })) // ignoro cache del browser e prendo file dal server
            )
        );
        // mostro errori a console
        results.forEach((result, i) => {
            if (result.status === "rejected") {
                console.error("Precache fallito:", PRECACHE_URLS[i], result.reason);
            }
        });
        // non metto il sw in attesa
        await self.skipWaiting();
    })());
});

// fase di attivazione
self.addEventListener("activate", (event) => {
    event.waitUntil(
        // filtro rimuovendo vecchie versioni
        caches.keys()
            .then((names) => Promise.all(
                names
                    .filter((name) => !CURRENT_CACHES.includes(name))
                    .map((name) => caches.delete(name)) // elimino dalla cache le vecchie versioni
            ))
            .then(() => self.clients.claim()) // prendo il controllo delle schede aperte
    );
});

// STRATEGIE DI CACHING

const cacheFirst = async (request, cacheName) => {
    const cached = await caches.match(request, {
        ignoreVary: true    // evito problemi causati dall'header
    });

    if (cached) return cached;

    try {
        // non in cache
        const response = await fetch(request);

        // lo metto in cache
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }

        return response;
    } catch (err) {
        // Offline e non in cache
        console.warn("Non disponibile offline:", request.url);
        return Response.error();
    }
};

const staleWhileRevalidate = async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const network = fetch(request)
        .then((response) => {
            // prendo dalla rete
            if (response.ok) cache.put(request, response.clone());
            return response;
        })
        .catch(() => {
            // prendo da cache
            if (cached) return cached;
            console.warn("Non disponibile offline:", request.url);
            return Response.error();
        });
    // restituisco il file in cache e cerco in rete in background
    return cached || network;
};

const networkFirst = async (request) => {
    try {
        // cerco di prendere la pagina dalla rete
        const response = await fetch(request);

        if (response.ok) {
            const cache = await caches.open(PRECACHE);
            cache.put("/index.html", response.clone());
        }

        return response;
    } catch {
        // cerco in cache se c'è index.html per avviare React 
        const cachedApp = await caches.match("/index.html", { ignoreVary: true });
        if (cachedApp) return cachedApp;

        // mostro la pagina offline
        const offlinePage = await caches.match(OFFLINE_URL, { ignoreVary: true });
        if (offlinePage) return offlinePage;

        // non ho pagina offline 
        return new Response("Offline", { status: 503 });
    }
};

// fase di fetching
self.addEventListener("fetch", (event) => {
    const request = event.request;

    if (request.method !== "GET") return; // non mi occupo di richieste diverse da GET

    const url = new URL(request.url); // trasformo in oggetto URL 

    // salto gli host che interagiscono con Firebase
    if (SKIP_HOSTS.some((host) => url.hostname.endsWith(host))) return;

    // navigazione
    if (request.mode === "navigate") {
        // network first
        event.respondWith(networkFirst(request));
        return;
    }

    // risorse wger
    if (url.hostname === "wger.de") {
        // cache first
        if (url.pathname.startsWith("/media/")) {
            // media restituiti da wger
            event.respondWith(cacheFirst(request, WGER_MEDIA));
        } else {
            // stale while revalidate
            if (url.pathname.startsWith("/api/")) {
                // dati restituiti da wger
                event.respondWith(staleWhileRevalidate(request, WGER_API));
            }
        }
        return;
    }
    // risorse richieste dal browser all'app
    if (url.origin === self.location.origin) {
        event.respondWith(cacheFirst(request, RUNTIME));
    }
});

// gestione notifiche
self.addEventListener("notificationclick", (event) => {
    event.notification.close(); // chiudo la notifica dopo il click

    event.waitUntil((async () => {
        const clientList = await self.clients.matchAll({
            type: "window",
            includeUncontrolled: true, // includo anche pagine non controllate dal service worker
        });

        for (const client of clientList) {
            if ("focus" in client) return client.focus(); // porto in primo piano
        }

        // apre la pagina principale se non ci sono finestre da mettere in primo piano
        if (self.clients.openWindow) return self.clients.openWindow("/");
    })());
});