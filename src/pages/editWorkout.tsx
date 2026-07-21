import { ExerciseCard } from '../components/exerciseCard';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import type { Exercises, Workout } from '../types';
import { Navbar } from '../components/navbar';
import { useParams } from 'react-router-dom';
import styles from './editWorkout.module.css';

export const EditWorkout = () => {

    const { id } = useParams();

    const [exercises, setExercises] = useState<Exercises[]>([]);

    const dbReference = collection(db, "workouts");

    /** 

    const addExercise = async () => {
        try {

            ;
        } catch (err) {
            console.error(err)
        }
    }

    const deleteExercise = async () => {

    }
    */

    const getExercise = async () => {
        try {
            const snapshot = await getDocs(dbReference);

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

            // aggiorna lo state una sola volta
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
                <button className={styles.addButton}>
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