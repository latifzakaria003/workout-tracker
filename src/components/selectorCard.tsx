import type { WgerExercise, Workout } from "../types";
import { db } from '../firebase/firebase';
import { collection, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import styles from './selectorCard.module.css';
import { useState } from "react";


export const SelectorCard = ({ exercise }: { exercise: WgerExercise }) => {

    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    const createExercise = async () => {
        try {
            const exerciseRef = doc(db, "workouts", exercise.docId);

            const workoutSnap = await getDoc(exerciseRef);

            if (!workoutSnap.exists()) return;

            const workout = workoutSnap.data() as Workout;

            const values = Object.values(workout.exercises ?? {});

            const maxOrder =
                values.length === 0
                    ? -1
                    : Math.max(...values.map((e) => e.exerciseOrder));

            const newOrder = maxOrder + 1;

            const exerciseId = doc(collection(db, "workouts")).id;
            let muscle;
            if (exercise.muscleGroup.length > 1 && Array.isArray(exercise.muscleGroup)) {
                for (let i = 0; i < exercise.muscleGroup.length; i++) {
                    if (exercise.muscleGroup[i].name_en) {
                        muscle = exercise.muscleGroup[i].name_en;
                        console.log("name_en: ", exercise.muscleGroup[i].name_en)
                        break;
                    }
                }
            }
            console.log("pre: ", muscle);
            if (!muscle)
                muscle = exercise.category;

            console.log("final: ", muscle);

            await updateDoc(exerciseRef, {

                [`exercises.${exerciseId}`]: {
                    exerciseName: exercise.name,
                    exerciseOrder: newOrder,
                    exerciseSourceId: exercise.exerciseSourceId,
                    imageUrl: exercise.imageUrl,
                    muscleGroup: muscle,
                    sets: {},
                    rest: 0
                }
            });

            navigate(`/editWorkout/${exercise.docId}`);

        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className={styles.card} onClick={() => {
            createExercise(); setMessage("Exercise Added"); setTimeout(() => {
                setMessage("");
            }, 900);
        }}>
            {message && (
                <div className={styles.toast}>
                    {message}
                </div>
            )}

            <div className={styles.imageContainer}>
                {exercise.imageUrl ? (
                    <img
                        className={styles.image}
                        src={exercise.imageUrl}
                        alt={exercise.name}
                    />
                ) : (
                    <div className={styles.noImage}>
                        🏋️
                    </div>
                )}
            </div>


            <div className={styles.info}>

                <h3 className={styles.name}>
                    {exercise.name}
                </h3>

                <span className={styles.muscle}>
                    {(typeof exercise.muscleGroup === "string") ? exercise.muscleGroup : "no muscle"}
                </span>

            </div>

        </div>
    );
};