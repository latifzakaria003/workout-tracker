import { ExerciseCard } from '../components/exerciseCard';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import type { Exercises, Workout, Sets } from '../types';

export const EditWorkout = () => {

    const [exercises, setExercises] = useState<Exercises[]>([]);

    const getExercise = async () => {
        try {
            const snapshot = await getDocs(collection(db, "workouts"));

            const exerciseList: Exercises[] = [];

            snapshot.forEach((doc) => {

                const workout = doc.data() as Workout;

                const exercises = Object.values(workout.exercises);

                exercises.forEach((exercise) => {

                    const sets: Sets[] = [];

                    Object.values(exercise.sets).forEach((set) => {

                        sets.push({
                            weight: set.weight,
                            reps: set.reps
                        });

                    });

                    exerciseList.push({
                        exerciseName: exercise.exerciseName,
                        exerciseOrder: exercise.exerciseOrder,
                        exerciseSourceId: exercise.exerciseSourceId,
                        imageUrl: exercise.imageUrl,
                        muscleGroup: exercise.muscleGroup,
                        rest: exercise.rest,
                        sets: sets
                    });

                });

            });

            // ordina tutti gli esercizi per exerciseOrder
            exerciseList.sort(
                (a, b) => a.exerciseOrder - b.exerciseOrder
            );

            // aggiorna lo state una sola volta
            setExercises(exerciseList);

        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        getExercise();
    }, []);

    return (
        <>
            <button>Add Workout</button>
            {exercises.map((exercise) => (
                <>
                    <ExerciseCard
                        exerciseName={exercise.exerciseName}
                        exerciseOrder={exercise.exerciseOrder}
                        exerciseSourceId={exercise.exerciseSourceId}
                        imageUrl={exercise.imageUrl}
                        muscleGroup={exercise.muscleGroup}
                        rest={exercise.rest}
                        sets={exercise.sets}
                    />
                    {console.log(exercise.sets)}
                </>

            ))
            }



        </>
    );

}