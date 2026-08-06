
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useEffect, useState } from "react";
import type { Sets, HistoryProps, HistoryExercises } from "../types";
import { ExerciseCard } from "../components/exerciseCard";
import styles from "./history.module.css";
import { Navbar } from "../components/navbar";



export const History = () => {

    const [history, setHistory] = useState<HistoryExercises[]>([]);

    const deleteHistory = async (id: string) => {
        try {
            await deleteDoc(doc(db, "workoutsHistory", id))
        } catch (err) {
            console.error(err);
        }
        getHistory();
    }


    const getHistory = async () => {
        try {
            const workoutsHistoryRef = collection(db, "workoutsHistory");

            const snapshot = await getDocs(workoutsHistoryRef);

            const historyList: HistoryExercises[] = [];
            let i = 0;
            snapshot.forEach((doc) => {

                const workout = doc.data() as HistoryProps;

                const ex = Object.entries(workout.exercises);
                historyList.push({
                    docId: doc.id,
                    date: workout.date,
                    duration: workout.duration,
                    title: workout.title,
                    description: workout.description,
                    exercises: []
                })
                ex.forEach(([exerciseId, exercise]) => {

                    const updatedSet: Record<string, Sets> = {};
                    Object.entries(workout.exercises[exerciseId].sets).forEach(([id, set]) => {

                        updatedSet[id] = {
                            ...set,
                            completed: false
                        };
                    })

                    historyList[i].exercises.push({
                        docId: doc.id,
                        id: exerciseId,
                        exerciseName: exercise.exerciseName,
                        exerciseOrder: exercise.exerciseOrder,
                        exerciseSourceId: exercise.exerciseSourceId,
                        imageUrl: exercise.imageUrl,
                        muscleGroup: exercise.muscleGroup,
                        rest: exercise.rest,
                        sets: updatedSet,
                    });
                });
                i += 1;
            });

            for (const ele of historyList) {
                ele.exercises.sort((a, b) => a.exerciseOrder - b.exerciseOrder)
            }
            historyList.sort((a, b) => a.date.seconds - b.date.seconds)
            console.log(historyList);
            setHistory(historyList);
        } catch (err) {
            console.error(err);
        }

    }

    useEffect(() => {
        getHistory();
    }, [])

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                {history.length === 0 ? (
                    <p className={styles.empty}>No workouts completed yet.</p>
                ) : (
                    history.map((field) => (
                        <div key={field.date.seconds} className={styles.historyCard}>
                            <button
                                onClick={() => deleteHistory(field.docId)}
                            >X</button>
                            <div className={styles.header}>
                                <div>
                                    <h1 className={styles.title}>{field.title}</h1>
                                    <p className={styles.date}>
                                        {field.date.toDate().toLocaleDateString("it-IT")}
                                    </p>
                                </div>

                                <span className={styles.duration}>
                                    {field.duration} s
                                </span>
                            </div>

                            {field.description && <p className={styles.description}>
                                {field.description}
                            </p>}

                            <div className={styles.exercises}>
                                {field.exercises.map((exercise) => (
                                    <ExerciseCard
                                        key={exercise.id}
                                        exercise={exercise}
                                        isEditable={false}
                                    />
                                ))}
                            </div>

                        </div>
                    ))
                )}
            </div>
        </>
    );


}