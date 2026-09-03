import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { WorkoutSession } from "../types";

export const STORAGE_KEY = "workoutTracker.session"; // chiave nel Local Storage

// sessione vuota
export const emptySession: WorkoutSession = {
    workoutId: "",
    title: "",
    restEndsAt: null,
    startedAt: null,
    finishedAt: null,
    description: "",
    completed: [],
};

export interface SessionContextValue {
    session: WorkoutSession;
    setSession: Dispatch<SetStateAction<WorkoutSession>>; // modifica la sessione
    clearSession: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export const useSession = () => {
    const context = useContext(SessionContext);

    if (!context) {
        throw new Error("useSession was called outside of <SessionProvider>");
    }

    return context;
};