import styles from "./exerciseCard.module.css";
import type { ExerciseCardProps } from "../types";
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useEffect, useState } from 'react';

export const ExerciseCard = ({ exercise, session, onUpdate, onToggleSet, isDone, isEditable = true }: ExerciseCardProps) => {

    const [isAddingSet, setIsAddingSet] = useState(false);
    const [isDeletingSet, setisDeletingSet] = useState(false);
    const [editingSet, setEditingSet] = useState<string | null>(null);
    const [editWeight, setEditWeight] = useState(0);
    const [editReps, setEditReps] = useState(0);
    const [newWeight, setNewWeight] = useState(0);
    const [newReps, setNewReps] = useState(0);


    const workoutRef = doc(db, "workouts", exercise.docId);

    const Addset = async () => {
        try {
            const maxKey = Object.keys(exercise.sets).length === 0 ? 0 : Math.max(...Object.keys(exercise.sets).map(Number));

            const newKey = maxKey + 1;

            await updateDoc(workoutRef, {
                [`exercises.${exercise.id}.sets.${newKey}`]: {
                    reps: newReps,
                    weight: newWeight
                }
            });
        } catch (err) {
            console.error(err);
        }
        setIsAddingSet(false);
        onUpdate?.();
    };

    const DeleteSet = async (setId: string) => {
        try {
            await updateDoc(workoutRef, {
                [`exercises.${exercise.id}.sets.${setId}`]: deleteField()
            });
        } catch (err) {
            console.error(err);
        }
        setisDeletingSet(false);
        onUpdate?.();
    }

    const EditSet = async (setId: string) => {
        try {
            await updateDoc(workoutRef, {
                [`exercises.${exercise.id}.sets.${setId}`]: {
                    weight: editWeight,
                    reps: editReps
                }
            });
        } catch (err) {
            console.error(err);
        }
        setEditingSet(null);
        onUpdate?.();
    }

    const DeleteExercise = async () => {
        try {
            await updateDoc(workoutRef, {
                [`exercises.${exercise.id}`]: deleteField()
            });

        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        onUpdate?.();
    }, []);

    return (
        <div className={styles.card} key={exercise.exerciseOrder}>

            {isEditable && <button
                className={styles.deleteButton}
                onClick={() => { DeleteExercise() }}
            >X</button>}
            <h1 className={styles.title}>
                {exercise.exerciseName}
            </h1>

            {exercise.imageUrl ? <img
                className={styles.image}
                src={exercise.imageUrl}
                alt="image"
            /> :
                <div className={styles.noImageEmoji}>
                    🏋️
                </div>
            }

            <div className={styles.info} key={exercise.id}>
                <p>
                    Rest: {`${Math.floor(exercise.rest / 60)
                        .toString()
                        .padStart(2, "0")}:${(exercise.rest % 60)
                            .toString()
                            .padStart(2, "0")}`}
                </p>
            </div>

            <div className={styles.setsContainer}>
                {Object.entries(exercise.sets).map(([setId, set], index) => (
                    <div
                        className={session?.completed.includes(`${exercise.id}-${setId}`) ? styles.completedSet : ((isDone) ? styles.notCompleted : styles.set)}
                        key={index}
                    >

                        <span className={styles.setLabel}>
                            Set {index + 1}
                        </span>

                        {editingSet === setId ? (
                            <>
                                <input
                                    className={styles.input}
                                    value={editWeight}
                                    onChange={(e) => setEditWeight(Number(e.target.value))}
                                />

                                <input
                                    className={styles.input}
                                    value={editReps}
                                    onChange={(e) => setEditReps(Number(e.target.value))}
                                />

                                <button className={styles.cancelButton} onClick={() => setEditingSet(null)}>
                                    Cancel
                                </button>
                                <button className={styles.saveButton} onClick={() => EditSet(setId)}>
                                    Save
                                </button>
                            </>
                        ) : (
                            <>
                                <span
                                    className={styles.setValue}
                                    onDoubleClick={!isEditable ? undefined : () => {
                                        setEditingSet(setId);
                                        setEditWeight(set.weight);
                                        setEditReps(set.reps);
                                    }}
                                >
                                    {set.weight} kg
                                </span>

                                <span
                                    className={styles.setValue}
                                    onDoubleClick={!isEditable ? undefined : () => {
                                        setEditingSet(setId);
                                        setEditWeight(set.weight);
                                        setEditReps(set.reps);
                                    }}
                                >
                                    {set.reps} reps
                                </span>
                                {session?.active && isEditable && <button
                                    onClick={() => onToggleSet?.(exercise, setId, exercise.rest)}
                                    style={{ backgroundColor: "green" }}
                                > ✓</button>}
                            </>
                        )}
                        {isDeletingSet &&
                            <button
                                className={styles.removeButton}
                                onClick={() => {
                                    DeleteSet(setId);
                                }}
                            >Remove</button>}
                    </div>
                ))}

            </div>
            {isAddingSet && (

                <div className={styles.addSetForm}>
                    <input placeholder="Weight.."
                        onChange={(e) => setNewWeight(Number(e.target.value))}
                    />

                    <input placeholder="Reps.."
                        onChange={(e) => setNewReps(Number(e.target.value))}
                    />
                    <button onClick={() => setIsAddingSet(false)}>cancel</button>
                </div>

            )
            }
            {isEditable && <>
                <button
                    onClick={() => isAddingSet ? Addset() : setIsAddingSet(true)}>
                    {!isAddingSet ? "Add set" : "Save"}</button>
                <button
                    onClick={() => isDeletingSet ? setisDeletingSet(false) : setisDeletingSet(true)}
                > {isDeletingSet ? "Cancel" : "Remove set"}</button>
            </>}
        </div >
    );
};