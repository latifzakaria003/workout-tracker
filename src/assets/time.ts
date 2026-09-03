import { useEffect, useState } from "react";

export const useNow = (running: boolean) => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!running) return;

        // aggiorno subito now
        setNow(Date.now());
        // aggiorno ogni secondo
        const interval = setInterval(() => setNow(Date.now()), 1000);
        // termino il timer al cambio di running
        return () => clearInterval(interval);
    }, [running]);

    return now;
};

export const formatTime = (totalSeconds: number) => {
    const s = Math.max(0, totalSeconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;

    return h > 0
        ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
        : `${m}:${String(sec).padStart(2, "0")}`;
};

// "yyyy-mm-dd" come lo da <input type="data">
export const dateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;