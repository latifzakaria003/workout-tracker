import { ExerciseCard } from '../components/exerciseCard';
import { ExerciseSelector } from '../components/exerciseSelector';
import { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, doc, getDoc, Timestamp, getDocs, where, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import type { Exercises, Workout, Sets } from '../types';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Navbar } from '../components/navbar';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession, emptySession } from '../contexts/sessionContext';
import { useNow, formatTime } from '../assets/time';
import styles from './editWorkout.module.css';
import { useOnlineStatus } from '../assets/useOnlineStatus';

export const EditWorkout = () => {
    const { id } = useParams(); // document Id
    const { session, setSession, clearSession } = useSession(); // Context per gestione della sessione di allenamento

    const [user] = useAuthState(auth);
    const [docId, setDocId] = useState("");
    const [exercises, setExercises] = useState<Exercises[]>([]); // lista di esercizi
    const [newName, setNewName] = useState("");
    const [searching, setSearching] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [addedSomething, setAddedSomething] = useState(false);

    const online = useOnlineStatus(); // stato connessione
    const navigate = useNavigate();

    const phase = session.startedAt === null
        ? "idle"    // sessione non iniziata
        : session.finishedAt === null
            ? "running" // in sessione
            : "review"; // sessione terminata ma non ancora salvata

    const runningHere = phase === "running" && session.workoutId === id; // sessione in corso
    const reviewHere = phase === "review" && session.workoutId === id; // salvataggio in corso
    const foreignSession = phase !== "idle" && session.workoutId !== id; // un altra sessione è in corso

    // uso per tenere l'array session.completed aggiornato
    const completedRef = useRef<string[]>(session.completed);
    useEffect(() => {
        completedRef.current = session.completed;
    }, [session.completed]);

    // attivo il timer
    const now = useNow(phase === "running" || session.restEndsAt !== null);

    // riposo rimanente 
    const remainingRest = session.restEndsAt !== null
        ? Math.max(0, Math.ceil((session.restEndsAt - now) / 1000))
        : null;

    // secondi passati
    const elapsedSeconds = session.startedAt
        ? Math.floor(((session.finishedAt ?? now) - session.startedAt) / 1000)
        : 0;

    // uso sessionView per non scrivere nel localStorage ogni minuto
    const sessionView = useMemo(
        () => ({ ...session, active: runningHere, remainingRest }),
        [session, runningHere, remainingRest]
    );

    // crea workout
    const createWorkout = async () => {
        try {
            if (!id) {
                if (!user) return;
                const workoutsRef = collection(db, "workouts");

                const maxQuery = query(
                    workoutsRef,
                    where("userId", "==", user.uid),
                    orderBy("cardOrder", "desc"),
                    limit(1)
                );

                const snap = await getDocs(maxQuery);
                const maxOrder = snap.empty ? 0 : (snap.docs[0].data().cardOrder ?? 0);
                const newCardOrder = maxOrder + 1;

                const docRef = await addDoc(workoutsRef, {
                    name: newName,
                    userId: user.uid,
                    automaticallyGenerated: false,
                    cardOrder: newCardOrder,
                    exercises: {},
                });

                setDocId(docRef.id);
                setSearching(true);
                navigate(`/editWorkout/${docRef.id}`, { replace: true });
                return;
            }

            setDocId(id);
            setSearching(true);
        } catch (err) {
            console.error(err);
        }
    };

    // prendo gli esercizi da Firestore
    const getExercises = async () => {
        if (!id) {
            setExercises([]);
            return;
        }

        try {
            const snapshot = await getDoc(doc(db, "workouts", id));

            if (!snapshot.exists()) {
                setExercises([]);
                return;
            }

            const workout = snapshot.data() as Workout;

            const exerciseList: Exercises[] = Object.entries(workout.exercises ?? {})
                .map(([exerciseId, exercise]) => {
                    const updatedSet: Record<string, Sets> = {};

                    Object.entries(exercise.sets ?? {}).forEach(([setId, set]) => {
                        updatedSet[setId] = {
                            ...set,
                            completed: completedRef.current.includes(`${exerciseId}-${setId}`),
                        };
                    });

                    return {
                        docId: id,
                        id: exerciseId,
                        exerciseName: exercise.exerciseName,
                        exerciseOrder: exercise.exerciseOrder,
                        exerciseCategory: exercise.exerciseCategory,
                        exerciseSourceId: exercise.exerciseSourceId,
                        imageUrl: exercise.imageUrl,
                        muscleGroup: exercise.muscleGroup,
                        rest: exercise.rest,
                        sets: updatedSet,
                    };
                })
                .sort((a, b) => a.exerciseOrder - b.exerciseOrder);

            setExercises(exerciseList);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    const startSession = async () => {

        if ("Notification" in window && Notification.permission === "default") {
            await Notification.requestPermission();
        }

        setSession({
            ...emptySession,
            workoutId: id ?? "",
            startedAt: Date.now(),
        });
    };

    const toggleSet = (exercise: Exercises, setIndex: string, rest: number) => {
        const setId = `${exercise.id}-${setIndex}`;
        const exists = session.completed.includes(setId);

        // aggiorno completed
        setExercises(prev => prev.map(e => {
            if (e.id !== exercise.id) return e;

            return {
                ...e,
                sets: {
                    ...e.sets,
                    [setIndex]: {
                        ...e.sets[setIndex],
                        completed: !exists,
                    },
                },
            };
        }));

        // aggiorno la lista completed e la fine del riposo
        setSession(prev => ({
            ...prev,
            restEndsAt: exists
                ? prev.restEndsAt
                : (rest > 0 ? Date.now() + rest * 1000 : null),
            completed: exists
                ? prev.completed.filter(completedId => completedId !== setId)
                : [...prev.completed, setId],
        }));
    };

    const skipRest = () => {
        setSession(prev => ({ ...prev, restEndsAt: null }));
    };

    const endSession = () => {
        setSession(prev => ({
            ...prev,
            finishedAt: Date.now(),
            restEndsAt: null,
        }));
    };

    const undoEndSession = () => {
        setSession(prev => ({
            ...prev,
            startedAt: prev.startedAt && prev.finishedAt
                ? prev.startedAt + (Date.now() - prev.finishedAt)
                : prev.startedAt,
            finishedAt: null,
        }));
    };

    const discardSession = () => {
        // messaggio di conferma
        if (!window.confirm("Discard this workout? Your completed sets will be lost.")) return;

        clearSession();
    };

    const saveWorkout = async () => {
        if (saving) return;

        setSaving(true);

        try {
            const durationSeconds = session.startedAt && session.finishedAt
                ? Math.floor((session.finishedAt - session.startedAt) / 1000)
                : 0;

            // tengo solo i set che ho completato
            const filteredExercises = exercises
                .map((exercise) => ({
                    ...exercise,
                    sets: Object.fromEntries(
                        Object.entries(exercise.sets).filter(([setId]) =>
                            session.completed.includes(`${exercise.id}-${setId}`)
                        )
                    ),
                }))
                .filter((exercise) => Object.keys(exercise.sets).length > 0);

            if (filteredExercises.length === 0) {
                window.alert("No completed sets to save.");
                return;
            }

            addDoc(collection(db, "workoutsHistory"), {
                userId: user?.uid,
                workoutId: session.workoutId,
                title: session.title,
                description: session.description,
                duration: durationSeconds,
                exercises: filteredExercises,
                date: Timestamp.now(),
            }).catch((err) => {
                console.error("failed to contact the database", err);
            });

            setSavedSuccess(true);
            clearSession();
        } catch (err) {
            console.error(err);
            window.alert("Something went wrong while saving. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (!id) {
            setLoading(false);
        }
        getExercises();

    }, [id]);

    // feedback di salvataggio
    useEffect(() => {
        if (!savedSuccess) return;

        const timeout = setTimeout(() => setSavedSuccess(false), 3000);
        return () => clearTimeout(timeout);
    }, [savedSuccess]);


    const notifiedFor = useRef<number | null>(null);
    useEffect(() => {
        if (session.restEndsAt === null || remainingRest !== 0) return; // non ancora finito
        if (notifiedFor.current === session.restEndsAt) return; // ho già inviato questa notifica

        // salvo la fine del recupero (così non invio una notifica più volte)
        notifiedFor.current = session.restEndsAt;

        // faccio vibrare il dispositivo
        navigator.vibrate?.([200, 100, 200]);

        // se il browser supporta le notifiche e l'utente ha accettato di riceverle
        if ("Notification" in window && Notification.permission === "granted") {
            // aspetto il service worker
            navigator.serviceWorker?.ready.then((registration) => {
                registration.showNotification("Rest is over", {
                    body: "Time for your next set!",
                    icon: "/pwa-192x192.png",
                    tag: "rest-timer",       // sostituisce una notifica precedente invece di accumularle
                });
            });
        }
    }, [remainingRest, session.restEndsAt]);


    return (
        <>
            <Navbar />

            {/* barra di ricerca */}

            {searching &&
                <ExerciseSelector
                    documentId={docId}
                    onAdded={() => setAddedSomething(true)}
                    onClose={() => {
                        setSearching(false);
                        // ricarico solo se è stato aggiunto qualcosa
                        if (addedSomething) {
                            getExercises();
                            setAddedSomething(false);
                        }
                    }}
                />
            }

            {/* feedback di salvataggio */}

            {savedSuccess && (
                <div className={styles.successOverlay}>
                    <div className={styles.successModal}>
                        <div className={styles.checkmarkWrapper}>
                            <svg className={styles.checkmark} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none" />
                                <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                            </svg>
                        </div>
                        <h3>Workout Saved!</h3>
                        <p>You can now find it in your history page!</p>
                    </div>
                </div>
            )}

            {/* sessione esterna */}

            {foreignSession && (
                <div className={styles.sessionWarning}>
                    You have a workout in progress somewhere else. Finish it before
                    starting this one.
                </div>
            )}

            {/* timer */}

            {runningHere && (
                <div className={styles.timerBar}>
                    <div className={styles.timerItem}>
                        <span className={styles.timerLabel}>Elapsed</span>
                        <span className={styles.timerValue}>{formatTime(elapsedSeconds)}</span>
                    </div>

                    {remainingRest !== null && remainingRest !== 0 && (
                        <div className={`${styles.timerItem} ${remainingRest === 0 ? styles.restDone : styles.restRunning}`}>
                            <span className={styles.timerLabel}>
                                {remainingRest === 0 ? "Rest over" : "Rest"}
                            </span>
                            <span className={styles.timerValue}>{formatTime(remainingRest)}</span>
                            <button className={styles.skipButton} onClick={skipRest}>
                                {remainingRest === 0 ? "Dismiss" : "Skip"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {!id &&
                <div className={styles.nameInputContainer}>
                    <p>Select a name to continue..</p>
                    <input
                        placeholder='name...'
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                </div>
            }

            {id && !reviewHere &&
                <div className={styles.action}>
                    <button
                        className={styles.addButton}
                        disabled={foreignSession}
                        onClick={runningHere ? endSession : startSession}
                    >
                        {runningHere ? "End Workout" : "Start Workout"}
                    </button>

                    {runningHere && (
                        <button className={styles.discardButton} onClick={discardSession}>
                            Discard
                        </button>
                    )}
                </div>
            }

            {!reviewHere &&
                <div className={styles.actions}>
                    <button
                        className={styles.addButton}
                        disabled={!online || (newName.trim() === "" && !id)}
                        onClick={createWorkout}
                    >
                        {online ? "Add Exercise" : "Add Exercise (offline)"}
                    </button>
                </div>
            }

            {loading ?
                <p className={styles.state}>Loading…</p>
                :
                !reviewHere &&
                exercises.map((exercise) => (
                    <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        session={sessionView}
                        onUpdate={getExercises}
                        onToggleSet={toggleSet}
                        isDone={false}
                    />
                ))
            }

            { /* riassunto workout */}
            {reviewHere &&
                <div className={styles.summary}>
                    <div className={styles.summaryHeader}>
                        <h2>Workout Summary</h2>
                        <button className={styles.skipButton} onClick={undoEndSession}>
                            Back to workout
                        </button>
                    </div>

                    <p className={styles.summaryDuration}>
                        Total time: <strong>{formatTime(elapsedSeconds)}</strong>
                    </p>

                    <div className={styles.summaryInputs}>
                        <input
                            placeholder='Add name...'
                            value={session.title}
                            onChange={(e) => setSession(prev => ({ ...prev, title: e.target.value }))}
                        />
                        <input
                            placeholder='Add description...'
                            value={session.description}
                            onChange={(e) => setSession(prev => ({ ...prev, description: e.target.value }))}
                        />
                        <button onClick={saveWorkout} disabled={saving}>
                            {saving ? "SAVING…" : "SAVE WORKOUT"}
                        </button>
                    </div>

                    <div className={styles.exerciseContainer}>
                        {exercises.map((exercise) => (
                            <ExerciseCard
                                key={exercise.id}
                                exercise={exercise}
                                session={sessionView}
                                onUpdate={() => { }}
                                onToggleSet={toggleSet}
                                isDone={true}
                                isEditable={false}
                            />
                        ))}
                    </div>
                </div>
            }
        </>
    );
};
