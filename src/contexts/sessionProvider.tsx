import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { WorkoutSession } from "../types";
import { SessionContext, emptySession, STORAGE_KEY } from "./sessionContext";

// recupera i dati dalla sessione
const readStoredSession = (): WorkoutSession => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY); // leggo dal Local Storage 
        if (!raw) return emptySession;  // non ho sessioni salvate

        const parsed = JSON.parse(raw) as Partial<WorkoutSession>; // trasformo il json in WorkoutSession
        if (typeof parsed?.startedAt === "undefined") return emptySession; // se non c'è startedAt la sessione non è mai iniziata

        return { ...emptySession, ...parsed };
    } catch (err) {
        console.error("Unreadable session, discarded.", err);
        return emptySession;
    }
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<WorkoutSession>(readStoredSession);

    useEffect(() => {
        try {
            if (session.startedAt !== null) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); // scrivo sul Local Storage
            } else {
                localStorage.removeItem(STORAGE_KEY); // rimuovo i dati della vecchia sessione
            }
        } catch (err) {
            console.error(err);
        }
    }, [session]);

    const clearSession = () => setSession(emptySession);

    return (
        <SessionContext.Provider value={{ session, setSession, clearSession }}>
            {children}
        </SessionContext.Provider>
    );
};