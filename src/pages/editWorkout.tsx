import { ExerciseCard } from '../components/exerciseCard';
import { useEffect, useState } from 'react';
import { addDoc, collection, getDocs, doc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import type { Exercises, Workout } from '../types';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Navbar } from '../components/navbar';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './editWorkout.module.css';

export const EditWorkout = () => {

    const { id } = useParams();
    const [user] = useAuthState(auth);


    const [exercises, setExercises] = useState<Exercises[]>([]);
    const [newName, setNewName] = useState("");

    const navigate = useNavigate();

    const workoutsRef = collection(db, "workouts");

    const createDoc = async () => {
        try {

            const docRef = await addDoc(workoutsRef, {
                name: newName,
                userId: user?.uid,
                AutomaticallyGenerated: false,
                cardOrder: 0,
                exercises: {}
            });

            navigate(`/exerciseSelector/${docRef.id}`);

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
            if (id != "") {

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
            <div className={styles.actions}>
                <button
                    className={styles.addButton}
                    onClick={() => createDoc()} // DA SISTEMARE, PROBLEMA: MI CREA OGNI VOLTA UN NUOVO DOCUMENTO, INVECE SE PREMO ADD EXERCISE E HO GIA' ESERCIZI DENTRO IO VOGLIO CHE GLI ESERCIZI VENGANO AGGIUNTI, UN IDEA è QUELLA DI PASSARE IL DOC_ID SE CI SONO DEGLI ESERCIZI PRESENTI

                >
                    Add Exercise
                </button>
            </div>
            <input
                placeholder='name...'
                onChange={(e) => { setNewName(e.target.value) }}
            />
            <button
                onClick={() => { createDoc() }}

            >Submit</button>

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