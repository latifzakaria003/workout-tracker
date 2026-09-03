import styles from './workoutCard.module.css';
import type { WorkoutCardProps } from '../types';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useState } from 'react';

export const WorkoutCard = ({ id, name, exerciseCount, volume, onUpdate }: WorkoutCardProps) => {

    const navigate = useNavigate();
    const [deleting, setDeleting] = useState(false);

    // elimina workout
    const deleteWorkout = async () => {
        if (deleting) return;
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

        setDeleting(true);

        try {
            await deleteDoc(doc(db, "workouts", id));
            onUpdate();
        } catch (err) {
            console.error(err);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div
            className={styles.card}
            onClick={() => navigate(`/editWorkout/${id}`)}
            role="button"
            tabIndex={0}
        >
            <button
                className={styles.deleteButton}
                onClick={(e) => {
                    e.stopPropagation();
                    deleteWorkout();
                }}
                disabled={deleting}
                aria-label={`Delete ${name}`}
            >
                ✕
            </button>

            <h2 className={styles.title}>{name}</h2>

            <div className={styles.stats}>
                <div className={styles.stat}>
                    <span className={styles.label}>Volume</span>
                    <span className={styles.value}>{volume} kg</span>
                </div>

                <div className={styles.stat}>
                    <span className={styles.label}>Exercises</span>
                    <span className={styles.value}>{exerciseCount}</span>
                </div>
            </div>
        </div>
    );
};
