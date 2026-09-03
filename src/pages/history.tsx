import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useEffect, useState } from "react";
import type { HistoryProps, HistoryExercises, Exercises } from "../types";
import { ExerciseCard } from "../components/exerciseCard";
import { formatTime } from "../assets/time";
import styles from "./history.module.css";
import { Navbar } from "../components/navbar";
import { useAuthState } from "react-firebase-hooks/auth";
import { useParams } from "react-router-dom";
import { dateKey } from "../assets/time";

export const History = () => {

    const { date } = useParams();
    const [history, setHistory] = useState<HistoryExercises[]>([]); // lista di workout passati
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [user, userLoading] = useAuthState(auth);

    const getHistory = async () => {
        if (!user) return;

        setError("");

        try {
            const snapshot = await getDocs(query(
                collection(db, "workoutsHistory"),
                where("userId", "==", user.uid),
            ));

            const historyList: HistoryExercises[] = snapshot.docs.map((docSnap) => {
                const workout = docSnap.data() as HistoryProps;
                // copio l'array perché sort modifica in-place
                const exercises: Exercises[] = [...(workout.exercises ?? [])]
                    .map((exercise) => ({ ...exercise, docId: docSnap.id }))
                    .sort((a, b) => a.exerciseOrder - b.exerciseOrder);

                return {
                    docId: docSnap.id,
                    date: workout.date,
                    duration: workout.duration,
                    title: workout.title,
                    description: workout.description,
                    exercises,
                };
            });
            historyList.sort((a, b) => b.date.seconds - a.date.seconds);

            setHistory(historyList);
        } catch (err) {
            console.error(err);
            setError("Could not load your history.");
        } finally {
            setLoading(false);
        }
    };

    const deleteHistory = async (id: string, title: string) => {
        if (!window.confirm(`are you sure you want to delete "${title || "this workout"}"?`)) return;

        // rimuovo subito dalla lista 
        setHistory((prev) => prev.filter((w) => w.docId !== id));

        // rimuovo da firestore
        deleteDoc(doc(db, "workoutsHistory", id))
            .catch((err) => console.error("Sincronizzazione fallita:", err));
    };

    useEffect(() => {
        if (!user) return;
        getHistory();
    }, [user?.uid]);

    if (userLoading || loading) {
        return (
            <>
                <Navbar />
                <div className={styles.page}>
                    <p className={styles.state}>Loading…</p>
                </div>
            </>
        );
    }

    const visibleHistory = date
        ? history.filter(h => dateKey(h.date.toDate()) === date)
        : history;

    return (
        <>
            <Navbar />

            <div className={styles.page}>
                {error && <p className={styles.state} role="alert">{error}</p>}

                {!error && visibleHistory.length === 0 ? (
                    <p className={styles.empty}>No workouts completed yet.</p>
                ) : (
                    visibleHistory.map((field) => (
                        <div key={field.docId} className={styles.historyCard}>
                            <button
                                className={styles.deleteButton}
                                onClick={() => deleteHistory(field.docId, field.title)}
                                aria-label="Delete workout"
                            >
                                X
                            </button>

                            <div className={styles.header}>
                                <div>
                                    <h1 className={styles.title}>
                                        {field.title || "Untitled workout"}
                                    </h1>
                                    <p className={styles.date}>
                                        {field.date.toDate().toLocaleDateString("it-IT")}
                                    </p>
                                </div>

                                <span className={styles.duration}>
                                    {formatTime(field.duration)}
                                </span>
                            </div>

                            {field.description && (
                                <p className={styles.description}>{field.description}</p>
                            )}

                            <div className={styles.exercises}>
                                {field.exercises.map((exercise) => (
                                    <ExerciseCard
                                        key={exercise.id}
                                        exercise={exercise}
                                        isEditable={false}
                                        isDone={false}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
};
