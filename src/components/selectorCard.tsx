import type { SelectorCardProps, Workout } from "../types";
import { db } from '../firebase/firebase';
import { collection, updateDoc, doc, getDoc } from 'firebase/firestore';
import styles from './selectorCard.module.css';
import { useEffect, useState } from "react";
import type { Feedback } from '../types'

const DEFAULT_REST_SECONDS = 90;

export const SelectorCard = ({ exercise, documentId, onAdded }: SelectorCardProps) => {

    const [feedback, setFeedback] = useState<Feedback>(null); // feedback di salvataggio
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (!feedback) return;

        const timeout = setTimeout(() => setFeedback(null), 900); // durata feedback
        return () => clearTimeout(timeout);
    }, [feedback]);

    const createExercise = async () => {
        if (adding) return;

        setAdding(true);

        try {
            const workoutRef = doc(db, "workouts", documentId);
            const workoutSnap = await getDoc(workoutRef);

            if (!workoutSnap.exists()) {
                setFeedback({ text: "Workout not found", ok: false });
                return;
            }

            const workout = workoutSnap.data() as Workout;

            // prendo il numero di esercizi
            const values = Object.values(workout.exercises ?? {});
            const order = values.length === 0
                ? 0
                : Math.max(...values.map((e) => e.exerciseOrder)) + 1;

            const exerciseId = doc(collection(db, "workouts")).id;

            await updateDoc(workoutRef, {
                [`exercises.${exerciseId}`]: {
                    exerciseName: exercise.name,
                    exerciseOrder: order,
                    exerciseSourceId: exercise.exerciseSourceId,
                    exerciseCategory: exercise.category,
                    imageUrl: exercise.imageUrl,
                    muscleGroup: exercise.muscleGroup,
                    sets: {},
                    rest: DEFAULT_REST_SECONDS,
                }
            });

            setFeedback({ text: "Exercise added", ok: true });
            onAdded?.();
        } catch (err) {
            console.error(err);
            setFeedback({ text: "Could not add exercise", ok: false });
        } finally {
            setAdding(false);
        }
    };

    return (
        <button
            type="button"
            className={styles.card}
            onClick={createExercise}
            disabled={adding}
        >

            {/* feedback */}

            {feedback && (
                <span
                    className={`${styles.toast} ${feedback.ok ? styles.toastOk : styles.toastError}`}
                    role="status"
                >
                    {feedback.text}
                </span>
            )}

            {/* immagine dell'esercizio */}

            <span className={styles.imageContainer}>
                {exercise.imageUrl ? (
                    <img
                        className={styles.image}
                        src={exercise.imageUrl}
                        alt=""
                        loading="lazy"
                    />
                ) : (
                    <span className={styles.noImage} aria-hidden="true">🏋️</span>
                )}
            </span>

            {/* nome e gruppo muscolare */}

            <span className={styles.info}>
                <span className={styles.name}>{exercise.name}</span>

                {exercise.muscleGroup && (
                    <span className={styles.muscle}>{exercise.muscleGroup}</span>
                )}
            </span>
        </button>
    );
};
