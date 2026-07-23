import styles from './workoutCard.module.css';
import type { WorkoutCardProps } from '../types';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useEffect } from 'react';

export const WorkoutCard = ({ id, name, exerciseCount, volume, onUpdate }: WorkoutCardProps) => {

    const navigate = useNavigate();

    const workoutRef = doc(db, "workouts", id);

    const deleteWorkout = async () => {
        try {
            await deleteDoc(workoutRef);

        } catch (err) {
            console.error(err);
        }

    }
    useEffect(() => {
        onUpdate()
    }, []);


    return (
        <div
            className={styles.card}
            onClick={() => navigate(`/editWorkout/${id}`)}
        >
            <button
                className={styles.deleteButton}
                onClick={(e) => {
                    e.stopPropagation();
                    deleteWorkout();
                }}
            >
                ✕
            </button>

            <h2 className={styles.title}>{name}</h2>

            <div className={styles.stats}>

                <div className={styles.stat}>
                    <span className={styles.label}>
                        Volume
                    </span>
                    <span className={styles.value}>
                        {volume} kg
                    </span>
                </div>


                <div className={styles.stat}>
                    <span className={styles.label}>
                        Esercizi
                    </span>
                    <span className={styles.value}>
                        {exerciseCount}
                    </span>
                </div>

            </div>

        </div>
    );


}