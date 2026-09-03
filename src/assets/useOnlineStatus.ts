import { useEffect, useState } from "react";
const PING_URL = "/ping";

// Oltre questa soglia consideriamo la rete non raggiungibile.
const PING_TIMEOUT_MS = 3000;

export const useOnlineStatus = (): boolean => {
    const [online, setOnline] = useState(() => navigator.onLine);

    useEffect(() => {
        let cancelled = false; // evita di modificare lo stato dopo che il componente è stato smontato

        const check = async () => {
            // il browser dice che sono offline
            if (!navigator.onLine) {
                if (!cancelled) setOnline(false);
                return;
            }

            // il browser dice che sono connesso ad una rete
            try {
                // mando un ping per capire se il server è effetivamente raggiungibile
                await fetch(`${PING_URL}?t=${Date.now()}`, {
                    method: "HEAD",
                    cache: "no-store",
                    signal: AbortSignal.timeout(PING_TIMEOUT_MS),
                });
                // qualsiasi risposta dimostra che il server è stato raggiunto
                if (!cancelled) setOnline(true);
            } catch {
                // errore di rete o timeout scaduto -> offline
                if (!cancelled) setOnline(false);
            }
        };

        void check();

        // l'evento "online" non garantisce che lo sia quindi riverifico
        const handleOnline = () => {
            void check();
        };
        const handleOffline = () => setOnline(false);

        // dopo che lascio l'app in background la connettività può essere cambiata quindi ricontrollo
        const handleVisibility = () => {
            if (document.visibilityState === "visible") void check();
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            cancelled = true;
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);

    return online;
};