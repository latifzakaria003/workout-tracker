import { ExerciseCard } from '../components/exerciseCard';
import { ExerciseSelector } from '../components/exerciseSelector';
import { useEffect, useState } from 'react';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import type { WorkoutSession, Exercises, Workout } from '../types';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Navbar } from '../components/navbar';
import { useParams } from 'react-router-dom';
import styles from './editWorkout.module.css';


/*
IDEA PRESA DA HEVY, le exercise card dovrebbero avere solo il riposo e poi quando ci clicco fornire le informazioni sull'esercizio (usando wger) 
ci dovrebbe anche essere un pulsante "START WORKOUT" che fa partire il workout come in hevy. 
*/



export const EditWorkout = () => {

    const [session, setSession] = useState<WorkoutSession>({
        started: false,
        completedSets: {},
        remainingRest: null,
        activeSetId: null,
        activeExerciseId: null,
        finished: false,
    });
    const { id } = useParams();
    const [user] = useAuthState(auth);
    const [docId, setDocId] = useState("");
    const [exercises, setExercises] = useState<Exercises[]>([]);
    const [newName, setNewName] = useState("");
    const [isSearching, setIsSearching] = useState(false);

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

                            const sets = workout.exercises[exerciseId].sets;

                            exerciseList.push({
                                docId: id,
                                id: exerciseId,
                                exerciseName: exercise.exerciseName,
                                exerciseOrder: exercise.exerciseOrder,
                                exerciseSourceId: exercise.exerciseSourceId,
                                imageUrl: exercise.imageUrl,
                                muscleGroup: exercise.muscleGroup,
                                rest: exercise.rest,
                                sets: sets
                            });
                        });
                    }
                });
                exerciseList.sort((a, b) => a.exerciseOrder - b.exerciseOrder);
            }

            setExercises(exerciseList);
            getExercise();
        } catch (err) {
            console.error(err);
        }
    }

    const toggleSet = (exerciseId: string, setIndex: string, rest: number) => {

        const setId = `${exerciseId}-${setIndex}`;
        setSession(prev => {

            if (prev.completedSets[setId]) {
                const { [setId]: _, ...completedSets } = prev.completedSets;

                return {
                    ...prev,
                    completedSets,
                    activeSetId: null,
                    activeExerciseId: null,
                    remainingRest: null
                };
            }

            return {
                ...prev,
                completedSets: {
                    ...prev.completedSets,
                    [setId]: true
                },
                activeSetId: setId,
                activeExerciseId: exerciseId,
                remainingRest: rest
            };
        });
    };


    const endWorkout = async () => {

        try {
            setSession(prev => { return { ...prev, finished: true } });
            while (!session.finished) { ; }





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

        console.log("REST FINITO");

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

            {!id &&
                <div>
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
                    onClick={() => {

                        setSession({
                            started: true,
                            completedSets: {},
                            remainingRest: null as number | null,
                            activeSetId: null as string | null,
                            activeExerciseId: null as string | null,
                            finished: false,
                        })
                    }}



                > {!session?.started ? "Start Workout" : "End Workout"}</button>
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

            {
                exercises.map((exercise) => (
                    <>
                        <ExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            session={session}
                            onUpdate={getExercise}
                            onToggleSet={toggleSet}
                        />
                    </>

                ))
            }
        </>
    );

}