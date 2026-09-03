import styles from "./exerciseCard.module.css";
import type { ExerciseCardProps } from "../types";
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { formatTime } from "../assets/time";

export const ExerciseCard = ({ exercise, session, onUpdate, onToggleSet, isDone, isEditable = true }: ExerciseCardProps) => {

    const [addingSet, setAddingSet] = useState(false);
    const [deletingSet, setDeletingSet] = useState(false);
    const [editingSet, setEditingSet] = useState<string | null>(null);
    const [editingRest, setEditingRest] = useState<string | null>(null);
    const [editingWeight, setEditingWeight] = useState(0);
    const [editingReps, setEditingReps] = useState(0);
    const [newWeight, setNewWeight] = useState(0);
    const [newReps, setNewReps] = useState(0);
    const [newRest, setNewRest] = useState(0);

    const navigate = useNavigate();

    const workoutRef = doc(db, "workouts", exercise.docId);

    const isCardio = exercise.exerciseCategory.toLowerCase() === "cardio";

    const REST_OPTIONS = [0, 15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300];

    const addSet = async () => {
        try {
            // calcolo nuova chiave
            const keys = Object.keys(exercise.sets).map(Number);
            const newKey = keys.length === 0 ? 0 : Math.max(...keys) + 1;

            await updateDoc(workoutRef, {
                [`exercises.${exercise.id}.sets.${newKey}`]: {
                    reps: newReps,
                    weight: newWeight,
                }
            });

            setAddingSet(false);
            setNewWeight(0);
            setNewReps(0);
            onUpdate?.();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteSet = async (setId: string) => {
        try {
            await updateDoc(workoutRef, {
                [`exercises.${exercise.id}.sets.${setId}`]: deleteField()
            });
            setDeletingSet(false);
            onUpdate?.();
        } catch (err) {
            console.error(err);
        }
    };

    const editSet = async (setId: string) => {
        try {
            await updateDoc(workoutRef, {
                [`exercises.${exercise.id}.sets.${setId}`]: {
                    weight: editingWeight,
                    reps: editingReps,
                }
            });
            setEditingSet(null);
            onUpdate?.();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteExercise = async () => {
        try {
            await updateDoc(workoutRef, {
                [`exercises.${exercise.id}`]: deleteField()
            });
            onUpdate?.();
        } catch (err) {
            console.error(err);
        }
    };

    const changeRest = async () => {
        try {
            await updateDoc(workoutRef, {
                [`exercises.${exercise.id}.rest`]: newRest
            });
            onUpdate?.();
        } catch (err) {
            console.error(err);
        }
    };


    const startEditingSet = (setId: string, weight: number, reps: number) => {
        setEditingSet(setId);
        setEditingWeight(weight);
        setEditingReps(reps);
    };

    // gestisco navigazione a seguito di click
    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest("button, input, select, [data-no-nav]")) return; // se premo uno di questi non navigo
        if (!exercise.exerciseSourceId) return;

        navigate(`/exerciseInfo/${exercise.exerciseSourceId}/`);
    };

    return (
        <div className={styles.card} onClick={handleCardClick}>

            {isEditable && (
                <button
                    className={styles.deleteButton}
                    onClick={deleteExercise}
                    aria-label="Delete exercise"
                >
                    X
                </button>
            )}

            <h1 className={styles.title}>{exercise.exerciseName}</h1>

            {exercise.imageUrl ? (
                <img
                    className={styles.image}
                    src={exercise.imageUrl}
                    alt={exercise.exerciseName}
                    loading="lazy"
                />
            ) : (
                <div className={styles.noImageEmoji}>🏋️</div>
            )}

            <div className={styles.info}>
                {editingRest === exercise.id ? (
                    <>
                        <select
                            className={styles.restSelect}
                            data-no-nav
                            value={newRest}
                            onChange={(e) => setNewRest(Number(e.target.value))}
                        >
                            {REST_OPTIONS.map((seconds) => (
                                <option key={seconds} value={seconds}>
                                    {seconds === 0 ? "No rest" : formatTime(seconds)}
                                </option>
                            ))}
                        </select>
                        <button onClick={() => { changeRest(); setEditingRest(null); }}>
                            SAVE
                        </button>
                    </>
                ) : (
                    <span
                        data-no-nav
                        onClick={!isEditable ? undefined : () => {
                            setNewRest(exercise.rest);
                            setEditingRest(exercise.id);
                        }}
                    >
                        Rest: {exercise.rest === 0 ? "No rest" : formatTime(exercise.rest)}
                    </span>
                )}
            </div>

            <div className={styles.setsContainer}>
                {Object.entries(exercise.sets).map(([setId, set], index) => (
                    <div
                        key={setId}
                        className={
                            session?.completed.includes(`${exercise.id}-${setId}`)
                                ? styles.completedSet
                                : (isDone ? styles.notCompleted : styles.set)
                        }
                    >
                        <span className={styles.setLabel}>Set {index + 1}</span>

                        {editingSet === setId ? (
                            <>
                                <input
                                    className={styles.input}
                                    type="number"
                                    value={editingWeight}
                                    min={0}
                                    onChange={(e) => setEditingWeight(Number(e.target.value))}
                                />

                                <input
                                    className={styles.input}
                                    type="number"
                                    min={0}
                                    value={editingReps}
                                    onChange={(e) => setEditingReps(Number(e.target.value))}
                                />

                                <button className={styles.cancelButton} onClick={() => setEditingSet(null)} aria-label="Undo editing">
                                    Cancel
                                </button>
                                <button className={styles.saveButton} onClick={() => editSet(setId)}>
                                    Save
                                </button>
                            </>
                        ) : (
                            <>
                                {isCardio ? (
                                    <span className={styles.setValue}>-</span>
                                ) : (
                                    <span
                                        className={styles.setValue}
                                        data-no-nav
                                        onClick={!isEditable ? undefined : () =>
                                            startEditingSet(setId, set.weight, set.reps)}
                                    >
                                        {set.weight} kg
                                    </span>
                                )}

                                <span
                                    className={styles.setValue}
                                    data-no-nav
                                    onClick={!isEditable ? undefined : () =>
                                        startEditingSet(setId, set.weight, set.reps)}
                                >
                                    {set.reps} {isCardio ? "min" : "reps"}
                                </span>

                                {session?.active && isEditable && (
                                    <button
                                        className={styles.doneButton}
                                        onClick={() => onToggleSet?.(exercise, setId, exercise.rest)}
                                        aria-label="Mark set as completed"
                                    >
                                        ✓
                                    </button>
                                )}
                            </>
                        )}

                        {deletingSet && (
                            <button
                                className={styles.removeButton}
                                onClick={() => deleteSet(setId)}
                                aria-label="Remove the Set"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {addingSet && (
                <div className={styles.addSetForm}>
                    <input
                        type="number"
                        placeholder="Weight.."
                        min={0}
                        value={newWeight || ""}
                        onChange={(e) => setNewWeight(Number(e.target.value))}
                    />

                    <input
                        type="number"
                        placeholder="Reps.."
                        min={0}
                        value={newReps || ""}
                        onChange={(e) => setNewReps(Number(e.target.value))}
                    />

                    <button className={styles.cancelButton} onClick={() => setAddingSet(false)} aria-label="Undo Adding">
                        Cancel
                    </button>
                </div>
            )}

            {isEditable && (
                <div className={styles.addSetForm}>
                    <button onClick={() => addingSet ? addSet() : setAddingSet(true)}>
                        {addingSet ? "Save" : "Add set"}
                    </button>
                    <button
                        className={deletingSet ? styles.cancelButton : undefined}
                        onClick={() => setDeletingSet(prev => !prev)}
                    >
                        {deletingSet ? "Cancel" : "Remove set"}
                    </button>
                </div>
            )}
        </div>
    );
};
