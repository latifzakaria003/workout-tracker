import { ExerciseCard } from '../components/exerciseCard';
import { ExerciseSelector } from '../components/exerciseSelector';
import { useEffect, useState } from 'react';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import type { Exercises, Workout } from '../types';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Navbar } from '../components/navbar';
import { useParams } from 'react-router-dom';
import styles from './editWorkout.module.css';

export const EditWorkout = () => {

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
                const docRef = await addDoc(workoutsRef, {
                    name: newName,
                    userId: user?.uid,
                    AutomaticallyGenerated: false,
                    cardOrder: 0,
                    exercises: {}
                });

                setDocId(docRef.id);
            } else {
                setDocId(id);
            }
            setIsSearching(true);
        } catch (err) {
            console.error(err);
        }
    }

    /** 

    const addExercise = async () => {
        try {

            ;
        } catch (err) {
            console.error(err)
        }
    }

    const deleteExercise = async () => {
        try {

            ;
        } catch (err) {
            console.error(err)
        }
    }
    */

    const getExercise = async () => {
        try {
            const snapshot = await getDocs(workoutsRef);

            const exerciseList: Exercises[] = [];
            if (id) {

                snapshot.forEach((doc) => {
                    if (doc.id == id) {

                        const workout = doc.data() as Workout;

                        const exercises = Object.entries(workout.exercises);


                        exercises.forEach(([exerciseId, exercise]) => {

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

    useEffect(() => {
        getExercise();
    }, []);

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
            <div className={styles.actions}>
                <button
                    className={styles.addButton}
                    disabled={newName.trim() === "" && !id}
                    onClick={() => createDoc()}

                >
                    Add Exercise
                </button>
            </div>


            {exercises.map((exercise) => (
                <>
                    <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        onUpdate={getExercise}
                    />
                </>

            ))
            }
        </>
    );

}