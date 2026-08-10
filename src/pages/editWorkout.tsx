import { ExerciseCard } from '../components/exerciseCard';
import { ExerciseSelector } from '../components/exerciseSelector';
import { useEffect, useState } from 'react';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import type { WorkoutSession, Exercises, Workout, Sets } from '../types';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Navbar } from '../components/navbar';
import { useParams } from 'react-router-dom';
import { Timestamp } from "firebase/firestore";
import styles from './editWorkout.module.css';


export const EditWorkout = () => {
    const [session, setSession] = useState<WorkoutSession>({
        title: "",
        active: false,
        startedAt: null,
        finishedAt: null,
        remainingRest: null,
        description: "",
        completed: [],
    });

    const { id } = useParams();
    const [user] = useAuthState(auth);
    const [docId, setDocId] = useState("");
    const [exercises, setExercises] = useState<Exercises[]>([]);
    const [newName, setNewName] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [ended, setEnded] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const workoutsRef = collection(db, "workouts");

    const createDoc = async () => {
        try {
            if (!id) {
                // we are creating a new workout
                const docRef = await addDoc(workoutsRef, {
                    name: newName,
                    userId: user?.uid,
                    AutomaticallyGenerated: false,
                    cardOrder: 0,
                    exercises: {}
                });
                setDocId(docRef.id);
            } else {
                // we are editing an existing workout
                setDocId(id);
            }
            setIsSearching(true);
        } catch (err) {
            console.error(err);
        }
    }

    const getExercise = async () => {
        try {
            const snapshot = await getDocs(workoutsRef);

            const exerciseList: Exercises[] = [];
            if (id) {
                snapshot.forEach((doc) => {
                    if (doc.id == id) {
                        // we found the workout
                        const workout = doc.data() as Workout;

                        const ex = Object.entries(workout.exercises);

                        ex.forEach(([exerciseId, exercise]) => {

                            const updatedSet: Record<string, Sets> = {};
                            Object.entries(workout.exercises[exerciseId].sets).forEach(([id, set]) => {

                                updatedSet[id] = {
                                    ...set,
                                    completed: false
                                };
                            })

                            exerciseList.push({
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
                            });
                        });
                    }
                });
                exerciseList.sort((a, b) => a.exerciseOrder - b.exerciseOrder);
            }

            setExercises(exerciseList);
        } catch (err) {
            console.error(err);
        }
    }

    const startSession = () => {

        setSession({
            title: "",
            active: true,
            startedAt: Timestamp.now(),
            finishedAt: null,
            remainingRest: null,
            description: "",
            completed: [],
        })
    }

    const toggleSet = (exercise: Exercises, setIndex: string, rest: number) => {
        const setId = `${exercise.id}-${setIndex}`;
        const exists = session.completed.includes(setId);

        setExercises(prev => {
            const updated = prev.map(e => {
                if (e.id !== exercise.id) {
                    return e;
                }

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
            });
            return updated;
        });

        setSession(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                remainingRest: exists ? prev.remainingRest : rest,
                completed: exists
                    ? prev.completed.filter(id => id !== setId)
                    : [...prev.completed, setId]
            };
        });
    };

    const endSession = () => {
        setSession((prev) => {
            return {
                ...prev,
                finishedAt: Timestamp.now(),
            }
        })
        setEnded(true);
    }


    const saveWorkout = async () => {
        try {
            const workoutHistoryRef = collection(db, "workoutsHistory");
            let duration = 0;

            if (session.startedAt && session.finishedAt) {
                duration = session.finishedAt.toMillis() - session.startedAt.toMillis();
            }
            const durationSeconds = Math.floor(duration / 1000);

            const filteredExercises = exercises
                .map((exercise) => {
                    const filteredSets = Object.fromEntries(
                        Object.entries(exercise.sets).filter(([_, set]) => set.completed)
                    );
                    return {
                        ...exercise,
                        sets: filteredSets
                    };
                })
                .filter((exercise) => Object.keys(exercise.sets).length > 0);

            if (filteredExercises.length === 0) {
                console.log("Nessun esercizio completato, salvataggio annullato.");
                return;
            }

            const docRef = await addDoc(workoutHistoryRef, {
                title: session.title,
                description: session.description,
                duration: durationSeconds,
                exercises: filteredExercises,
                date: Timestamp.now()
            });

            console.log("Salvato con successo!", docRef.id);
            setSavedSuccess(true);

            setTimeout(() => {
                setSavedSuccess(false);
            }, 3000);

            setSession({
                title: "",
                active: false,
                startedAt: null,
                finishedAt: null,
                remainingRest: null,
                description: "",
                completed: []
            })
            setEnded(false);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        getExercise();
    }, []);
    useEffect(() => {

        if (session.remainingRest == null)
            return;

        if (session.remainingRest <= 0)
            return;

        const interval = setInterval(() => {

            setSession(prev => ({

                ...prev,

                remainingRest:
                    prev.remainingRest == null
                        ? null
                        : prev.remainingRest - 1

            }));

        }, 1000);

        return () => clearInterval(interval);

    }, [session.remainingRest]);
    useEffect(() => {

        if (session.remainingRest !== 0)
            return;

        console.log("NO MORE REST!");

    }, [session.remainingRest]);

    return (
        <>
            <Navbar />

            {isSearching &&
                <ExerciseSelector
                    documentId={docId}
                    onClose={() => setIsSearching(false)}
                />
            }
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
                        <p style={{ color: "white" }}>You can now find it in your history page💪</p>
                    </div>
                </div>
            )}

            {!id &&
                <div className={styles.nameInputContainer}>
                    <p>Select a name to continue..</p>
                    <input
                        placeholder='name...'
                        onChange={(e) => { setNewName(e.target.value) }}
                    />
                </div>
            }

            {id && <div className={styles.action}>
                <button
                    className={styles.addButton}
                    onClick={
                        !session?.active ?
                            startSession :
                            endSession
                    }

                > {!session?.active ? "Start Workout" : "End Workout"}</button>

            </div >}
            <div className={styles.actions}>

                <button
                    className={styles.addButton}
                    disabled={newName.trim() === "" && !id}
                    onClick={() => createDoc()}

                >
                    Add Exercise
                </button>
            </div>

            {!ended &&
                exercises.map((exercise) => (
                    <>
                        <ExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            session={session}
                            onUpdate={getExercise}
                            onToggleSet={toggleSet}
                            isDone={false}

                        />
                    </>

                ))
            }
            <div>
                {ended &&
                    <>
                        <div className={styles.summary}>
                            <h2>Workout Summary</h2>
                            <div className={styles.summaryInputs}>
                                <input
                                    placeholder='Add name...'
                                    onChange={(e) => setSession(prev => ({
                                        ...prev,
                                        title: e.target.value
                                    }))}
                                />

                                <input
                                    placeholder='Add description...'
                                    onChange={(e) => setSession(prev => ({
                                        ...prev,
                                        description: e.target.value
                                    }))}
                                />
                                <button onClick={() => saveWorkout()}>
                                    SAVE WORKOUT
                                </button>
                                <div className={styles.exerciseContainer}>
                                    {exercises.map((exercise) => (
                                        <ExerciseCard
                                            key={exercise.id}
                                            exercise={exercise}
                                            session={session}
                                            onUpdate={() => { }}
                                            onToggleSet={toggleSet}
                                            isDone={true}
                                            isEditable={false}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>

                }
            </div>
        </>
    );

}